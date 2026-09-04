import {
  useListThreads,
  useGetAdminThread,
  useReplyToThread,
  useUpdateThread,
  getListThreadsQueryKey,
  getGetAdminThreadQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { X, Send, ImagePlus, MessageSquare, Phone, Mail, Check, CheckCheck, CircleAlert } from "lucide-react";
import AdminLayout from "./AdminLayout";

type Thread = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  status: string;
  unreadForAdmin: number;
  unreadForCustomer: number;
  createdAt: string;
  updatedAt: string;
};

const MAX_PHOTO_BYTES = 1_500_000;

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

function ConversationView({ threadId }: { threadId: number }) {
  const queryClient = useQueryClient();
  const { data: thread, isLoading } = useGetAdminThread(threadId, {
    query: { queryKey: getGetAdminThreadQueryKey(threadId), refetchInterval: 8000 },
  });
  const reply = useReplyToThread();
  const updateThread = useUpdateThread();
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
    if (thread && thread.unreadForAdmin > 0) {
      updateThread.mutate(
        { id: threadId, data: { markReadForAdmin: true } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListThreadsQueryKey() }) }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is too large (max ~1.5MB). Please choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleSend() {
    if (!body.trim() && !photo) return;
    reply.mutate(
      { id: threadId, data: { body: body.trim() || "(photo)", photoUrl: photo ?? undefined } },
      {
        onSuccess: () => {
          setBody("");
          setPhoto(null);
          if (fileRef.current) fileRef.current.value = "";
          queryClient.invalidateQueries({ queryKey: getGetAdminThreadQueryKey(threadId) });
          queryClient.invalidateQueries({ queryKey: getListThreadsQueryKey() });
        },
      }
    );
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>;
  if (!thread) return <div className="flex-1 flex items-center justify-center text-gray-400">Conversation not found.</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-3 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-[hsl(214,60%,14%)]">{thread.customerName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
              <a href={`tel:${thread.customerPhone}`} className="flex items-center gap-1 hover:text-[hsl(25,95%,53%)]">
                <Phone size={12} /> {thread.customerPhone}
              </a>
              {thread.customerEmail && (
                <a href={`mailto:${thread.customerEmail}`} className="flex items-center gap-1 hover:text-[hsl(25,95%,53%)]">
                  <Mail size={12} /> {thread.customerEmail}
                </a>
              )}
            </p>
            {thread.referenceType && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Re: {thread.referenceType}{thread.referenceId ? ` #${thread.referenceId}` : ""}
              </p>
            )}
          </div>
          <select
            value={thread.status}
            onChange={(e) =>
              updateThread.mutate(
                { id: threadId, data: { status: e.target.value as "open" | "closed" } },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getGetAdminThreadQueryKey(threadId) });
                    queryClient.invalidateQueries({ queryKey: getListThreadsQueryKey() });
                  },
                }
              )
            }
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
            data-testid="thread-status-select"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[hsl(210,20%,98%)]">
        {messages.map((m) => {
          const isAdmin = m.sender === "admin";
          return (
            <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isAdmin ? "bg-[hsl(25,95%,53%)] text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                }`}
              >
                {m.photoUrl && (
                  <img
                    src={m.photoUrl}
                    alt="attachment"
                    className="rounded-lg mb-2 max-h-48 cursor-pointer object-cover"
                    onClick={() => setLightbox(m.photoUrl ?? null)}
                  />
                )}
                {m.body && m.body !== "(photo)" && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isAdmin ? "text-white/80 justify-end" : "text-gray-400"}`}>
                  <span>{new Date(m.createdAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</span>
                  {isAdmin && m.smsStatus === "delivered" && <><CheckCheck size={12} aria-hidden="true" /><span>Delivered</span></>}
                  {isAdmin && m.smsStatus === "failed" && <><CircleAlert size={12} aria-hidden="true" /><span>Failed</span></>}
                  {isAdmin && m.smsStatus === "sent" && <><Check size={12} aria-hidden="true" /><span>Sent</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        {photo && (
          <div className="relative inline-block mb-2">
            <img src={photo} alt="preview" className="h-16 rounded-lg border border-gray-200" />
            <button
              onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" id="admin-photo-input" />
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2 text-gray-500 hover:text-[hsl(25,95%,53%)] rounded-lg hover:bg-gray-100"
            title="Attach photo"
            data-testid="admin-attach-photo"
          >
            <ImagePlus size={20} />
          </button>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a reply…"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)] max-h-32"
            data-testid="admin-reply-input"
          />
          <button
            onClick={handleSend}
            disabled={reply.isPending || (!body.trim() && !photo)}
            className="bg-[hsl(25,95%,53%)] text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-[hsl(25,95%,48%)] transition-colors"
            data-testid="admin-send-reply"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

export default function AdminMessages() {
  const { data: threads = [], isLoading } = useListThreads({ query: { queryKey: getListThreadsQueryKey(), refetchInterval: 8000 } });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const active = (threads as Thread[]).find((t) => t.id === selectedId) ?? null;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-4">Messages</h1>
        <div className="flex-1 flex min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Thread list */}
          <div className={`w-full sm:w-72 border-r border-gray-100 flex flex-col ${active ? "hidden sm:flex" : "flex"}`}>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No messages yet.</div>
              ) : (
                (threads as Thread[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selectedId === t.id ? "bg-[hsl(210,20%,96%)]" : ""
                    }`}
                    data-testid={`thread-item-${t.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-[hsl(214,60%,14%)] truncate">{t.customerName}</span>
                      {t.unreadForAdmin > 0 && (
                        <span className="bg-[hsl(25,95%,53%)] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {t.unreadForAdmin}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">{t.customerPhone}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className={`flex-1 flex flex-col min-w-0 ${active ? "flex" : "hidden sm:flex"}`}>
            {active ? (
              <>
                <button
                  onClick={() => setSelectedId(null)}
                  className="sm:hidden text-sm text-[hsl(25,95%,53%)] px-4 py-2 text-left"
                >
                  ← Back to messages
                </button>
                <ConversationView threadId={active.id} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                <MessageSquare size={48} />
                <p className="mt-3 text-sm text-gray-400">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
