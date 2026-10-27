import { Pencil, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const PRIORITY_STYLES = {
  low: "text-slate-500",
  medium: "text-blue-600 dark:text-blue-400",
  high: "text-orange-600 dark:text-orange-400",
  urgent: "text-red-600 dark:text-red-400",
};

export default function TaskCard({
  task,
  members,
  updating,
  assigning,
  onEdit,
  onDelete,
  onStatusChange,
  onAssign,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="break-words font-medium text-slate-900 dark:text-white">
              {task.title}
            </h3>
            <button
              aria-label={`Edit ${task.title}`}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
              onClick={() => onEdit(task)}
              type="button"
            >
              <Pencil size={16} />
            </button>
            <button
              aria-label={`Delete ${task.title}`}
              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
              onClick={() => onDelete(task)}
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500 dark:text-slate-400">
              {task.description}
            </p>
          )}
        </div>

        <select
          aria-label={`Status of ${task.title}`}
          className={`rounded-full border-0 px-3 py-1.5 text-xs font-medium capitalize outline-none disabled:opacity-60 ${
            STATUS_STYLES[task.status] || STATUS_STYLES.todo
          }`}
          disabled={updating}
          onChange={(event) => onStatusChange(task.id, event.target.value)}
          value={task.status}
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="review">In review</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Priority:{" "}
          <span
            className={`font-semibold capitalize ${
              PRIORITY_STYLES[task.priority] || ""
            }`}
          >
            {task.priority}
          </span>
        </span>

        {task.due_date && (
          <span className="text-slate-500 dark:text-slate-400">
            Due: {String(task.due_date).slice(0, 10)}
          </span>
        )}

        <select
          aria-label={`Assignee for ${task.title}`}
          className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          disabled={assigning}
          onChange={(event) => onAssign(task.id, event.target.value)}
          value={task.assignee_id ?? ""}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.role})
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
