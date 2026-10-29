import { Link } from "react-router-dom";
import {
  Archive,
  CalendarDays,
  ExternalLink,
  FolderKanban,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

const STATUS_STYLES = {
  planning:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  on_hold:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  archived:
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function formatDate(date) {
  if (!date) return null;

  const [year, month, day] = String(date).slice(0, 10).split("-");
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectCard({
  project,
  workspaceId,
  canManage = false,
  busy = false,
  onEdit,
  onAction,
}) {
  const archived = project.status === "archived";
  const statusLabel =
    project.status === "on_hold"
      ? "On hold"
      : project.status?.charAt(0).toUpperCase() + project.status?.slice(1);

  return (
    <article className="group flex h-full flex-col rounded-xl border border-app-border bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <FolderKanban size={22} />
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Project
            </p>
            <h2 className="break-words font-semibold text-text-primary">
              {project.name}
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Project #{project.id}
            </p>
            {project.created_by_name && (
              <p className="mt-1 truncate text-xs text-text-secondary">
                Created by {project.created_by_name}
              </p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_STYLES[project.status] || STATUS_STYLES.planning
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-4 min-h-10 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">
        {project.description || "No description provided."}
      </p>

      {project.due_date && (
        <div className="mt-4 flex items-center gap-2 border-t border-app-border pt-4 text-xs text-text-secondary">
          <CalendarDays size={15} />
          Due {formatDate(project.due_date)}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <Link
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand hover:text-brand-hover"
          to={`/workspaces/${workspaceId}/projects/${project.id}`}
        >
          Open project <ExternalLink size={15} />
        </Link>

        {canManage && (
          <div className="flex items-center gap-1">
            {!archived && (
              <>
                <button
                  aria-label={`Edit ${project.name}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                  disabled={busy}
                  onClick={() => onEdit?.(project)}
                  title="Edit project"
                  type="button"
                >
                  <Pencil size={17} />
                </button>
                <button
                  aria-label={`Archive ${project.name}`}
                  className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50 dark:hover:bg-amber-950 dark:hover:text-amber-300"
                  disabled={busy}
                  onClick={() => onAction?.("archive", project)}
                  title="Archive project"
                  type="button"
                >
                  <Archive size={17} />
                </button>
              </>
            )}
            {archived && (
              <button
                aria-label={`Restore ${project.name}`}
                className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                disabled={busy}
                onClick={() => onAction?.("restore", project)}
                title="Restore project"
                type="button"
              >
                <RotateCcw size={17} />
              </button>
            )}
            <button
              aria-label={`Delete ${project.name}`}
              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-300"
              disabled={busy}
              onClick={() => onAction?.("delete", project)}
              title="Delete project"
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
