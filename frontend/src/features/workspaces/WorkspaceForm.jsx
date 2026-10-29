import { useState } from "react";
import { X } from "lucide-react";

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function WorkspaceForm({
  creating,
  error,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [validationError, setValidationError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setValidationError("");

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) {
      setValidationError("Workspace name is required.");
      return;
    }
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug) ||
      trimmedSlug.length > 100
    ) {
      setValidationError(
        "Use lowercase letters, numbers, and single hyphens in the slug.",
      );
      return;
    }

    onSubmit({ name: trimmedName, slug: trimmedSlug });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !creating) onClose();
      }}
    >
      <section
        aria-labelledby="workspace-form-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-app-border bg-surface-elevated p-6 shadow-xl"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              className="text-xl font-bold text-text-primary"
              id="workspace-form-title"
            >
              Create workspace
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Set up a space for your team and projects.
            </p>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-text-secondary hover:bg-subtle-hover disabled:opacity-50"
            disabled={creating}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-text-primary"
              htmlFor="workspace-name"
            >
              Workspace name
            </label>
            <input
              autoFocus
              className="w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
              id="workspace-name"
              maxLength={100}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slugEdited) setSlug(createSlug(nextName));
              }}
              placeholder="e.g. Engineering Team"
              required
              value={name}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-text-primary"
              htmlFor="workspace-slug"
            >
              Workspace slug
            </label>
            <input
              className="w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
              id="workspace-slug"
              maxLength={100}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugEdited(true);
              }}
              placeholder="engineering-team"
              required
              value={slug}
            />
            <p className="mt-1.5 text-xs text-text-secondary">
              Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {(validationError || error) && (
            <p
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
              role="alert"
            >
              {validationError || error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-lg border border-app-border px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-subtle-hover disabled:opacity-50"
              disabled={creating}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creating}
              type="submit"
            >
              {creating ? "Creating..." : "Create workspace"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
