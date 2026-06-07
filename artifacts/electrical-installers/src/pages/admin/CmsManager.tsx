import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { Plus, Pencil, Trash2, X, Save, AlertCircle, Inbox } from "lucide-react";
import { apiGet, apiSend } from "@/lib/cms";

export type FieldType = "text" | "textarea" | "number" | "list";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  half?: boolean;
};

type Row = Record<string, unknown> & { id: number };

export type CmsConfig = {
  title: string;
  description: string;
  adminPath: string;
  fields: FieldDef[];
  primaryField: string;
  secondaryField?: string;
  newLabel: string;
};

function blankForm(fields: FieldDef[]): Record<string, string> {
  const f: Record<string, string> = {};
  for (const field of fields) f[field.name] = "";
  return f;
}

function rowToForm(fields: FieldDef[], row: Row): Record<string, string> {
  const f: Record<string, string> = {};
  for (const field of fields) {
    const v = row[field.name];
    if (field.type === "list") f[field.name] = Array.isArray(v) ? (v as string[]).join("\n") : "";
    else f[field.name] = v == null ? "" : String(v);
  }
  return f;
}

function formToPayload(fields: FieldDef[], form: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = form[field.name] ?? "";
    if (field.type === "list") {
      payload[field.name] = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    } else if (field.type === "number") {
      payload[field.name] = raw === "" ? 0 : Number(raw);
    } else {
      payload[field.name] = raw === "" ? (field.required ? "" : null) : raw;
    }
  }
  return payload;
}

function EditModal({
  config,
  row,
  onClose,
  onSaved,
}: {
  config: CmsConfig;
  row: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    row ? rowToForm(config.fields, row) : blankForm(config.fields)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    for (const field of config.fields) {
      if (field.required && !form[field.name]?.trim()) {
        setError(`${field.label} is required.`);
        return;
      }
    }
    setError(null);
    setSaving(true);
    try {
      const payload = formToPayload(config.fields, form);
      if (row) {
        await apiSend("PUT", `${config.adminPath}/${row.id}`, payload);
      } else {
        await apiSend("POST", config.adminPath, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
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
            <h2 className="text-lg font-bold text-white">{row ? `Edit ${config.newLabel}` : `New ${config.newLabel}`}</h2>
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

            <div className="grid grid-cols-2 gap-3">
              {config.fields.map((field) => (
                <div key={field.name} className={field.half ? "" : "col-span-2"}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {field.label}{field.required && " *"}
                    {field.help && <span className="text-gray-400 font-normal"> — {field.help}</span>}
                  </label>
                  {field.type === "textarea" || field.type === "list" ? (
                    <textarea
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                      rows={field.type === "list" ? 5 : 4}
                      className={inputClass + (field.type === "list" ? " font-mono text-xs" : "")}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                      className={inputClass}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[hsl(25,95%,53%)] text-white text-sm font-semibold hover:bg-[hsl(25,95%,45%)] disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Saving…" : row ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CmsManager({ config }: { config: CmsConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Row[]>(config.adminPath);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [config.adminPath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: number) {
    await apiSend("DELETE", `${config.adminPath}/${id}`);
    setConfirmDelete(null);
    await load();
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)]">{config.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-[hsl(25,95%,53%)] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[hsl(25,95%,45%)] transition-colors"
          >
            <Plus size={16} />
            New {config.newLabel}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="bg-gray-100 h-16 rounded-xl animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Inbox size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm mt-1">Create your first {config.newLabel.toLowerCase()} to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              {rows.length} item{rows.length !== 1 ? "s" : ""}
            </div>
            <div className="divide-y divide-gray-50">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[hsl(214,60%,14%)] truncate">{String(row[config.primaryField] ?? "")}</p>
                    {config.secondaryField && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(row[config.secondaryField] ?? "")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditing(row); setShowModal(true); }}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    {confirmDelete === row.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleDelete(row.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">Confirm</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(row.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
        <EditModal
          config={config}
          row={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </AdminLayout>
  );
}
