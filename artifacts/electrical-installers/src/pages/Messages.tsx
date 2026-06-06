import {
  useCreateThread,
  useGetThread,
  useCreateThreadMessage,
  getGetThreadQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Send, ImagePlus, X, MessageSquare, ChevronLeft } from "lucide-react";

const STORAGE_KEY = "ei_message_thread";
const MAX_PHOTO_BYTES = 1_500_000;

type StoredThread = { id: number; token: string };

function loadStored(): StoredThread | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === "number" && typeof parsed?.token === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white" onClick={onClose}>
        <X size={28} />
      </button>
      <img src={src} alt="attachment" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function StartForm({ onStarted }: { onStarted: (stored: StoredThread) => void }) {
  const createThread = useCreateThread();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is too large (max ~1.5MB). Please choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result as string); setError(null); };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("Please fill in your name, phone, and a message.");
      return;
    }
    createThread.mutate(
      {
        data: {
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          referenceType: reference.trim() ? "reference" : undefined,
          referenceId: reference.trim() || undefined,
          message: message.trim(),
          photoUrl: photo ?? undefined,
        },
      },
      {
        onSuccess: (thread) => {
          const stored: StoredThread = { id: thread.id, token: thread.accessToken };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          onStarted(stored);
        },
        onError: () => setError("Something went wrong. Please try again or call us."),
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)] mb-3">
          <MessageSquare size={26} />
        </div>
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Message Us</h1>
        <p className="text-sm text-gray-500 mt-1">Send us a private message and we'll reply here. You can attach a photo too.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="msg-name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="msg-phone" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="msg-email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Booking/Quote reference (optional)</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. quote #123" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]" data-testid="msg-reference" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] resize-none" data-testid="msg-body" />
      </div>

      {photo && (
        <div className="relative inline-block">
          <img src={photo} alt="preview" className="h-20 rounded-lg border border-gray-200" />
          <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" id="msg-photo" />
        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50" data-testid="msg-attach">
          <ImagePlus size={16} /> Attach photo
        </button>
        <button type="submit" disabled={createThread.isPending} className="flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white font-semibold rounded-lg px-5 py-2.5 disabled:opacity-50 hover:bg-[hsl(25,95%,48%)] transition-colors" data-testid="msg-send">
          <Send size={16} /> Send message
        </button>
      </div>
    </form>
  );
}

function Conversation({ stored, onReset }: { stored: StoredThread; onReset: () => void }) {
  const queryClient = useQueryClient();
  const threadId = stored.id;
  const { data: thread, isLoading, isError } = useGetThread(threadId, { token: stored.token }, {
    query: { queryKey: getGetThreadQueryKey(threadId, { token: stored.token }), refetchInterval: 6000 },
  });
  const sendMessage = useCreateThreadMessage();
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = thread?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    if (isError) {
      localStorage.removeItem(STORAGE_KEY);
      onReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is too large (max ~1.5MB). Please choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result as string); setError(null); };
    reader.readAsDataURL(file);
  }

  function handleSend() {
    if (!body.trim() && !photo) return;
    sendMessage.mutate(
      { id: threadId, params: { token: stored.token }, data: { body: body.trim() || "(photo)", photoUrl: photo ?? undefined } },
      {
        onSuccess: () => {
          setBody("");
          setPhoto(null);
          if (fileRef.current) fileRef.current.value = "";
          queryClient.invalidateQueries({ queryKey: getGetThreadQueryKey(threadId, { token: stored.token }) });
        },
      }
    );
  }

  function startNew() {
    localStorage.removeItem(STORAGE_KEY);
    onReset();
  }

  if (isLoading) return <div className="py-20 text-center text-gray-400">Loading conversation…</div>;

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)] flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <p className="font-semibold text-sm text-[hsl(214,60%,14%)]">Electrical Installers</p>
            <p className="text-[11px] text-gray-400">We'll reply here — check back anytime</p>
          </div>
        </div>
        <button onClick={startNew} className="text-xs text-gray-500 hover:text-[hsl(25,95%,53%)] flex items-center gap-1">
          <ChevronLeft size={14} /> New message
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[hsl(210,20%,98%)]">
        {messages.map((m) => {
          const isCustomer = m.sender === "customer";
          return (
            <div key={m.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isCustomer ? "bg-[hsl(25,95%,53%)] text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"}`}>
                {m.photoUrl && (
                  <img src={m.photoUrl} alt="attachment" className="rounded-lg mb-2 max-h-52 cursor-pointer object-cover" onClick={() => setLightbox(m.photoUrl ?? null)} />
                )}
                {m.body && m.body !== "(photo)" && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                <p className={`text-[10px] mt-1 ${isCustomer ? "text-white/70" : "text-gray-400"}`}>
                  {new Date(m.createdAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        {photo && (
          <div className="relative inline-block mb-2">
            <img src={photo} alt="preview" className="h-16 rounded-lg border border-gray-200" />
            <button onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5">
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" id="conv-photo" />
          <button onClick={() => fileRef.current?.click()} className="p-2 text-gray-500 hover:text-[hsl(25,95%,53%)] rounded-lg hover:bg-gray-100" title="Attach photo" data-testid="conv-attach">
            <ImagePlus size={20} />
          </button>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] max-h-32"
            data-testid="conv-input"
          />
          <button onClick={handleSend} disabled={sendMessage.isPending || (!body.trim() && !photo)} className="bg-[hsl(25,95%,53%)] text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-[hsl(25,95%,48%)] transition-colors" data-testid="conv-send">
            <Send size={18} />
          </button>
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default function MessagesPage() {
  const [stored, setStored] = useState<StoredThread | null>(() => loadStored());

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {stored ? (
        <Conversation stored={stored} onReset={() => setStored(null)} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <StartForm onStarted={setStored} />
        </div>
      )}
    </div>
  );
}
