import { useState } from "react";
import { RefreshCw, X } from "lucide-react";

const INPUT_STYLES =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function TaskForm({
  task,
  error,
  submitting,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(
    task?.due_date ? String(task.due_date).slice(0, 10) : "",
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-semibold text-slate-900 dark:text-white"
              id="task-form-title"
            >
              {task ? "Edit task" : "Create task"}
            </h2>
            {!task && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add a task to this project.
              </p>
            )}
          </div>
          <button
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="task-title"
          >
            Task title
          </label>
          <input
            autoFocus
            className={INPUT_STYLES}
            id="task-title"
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Build authentication API"
            required
            value={title}
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="task-description"
          >
            Description
          </label>
          <textarea
            className={INPUT_STYLES}
            id="task-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What needs to be done?"
            rows={3}
            value={description}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="task-status"
            >
              Status
            </label>
            <select
              className={INPUT_STYLES}
              id="task-status"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="review">In review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="task-priority"
            >
              Priority
            </label>
            <select
              className={INPUT_STYLES}
              id="task-priority"
              onChange={(event) => setPriority(event.target.value)}
              value={priority}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            htmlFor="task-due-date"
          >
            Due date
          </label>
          <input
            className={INPUT_STYLES}
            id="task-due-date"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </div>

        {error && (
          <p
            className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting || !title.trim()}
            type="submit"
          >
            {submitting && <RefreshCw className="animate-spin" size={16} />}
            {task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
