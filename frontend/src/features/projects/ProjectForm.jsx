import { useState } from "react";
import { RefreshCw, X } from "lucide-react";

const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

const INPUT_STYLES =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-950";

export default function ProjectForm({
  project,
  workspaceName,
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState(project?.status ?? "planning");
  const [dueDate, setDueDate] = useState(
    project?.due_date ? String(project.due_date).slice(0, 10) : "",
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      status,
      due_date: dueDate || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        aria-labelledby="project-form-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-xl font-semibold text-slate-900 dark:text-white"
              id="project-form-title"
            >
              {project ? "Edit project" : "Create project"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {project
                ? "Update the project details."
                : `Add a project${workspaceName ? ` to ${workspaceName}` : ""}.`}
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="project-name"
            >
              Project name
            </label>
            <input
              autoFocus
              className={INPUT_STYLES}
              id="project-name"
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Website redesign"
              required
              value={name}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="project-description"
            >
              Description
            </label>
            <textarea
              className={INPUT_STYLES}
              id="project-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this project about?"
              rows={4}
              value={description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="project-status"
              >
                Status
              </label>
              <select
                className={INPUT_STYLES}
                id="project-status"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                {PROJECT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="project-due-date"
              >
                Due date
              </label>
              <input
                className={INPUT_STYLES}
                id="project-due-date"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
            </div>
          </div>

          {error && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={submitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || !name.trim()}
              type="submit"
            >
              {submitting && <RefreshCw className="animate-spin" size={16} />}
              {project ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
