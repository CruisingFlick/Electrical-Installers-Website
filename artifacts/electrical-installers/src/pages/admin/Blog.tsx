import { useState } from "react";
import {
  useListAllBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  getListAllBlogPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Plus, Pencil, Trash2, BookOpen, Eye, EyeOff, X, Save, Tag, Calendar, AlertCircle } from "lucide-react";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string | null;
  category: string;
  status: "draft" | "published";
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = ["tips", "guides", "safety", "news", "case-studies"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  status: "draft" | "published";
};

const BLANK: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  category: "tips",
  status: "draft",
};

function PostModal({
  post,
  onClose,
}: {
  post: BlogPost | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const [form, setForm] = useState<FormState>(
    post
      ? {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          imageUrl: post.imageUrl ?? "",
          category: post.category,
          status: post.status,
        }
      : BLANK
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(v: string) {
    setForm((f) => ({
      ...f,
      title: v,
      slug: post ? f.slug : slugify(v),
    }));
  }

  async function handleSave() {
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      setError("Title, slug, excerpt, and content are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (post) {
        await updatePost.mutateAsync({ id: post.id, data: { ...form, imageUrl: form.imageUrl || undefined } });
      } else {
        await createPost.mutateAsync({ data: { ...form, imageUrl: form.imageUrl || undefined } });
      }
      await queryClient.invalidateQueries({ queryKey: getListAllBlogPostsQueryKey() });
      onClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Failed to save. Please check all fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]";

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[hsl(214,60%,14%)]">
            <h2 className="text-lg font-bold text-white">{post ? "Edit Post" : "New Blog Post"}</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={inputClass}
                placeholder="e.g. 5 Signs Your Switchboard Needs Upgrading"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Slug * <span className="text-gray-400">(URL path)</span></label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className={inputClass}
                  placeholder="switchboard-upgrade-signs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Excerpt * <span className="text-gray-400">(short summary shown in listing)</span></label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                className={inputClass}
                placeholder="A brief 1-2 sentence summary of the article…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Content * <span className="text-gray-400">(full article text)</span></label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                className={inputClass + " font-mono text-xs leading-relaxed"}
                placeholder="Write your article here…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Image URL <span className="text-gray-400">(optional)</span></label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Status</label>
              <div className="flex gap-3">
                {(["draft", "published"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.status === s
                        ? "border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/5 text-[hsl(25,95%,45%)]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {s === "published" ? <Eye size={14} /> : <EyeOff size={14} />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[hsl(25,95%,53%)] text-white text-sm font-semibold hover:bg-[hsl(25,95%,45%)] disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Saving…" : post ? "Update Post" : "Publish Post"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminBlog() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useListAllBlogPosts();
  const deletePost = useDeleteBlogPost();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  async function handleDelete(id: number) {
    await deletePost.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListAllBlogPostsQueryKey() });
    setConfirmDelete(null);
  }

  const typedPosts = posts as BlogPost[];
  const published = typedPosts.filter((p) => p.status === "published").length;
  const drafts = typedPosts.filter((p) => p.status === "draft").length;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Blog &amp; Tips</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {typedPosts.length} articles · {published} published · {drafts} draft
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors"
          >
            <Plus size={16} />
            New Post
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Total Articles</p>
            <p className="text-2xl font-bold text-[hsl(214,60%,14%)]">{typedPosts.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Published</p>
            <p className="text-2xl font-bold text-green-600">{published}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Drafts</p>
            <p className="text-2xl font-bold text-amber-600">{drafts}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="bg-gray-100 h-16 rounded-xl animate-pulse" />)}</div>
        ) : typedPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Create your first article to share tips with customers.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              {typedPosts.length} article{typedPosts.length !== 1 ? "s" : ""}
            </div>
            <div className="divide-y divide-gray-50">
              {typedPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-sm text-[hsl(214,60%,14%)] truncate">{post.title}</p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          post.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1 capitalize">
                        <Tag size={10} />
                        {post.category}
                      </span>
                      {post.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(post.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                      <span className="text-gray-300">/blog/{post.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditing(post); setShowModal(true); }}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    {confirmDelete === post.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(post.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <PostModal
          post={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </AdminLayout>
  );
}
