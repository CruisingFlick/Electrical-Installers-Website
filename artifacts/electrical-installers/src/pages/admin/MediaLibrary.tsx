import { useState, useRef } from "react";
import {
  useListMediaItems,
  useCreateMediaItem,
  useDeleteMediaItem,
  useUpdateMediaItem,
  getListMediaItemsQueryKey,
} from "@workspace/api-client-react";
import type { MediaItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Trash2,
  X,
  Search,
  Tag,
  Pencil,
  Check,
  Images,
  Copy,
  CheckCheck,
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const CATEGORIES = [
  "New Homes",
  "Renovations",
  "3-Phase Upgrade",
  "Underground Power",
  "Commercial",
  "Other",
];

function compressImage(file: File, maxPx = 1400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas context unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function EditModal({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const updateMutation = useUpdateMediaItem();
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category ?? "");
  const [tagInput, setTagInput] = useState(item.tags.join(", "));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          title: title.trim() || item.filename,
          category: category || undefined,
          tags: tagInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
      await qc.invalidateQueries({ queryKey: getListMediaItemsQueryKey() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-[hsl(214,60%,14%)]">Edit Photo Details</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <img
            src={item.imageData}
            alt={item.title}
            className="w-full h-40 object-cover rounded-lg"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              placeholder={item.filename}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
            >
              <option value="">— None —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              placeholder="before, switchboard, frankston"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-[hsl(25,95%,53%)] text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({
  item,
  onDelete,
}: {
  item: MediaItem;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyData() {
    navigator.clipboard.writeText(item.imageData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {editing && <EditModal item={item} onClose={() => setEditing(false)} />}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative">
          <img
            src={item.imageData}
            alt={item.title}
            className="w-full h-44 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyData}
              title="Copy image data"
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white shadow text-gray-700"
            >
              {copied ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
            <button
              onClick={() => setEditing(true)}
              title="Edit details"
              className="p-1.5 bg-white/90 rounded-lg hover:bg-white shadow text-gray-700"
            >
              <Pencil size={14} />
            </button>
            {confirmDelete ? (
              <>
                <button
                  onClick={() => onDelete(item.id)}
                  title="Confirm delete"
                  className="p-1.5 bg-red-500 rounded-lg hover:bg-red-600 shadow text-white"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  title="Cancel"
                  className="p-1.5 bg-white/90 rounded-lg hover:bg-white shadow text-gray-700"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete photo"
                className="p-1.5 bg-white/90 rounded-lg hover:bg-white shadow text-red-500"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {item.category && (
            <span className="absolute bottom-2 left-2 text-xs bg-[hsl(214,60%,14%)]/80 text-white px-2 py-0.5 rounded-full">
              {item.category}
            </span>
          )}
        </div>
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-800 truncate" title={item.title}>
            {item.title}
          </p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(item.createdAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </>
  );
}

export default function AdminMediaLibrary() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useListMediaItems();
  const createMutation = useCreateMediaItem();
  const deleteMutation = useDeleteMediaItem();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const fileArr = Array.from(files);
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      try {
        const imageData = await compressImage(file);
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        await createMutation.mutateAsync({
          data: {
            title,
            filename: file.name,
            imageData,
          },
        });
      } catch (err) {
        console.error("Failed to upload", file.name, err);
      }
      setUploadProgress(Math.round(((i + 1) / fileArr.length) * 100));
    }
    await qc.invalidateQueries({ queryKey: getListMediaItemsQueryKey() });
    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: number) {
    await deleteMutation.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey: getListMediaItemsQueryKey() });
  }

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      filterCategory === "All" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Media Library</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {items.length} photo{items.length !== 1 ? "s" : ""} stored
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            <Upload size={16} />
            {uploading ? `Uploading… ${uploadProgress}%` : "Upload Photos"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Drag & drop zone — visible when library is empty */}
        {!isLoading && items.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-[hsl(25,95%,53%)] bg-orange-50"
                : "border-gray-200 hover:border-[hsl(25,95%,53%)] hover:bg-orange-50/50"
            }`}
          >
            <Images size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">Drag and drop photos here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse — supports JPG, PNG, WebP</p>
          </div>
        )}

        {/* Filters — only when there are items */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, filename or tag…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-gray-400 flex-shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,95%,53%)]"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[hsl(25,95%,53%)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Drop zone overlay for populated library */}
        {items.length > 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-xl p-4 text-center text-sm transition-colors ${
              dragOver
                ? "border-[hsl(25,95%,53%)] bg-orange-50 text-orange-600"
                : "border-gray-100 text-gray-400"
            }`}
          >
            {dragOver ? "Drop to upload" : "Or drag photos anywhere here to upload"}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((item) => (
              <PhotoCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Empty filtered state */}
        {!isLoading && items.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search size={32} className="mx-auto mb-2 opacity-40" />
            <p>No photos match your search</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
