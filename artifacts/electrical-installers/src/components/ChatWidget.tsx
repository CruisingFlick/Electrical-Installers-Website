import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Phone, Loader2, Bot, Mic, MicOff } from "lucide-react";
import { useVoiceRecorder } from "@workspace/integrations-openai-ai-react";

// TODO: useAudioPlayback from @workspace/integrations-openai-ai-react is not wired up.
// It is designed for streaming PCM16 audio via AudioWorklet, not text-to-speech.
// To add TTS playback of assistant replies, a /api/openai/tts endpoint returning
// PCM16 audio would be needed, along with copying audio-playback-worklet.js to public/.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type VoiceStatus = "idle" | "recording" | "transcribing" | "error";

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function createConversation(): Promise<number> {
  const res = await fetch(`${BASE}/api/openai/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Website Chat" }),
  });
  const data = await res.json() as { id: number };
  return data.id;
}

async function* streamMessage(
  conversationId: number,
  content: string
): AsyncGenerator<string> {
  const res = await fetch(
    `${BASE}/api/openai/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6);
      const parsed = JSON.parse(json) as { content?: string; done?: boolean; error?: string };
      if (parsed.content) yield parsed.content;
      if (parsed.error) yield parsed.error;
      if (parsed.done) return;
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function transcribeAudio(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  const res = await fetch(`${BASE}/api/openai/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: base64, mimeType: blob.type }),
  });
  if (!res.ok) throw new Error("Transcription failed");
  const data = await res.json() as { text: string };
  return data.text;
}

const QUICK_QUESTIONS = [
  "What areas do you service?",
  "How do I book a quote?",
  "What is underground power?",
  "Do you do 3-phase upgrades?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startRecording, stopRecording } = useVoiceRecorder();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm the Electrical Installers assistant. I can help with questions about our services, booking, or the underground power process. How can I help you today?",
        },
      ]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;
    setInput("");
    setStreaming(true);

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);

    let convId = conversationId;
    if (!convId) {
      try {
        convId = await createConversation();
        setConversationId(convId);
      } catch {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Sorry, couldn't start a conversation. Please call us on 0419 868 703.",
          };
          return copy;
        });
        setStreaming(false);
        return;
      }
    }

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      for await (const chunk of streamMessage(convId, text.trim())) {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please call us on 0419 868 703.",
        };
        return copy;
      });
    }

    setStreaming(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  async function handleMicClick() {
    if (voiceStatus === "recording") {
      try {
        const blob = await stopRecording();
        if (blob.size === 0) {
          setVoiceStatus("idle");
          return;
        }
        setVoiceStatus("transcribing");
        const text = await transcribeAudio(blob);
        setInput(text);
        setVoiceStatus("idle");
        setVoiceError(null);
        setTimeout(() => inputRef.current?.focus(), 50);
      } catch {
        setVoiceStatus("error");
        setVoiceError("Transcription failed. Please type instead.");
      }
    } else {
      setVoiceError(null);
      try {
        await startRecording();
        setVoiceStatus("recording");
      } catch (err) {
        const isDenied =
          err instanceof Error &&
          (err.name === "NotAllowedError" || err.message.toLowerCase().includes("permission"));
        setVoiceStatus("error");
        setVoiceError(
          isDenied
            ? "Microphone access denied. Check browser settings."
            : "Could not start recording."
        );
      }
    }
  }

  const micDisabled = voiceStatus === "transcribing" || streaming;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 bottom-20 sm:bottom-6 z-40 flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white px-4 py-2.5 rounded-full shadow-lg hover:bg-[hsl(25,95%,45%)] transition-colors text-sm font-semibold"
        aria-label="Open chat"
        data-testid="chat-toggle"
      >
        {open ? <X size={16} /> : <MessageCircle size={16} />}
        <span className="hidden sm:inline">{open ? "Close" : "Chat with us"}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed left-4 bottom-24 sm:bottom-20 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100vh - 140px))" }}
          data-testid="chat-panel"
        >
          {/* Header */}
          <div className="bg-[hsl(214,60%,14%)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[hsl(25,95%,53%)] rounded-full p-1">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Electrical Installers</p>
                <p className="text-gray-300 text-xs">AI Assistant · Usually replies instantly</p>
              </div>
            </div>
            <a
              href="tel:0419868703"
              className="flex items-center gap-1 text-xs text-[hsl(25,95%,63%)] hover:text-white transition-colors font-medium"
            >
              <Phone size={13} />
              <span className="hidden sm:inline">0419 868 703</span>
            </a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[hsl(214,60%,14%)] text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center py-0.5">
                      <Loader2 size={12} className="animate-spin text-gray-400" />
                      <span className="text-gray-400 text-xs">Typing…</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (shown when no user messages yet) */}
          {messages.filter((m) => m.role === "user").length === 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[hsl(25,95%,53%)] text-[hsl(25,95%,40%)] hover:bg-[hsl(25,95%,97%)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Voice error message */}
          {voiceError && (
            <p className="px-4 pb-1 text-xs text-red-500">{voiceError}</p>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2">
            {/* Mic button */}
            <button
              onClick={handleMicClick}
              disabled={micDisabled}
              aria-label={voiceStatus === "recording" ? "Stop recording" : "Start voice input"}
              className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors ${
                voiceStatus === "recording"
                  ? "bg-red-500 animate-pulse text-white"
                  : voiceStatus === "transcribing"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : voiceStatus === "error"
                  ? "bg-red-50 text-red-400 hover:bg-red-100"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {voiceStatus === "transcribing" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : voiceStatus === "recording" ? (
                <MicOff size={16} />
              ) : voiceStatus === "error" ? (
                <MicOff size={16} />
              ) : (
                <Mic size={16} />
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={voiceStatus === "recording" ? "Recording… tap mic to stop" : "Ask a question…"}
              disabled={streaming || voiceStatus === "recording" || voiceStatus === "transcribing"}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] disabled:bg-gray-50"
              data-testid="chat-input"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[hsl(25,95%,53%)] text-white disabled:opacity-40 hover:bg-[hsl(25,95%,45%)] transition-colors"
              data-testid="chat-send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
