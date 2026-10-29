import { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FolderKanban,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/dashboardApi";
import { useAuthStore } from "../stores/authStore";

const STAT_CARDS = [
  {
    key: "assignedTasks",
    label: "My tasks",
    icon: ClipboardList,
    tone: "text-indigo-600 dark:text-indigo-400",
    background: "bg-indigo-50 dark:bg-indigo-950/60",
  },
  {
    key: "overdueTasks",
    label: "Overdue",
    icon: CalendarClock,
    tone: "text-red-600 dark:text-red-400",
    background: "bg-red-50 dark:bg-red-950/50",
  },
  {
    key: "activeProjects",
    label: "Active projects",
    icon: FolderKanban,
    tone: "text-blue-600 dark:text-blue-400",
    background: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    key: "completedTasks",
    label: "Completed",
    icon: CheckCircle2,
    tone: "text-emerald-600 dark:text-emerald-400",
    background: "bg-emerald-50 dark:bg-emerald-950/50",
  },
];

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatDate(date) {
  if (!date) return "";
  const [year, month, day] = String(date).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(date) {
  if (!date) return false;
  const dueDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function TaskRow({ task }) {
  const overdue = isOverdue(task.due_date);

  return (
    <article className="flex items-center gap-3 rounded-xl border border-app-border bg-surface p-4 transition hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-700">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
        <ClipboardCheck size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-text-primary">{task.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
          <Link
            className="max-w-48 truncate hover:text-brand"
            to={`/workspaces/${task.workspace_id}/projects/${task.project_id}`}
            title={task.project_name}
          >
            {task.project_name}
          </Link>
          <span aria-hidden="true">·</span>
          <span className="capitalize">
            {task.status?.replaceAll("_", " ")}
          </span>
          <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
            {overdue ? "Overdue" : `Due ${formatDate(task.due_date)}`}
          </span>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
          PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
        }`}
      >
        {task.priority || "medium"}
      </span>
    </article>
  );
}

export default function Dashboard() {
  const username = useAuthStore((state) => state.username);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getDashboardSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load your dashboard.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  function retryLoading() {
    setError("");
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300" role="alert">
          <AlertCircle size={17} />
          {error}
        </p>
        <button
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 dark:text-red-300"
          onClick={retryLoading}
          type="button"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const stats = summary?.stats ?? {};
  const upcomingTasks = summary?.upcomingTasks ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            Welcome back{username ? `, ${username}` : ""}!
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Here&apos;s what&apos;s happening with your work today.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-app-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-subtle-hover sm:self-auto"
          to="/tasks"
        >
          <ClipboardList size={16} />
          My tasks
        </Link>
      </header>

      <section
        aria-label="Personal work summary"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {STAT_CARDS.map(({ key, label, icon: Icon, tone, background }) => (
          <article
            className="rounded-xl border border-app-border bg-surface p-4 shadow-sm sm:p-5"
            key={key}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-text-secondary">{label}</span>
              <span className={`rounded-lg p-2 ${background} ${tone}`}>
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-text-primary">
              {loading ? (
                <span className="inline-block h-9 w-12 animate-pulse rounded bg-subtle-hover" />
              ) : (
                stats[key] ?? 0
              )}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {key === "activeProjects" ? "Across your workspaces" : "Assigned to you"}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.8fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold text-text-primary">
                My upcoming tasks
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Your next due tasks, including anything overdue.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-brand hover:text-brand-hover"
              to="/tasks"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3" aria-label="Loading tasks" role="status">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-20 animate-pulse rounded-xl border border-app-border bg-surface"
                  key={item}
                />
              ))}
            </div>
          ) : upcomingTasks.length ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-10 text-center">
              <CheckCircle2
                className="mx-auto text-emerald-500"
                size={30}
                aria-hidden="true"
              />
              <h3 className="mt-3 font-semibold text-text-primary">
                You&apos;re all caught up
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                No assigned tasks with upcoming due dates.
              </p>
              <Link
                className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
                to="/tasks"
              >
                Open my tasks
              </Link>
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-app-border bg-surface p-5 shadow-sm">
          <h2 className="font-semibold text-text-primary">Quick actions</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Jump straight to your workspace tools.
          </p>
          <div className="mt-5 space-y-2">
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-primary transition hover:bg-subtle-hover"
              to="/tasks"
            >
              <ClipboardList className="text-brand" size={18} />
              View my tasks
            </Link>
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-primary transition hover:bg-subtle-hover"
              to="/projects"
            >
              <FolderKanban className="text-brand" size={18} />
              Browse projects
            </Link>
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-primary transition hover:bg-subtle-hover"
              to="/workspaces"
            >
              <BriefcaseBusiness className="text-brand" size={18} />
              Manage workspaces
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
