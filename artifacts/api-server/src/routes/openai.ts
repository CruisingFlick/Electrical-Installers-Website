import { Router } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { CreateOpenaiConversationBody, SendOpenaiMessageBody, ListOpenaiMessagesParams } from "@workspace/api-zod";

const router = Router();

const SYSTEM_PROMPT = `You are a helpful assistant for Electrical Installers, a licensed electrical contracting business serving the Mornington Peninsula, St Kilda, and Warragul areas in Victoria, Australia.

You help visitors with:
- Answering questions about electrical services (new homes, renovations, 3-phase upgrades, underground power, commercial/industrial work)
- Explaining the underground power (United Energy) process
- Helping customers understand what type of booking they need (consulting, quoting, or work)
- Capturing contact details and directing customers to book online or call
- Providing general information about pricing expectations (note: exact quotes require a site visit or virtual quote)

Business details:
- Phone: 0419 868 703
- Email: info@electricalinstallers.com.au
- Service areas: Mornington Peninsula, Bayside, South East Melbourne corridor, St Kilda, Warragul
- REC Number: REC 25510 (Victorian Licensed Electrical Inspector)
- ABN: 35 608 171 802

Services offered:
- New home electrical installations
- Home renovations and extensions
- 3-phase power upgrades
- Underground power conversions (United Energy process — 5 steps, typically takes several months)
- Switchboard upgrades and safety checks
- Commercial and industrial electrical work
- Fault finding and repairs
- Safety inspections and certificates

Booking types available on the website:
- Consulting: for advice and planning
- Quoting: for a price estimate (can be virtual via photo upload)
- Work: to schedule actual electrical work

Always be friendly, professional, and concise. If someone wants to book, direct them to the Book page at /book or the Quote page at /quote. For urgent or after-hours enquiries, always give the phone number 0419 868 703. Never make up specific prices — always suggest a virtual quote or site visit for accurate pricing. Keep responses brief and helpful.`;

// POST /openai/conversations — create a new conversation
router.post("/conversations", async (req, res) => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [conversation] = await db
    .insert(conversationsTable)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json({
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
  });
});

// GET /openai/conversations/:id/messages — list messages
router.get("/conversations/:id/messages", async (req, res) => {
  const parsed = ListOpenaiMessagesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const id = parsed.data.id;

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversationsTable.id, id),
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  res.json(
    msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

// POST /openai/conversations/:id/messages — send a message (streaming SSE)
router.post("/conversations/:id/messages", async (req, res) => {
  const paramsParsed = ListOpenaiMessagesParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const id = paramsParsed.data.id;

  const bodyParsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversationsTable.id, id),
  });
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messagesTable).values({
    conversationId: id,
    role: "user",
    content: bodyParsed.data.content,
  });

  // Get history
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error(err, "OpenAI stream error");
    res.write(`data: ${JSON.stringify({ error: "Sorry, something went wrong. Please call us on 0419 868 703." })}\n\n`);
  }

  res.end();
});

export default router;
