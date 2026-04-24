import { useState, useRef, useCallback } from "react";
import { useListPortfolioItems, useCreatePortfolioItem, useDeletePortfolioItem, useUpdatePortfolioItem, getListPortfolioItemsQueryKey } from "@workspace/api-client-react";
import type { PortfolioItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X, ImagePlus, Pencil } from "lucide-react";
import AdminLayout from "./AdminLayout";

interface PortfolioForm {
  title: string;
  description: string;
  category: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  suburb: string;
  completedDate: string;
}

function PhotoDropZone({
  label,
  required,
  value,
  onChange,
  testId,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (dataUrl: string) => void;
  testId?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {value ? (
        <div className="relative">
          <img src={value} alt="Preview" className="w-full h-36 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => { onChange(""); if (ref.current) ref.current.value = ""; }}
            className="absolute top-1.5 right-1.5 bg-white rounded-full p-1 shadow border border-gray-200 text-gray-500 hover:text-red-500"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => ref.current?.click()}
          className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg py-6 cursor-pointer transition-colors text-center ${
            isDragOver ? "border-[hsl(25,95%,53%)] bg-[hsl(25,95%,53%)]/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
          data-testid={testId}
        >
          <ImagePlus size={22} className="text-gray-400" />
          <p className="text-xs text-gray-500">Drag &amp; drop or click to upload</p>
          <input
            ref={ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM: PortfolioForm = {
  title: "", description: "", category: "", beforeImageUrl: "", afterImageUrl: "", suburb: "", completedDate: "",
};

const CATEGORIES = ["New Homes", "Renovations", "3-Phase Upgrade", "Underground Power", "Commercial"];

function PortfolioFormModal({
  title,
  form,
  onChange,
  onPhotoChange,
  onSubmit,
  onClose,
  isPending,
  submitLabel,
  requireAfterPhoto,
}: {
  title: string;
  form: PortfolioForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onPhotoChange: (field: "afterImageUrl" | "beforeImageUrl", url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isPending: boolean;
  submitLabel: string;
  requireAfterPhoto: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-[hsl(214,60%,14%)]">{title}</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={onChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-portfolio-title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={form.description} onChange={onChange} required rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-portfolio-description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select name="category" value={form.category} onChange={onChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="select-portfolio-category">
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb <span className="text-red-500">*</span></label>
              <input name="suburb" value={form.suburb} onChange={onChange} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-portfolio-suburb" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date <span className="text-red-500">*</span></label>
            <input name="completedDate" value={form.completedDate} onChange={onChange} required type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" data-testid="input-portfolio-date" />
          </div>
          <PhotoDropZone
            label="After Photo"
            required={requireAfterPhoto}
            value={form.afterImageUrl}
            onChange={(url) => onPhotoChange("afterImageUrl", url)}
            testId="input-portfolio-after-image"
          />
          <PhotoDropZone
            label="Before Photo (optional)"
            value={form.beforeImageUrl}
            onChange={(url) => onPhotoChange("beforeImageUrl", url)}
            testId="input-portfolio-before-image"
          />
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending || (requireAfterPhoto && !form.afterImageUrl)}
              className="flex-1 bg-[hsl(25,95%,53%)] text-white font-medium py-2 rounded-lg text-sm hover:bg-[hsl(25,95%,45%)] disabled:opacity-60"
              data-testid="button-save-portfolio"
            >
              {isPending ? "Saving..." : submitLabel}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPortfolio() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useListPortfolioItems();
  const create = useCreatePortfolioItem();
  const update = useUpdatePortfolioItem();
  const del = useDeletePortfolioItem();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<PortfolioForm>(EMPTY_FORM);

  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editForm, setEditForm] = useState<PortfolioForm>(EMPTY_FORM);

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setAddForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function openEdit(item: PortfolioItem) {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description,
      category: item.category,
      beforeImageUrl: item.beforeImageUrl ?? "",
      afterImageUrl: item.afterImageUrl,
      suburb: item.suburb,
      completedDate: item.completedDate,
    });
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({ data: { ...addForm, beforeImageUrl: addForm.beforeImageUrl || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPortfolioItemsQueryKey() });
        setShowAddForm(false);
        setAddForm(EMPTY_FORM);
      },
    });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    update.mutate(
      {
        id: editingItem.id,
        data: { ...editForm, beforeImageUrl: editForm.beforeImageUrl || undefined },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPortfolioItemsQueryKey() });
          setEditingItem(null);
          setEditForm(EMPTY_FORM);
        },
      }
    );
  }

  function handleDelete(id: number) {
    if (confirm("Delete this portfolio item?")) {
      del.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPortfolioItemsQueryKey() }) });
    }
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">Portfolio</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(25,95%,45%)] transition-colors"
            data-testid="button-add-portfolio"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {showAddForm && (
          <PortfolioFormModal
            title="Add Portfolio Item"
            form={addForm}
            onChange={handleAddChange}
            onPhotoChange={(field, url) => setAddForm(f => ({ ...f, [field]: url }))}
            onSubmit={handleAddSubmit}
            onClose={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
            isPending={create.isPending}
            submitLabel="Save Item"
            requireAfterPhoto={true}
          />
        )}

        {editingItem && (
          <PortfolioFormModal
            title="Edit Portfolio Item"
            form={editForm}
            onChange={handleEditChange}
            onPhotoChange={(field, url) => setEditForm(f => ({ ...f, [field]: url }))}
            onSubmit={handleEditSubmit}
            onClose={() => { setEditingItem(null); setEditForm(EMPTY_FORM); }}
            isPending={update.isPending}
            submitLabel="Save Changes"
            requireAfterPhoto={false}
          />
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-gray-100 h-48 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No portfolio items yet. Add your first one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" data-testid={`portfolio-admin-item-${item.id}`}>
                <div className="h-40 bg-gray-100 overflow-hidden">
                  <img src={item.afterImageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400"; }} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[hsl(25,95%,53%)] font-semibold">{item.category}</span>
                      <h3 className="font-semibold text-sm text-[hsl(214,60%,14%)] mt-0.5 truncate">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{item.suburb}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-blue-400 hover:text-blue-600 p-1"
                        data-testid={`button-edit-portfolio-${item.id}`}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        data-testid={`button-delete-portfolio-${item.id}`}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
