import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAssignedTasks, updateTask } from "../api/taskApi";
import useDebounce from "../hooks/useDebounce";

const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "In review" },
  { value: "done", label: "Done" },
];

const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const INPUT_STYLES =
  "rounded-lg border border-app-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900";

function isOverdue(date) {
  if (!date) return false;
  const dueDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function formatDate(date) {
  if (!date) return "";
  const dateOnly = String(date).slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TaskItem({ task, updating, onStatusChange }) {
  const overdue = task.status !== "done" && isOverdue(task.due_date);

  return (
    <article className="rounded-xl border border-app-border bg-surface p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-text-primary">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-text-secondary">
              {task.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
          }`}
        >
          {task.priority || "medium"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-app-border pt-3 text-xs text-text-secondary">
        <Link
          className="max-w-full truncate font-medium text-brand hover:text-brand-hover"
          to={`/workspaces/${task.workspace_id}/projects/${task.project_id}`}
          title={task.project_name}
        >
          {task.project_name || `Project #${task.project_id}`}
        </Link>
        {task.due_date && (
          <span
            className={`inline-flex items-center gap-1 ${
              overdue ? "font-semibold text-red-600 dark:text-red-400" : ""
            }`}
          >
            <CalendarDays size={14} />
            {overdue ? "Overdue · " : "Due "}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="sr-only" htmlFor={`task-status-${task.id}`}>
          Status for {task.title}
        </label>
        <select
          className={`${INPUT_STYLES} min-w-0 max-w-full py-1.5 text-xs`}
          disabled={updating}
          id={`task-status-${task.id}`}
          onChange={(event) => onStatusChange(task, event.target.value)}
          value={task.status}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {updating && (
          <RefreshCw
            aria-label="Updating task"
            className="animate-spin text-text-secondary"
            size={15}
          />
        )}
      </div>
    </article>
  );
}

function EmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
      <ClipboardList
        className="mx-auto text-text-secondary"
        size={34}
        aria-hidden="true"
      />
      <h2 className="mt-3 font-semibold text-text-primary">
        {hasFilters ? "No tasks match these filters" : "No tasks assigned yet"}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        {hasFilters
          ? "Try changing your search or filters."
          : "Tasks assigned to you will show up here."}
      </p>
      {hasFilters && (
        <button
          className="mt-4 text-sm font-semibold text-brand hover:text-brand-hover"
          onClick={onClearFilters}
          type="button"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [actionError, setActionError] = useState("");
  const [updatingTaskIds, setUpdatingTaskIds] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [view, setView] = useState("list");

  useEffect(() => {
    let cancelled = false;

    getAssignedTasks()
      .then((response) => {
        if (!cancelled) setTasks(response.tasks ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load your tasks.",
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

  const filteredTasks = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        `${task.title} ${task.description ?? ""} ${task.project_name ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, debouncedSearch, statusFilter, priorityFilter]);

  const overdueCount = tasks.filter(
    (task) => task.status !== "done" && isOverdue(task.due_date),
  ).length;
  const hasFilters =
    Boolean(debouncedSearch.trim()) ||
    statusFilter !== "all" ||
    priorityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  async function handleStatusChange(task, nextStatus) {
    if (task.status === nextStatus) return;

    setActionError("");
    setUpdatingTaskIds((currentIds) => new Set(currentIds).add(task.id));
    const previousStatus = task.status;
    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item,
      ),
    );

    try {
      await updateTask(task.workspace_id, task.project_id, task.id, {
        status: nextStatus,
      });
    } catch (error) {
      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === task.id ? { ...item, status: previousStatus } : item,
        ),
      );
      setActionError(
        error.response?.data?.message || "Unable to update task status.",
      );
    } finally {
      setUpdatingTaskIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(task.id);
        return nextIds;
      });
    }
  }

  function reloadTasks() {
    setLoadError("");
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  if (loading) {
    return (
      <div
        aria-label="Loading your tasks"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        role="status"
      >
        {[0, 1, 2].map((item) => (
          <div
            className="h-48 animate-pulse rounded-xl border border-app-border bg-surface"
            key={item}
          />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300" role="alert">
          <AlertCircle size={17} />
          {loadError}
        </p>
        <button
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 dark:text-red-300"
          onClick={reloadTasks}
          type="button"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Your work</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            My Tasks
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Keep track of tasks assigned to you across your projects.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-app-border bg-surface px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-subtle-hover sm:self-auto"
          disabled={loading}
          onClick={reloadTasks}
          type="button"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section
        aria-label="Task overview"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
      >
        <div className="rounded-xl border border-app-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Total tasks</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {tasks.length}
          </p>
        </div>
        {STATUSES.map(({ value, label }) => {
          const Icon = value === "done" ? CheckCircle2 : ClipboardList;
          const count = tasks.filter((task) => task.status === value).length;
          return (
            <div
              className="rounded-xl border border-app-border bg-surface p-4"
              key={value}
            >
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <Icon size={15} />
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {count}
              </p>
            </div>
          );
        })}
        <div className="col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40 sm:col-span-1">
          <p className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <CalendarDays size={15} />
            Overdue
          </p>
          <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
            {overdueCount}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-app-border bg-surface p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.6fr)_minmax(10rem,0.6fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Search tasks</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={17}
              />
              <input
                className={`${INPUT_STYLES} w-full pl-9`}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, description, or project"
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                className={`${INPUT_STYLES} w-full`}
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by priority</span>
              <select
                className={`${INPUT_STYLES} w-full`}
                onChange={(event) => setPriorityFilter(event.target.value)}
                value={priorityFilter}
              >
                <option value="all">All priorities</option>
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
                <option value="urgent">Urgent priority</option>
              </select>
            </label>
            <div
              aria-label="Task view"
              className="flex rounded-lg border border-app-border p-1"
              role="group"
            >
              <button
                aria-pressed={view === "list"}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                  view === "list"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-text-secondary hover:bg-subtle-hover"
                }`}
                onClick={() => setView("list")}
                type="button"
              >
                <List size={16} /> List
              </button>
              <button
                aria-pressed={view === "board"}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                  view === "board"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-text-secondary hover:bg-subtle-hover"
                }`}
                onClick={() => setView("board")}
                type="button"
              >
                <LayoutGrid size={16} /> Board
              </button>
            </div>
          </div>
        </div>

        {actionError && (
          <div
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            {actionError}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary" aria-live="polite">
            Showing {filteredTasks.length} of {tasks.length}{" "}
            {tasks.length === 1 ? "task" : "tasks"}
          </p>
          {hasFilters && (
            <button
              className="text-sm font-semibold text-brand hover:text-brand-hover"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
        ) : view === "list" ? (
          <div className="space-y-6">
            {STATUSES.map((status) => {
              const statusTasks = filteredTasks.filter(
                (task) => task.status === status.value,
              );
              if (!statusTasks.length) return null;

              return (
                <section aria-labelledby={`group-${status.value}`} key={status.value}>
                  <h2
                    className="mb-3 flex items-center gap-2 font-semibold text-text-primary"
                    id={`group-${status.value}`}
                  >
                    {status.label}
                    <span className="rounded-full bg-subtle-hover px-2 py-0.5 text-xs font-medium text-text-secondary">
                      {statusTasks.length}
                    </span>
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {statusTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        onStatusChange={handleStatusChange}
                        task={task}
                        updating={updatingTaskIds.has(task.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1 pb-2">
            <div className="grid min-w-[1120px] grid-cols-4 gap-4">
              {STATUSES.map((status) => {
                const statusTasks = filteredTasks.filter(
                  (task) => task.status === status.value,
                );
                return (
                  <section
                    aria-labelledby={`column-${status.value}`}
                    className="min-w-0 rounded-xl bg-subtle-hover/70 p-3"
                    key={status.value}
                  >
                    <h2
                      className="mb-3 flex items-center justify-between gap-2 px-1 font-semibold text-text-primary"
                      id={`column-${status.value}`}
                    >
                      {status.label}
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {statusTasks.length}
                      </span>
                    </h2>
                    <div className="space-y-3">
                      {statusTasks.length ? (
                        statusTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            onStatusChange={handleStatusChange}
                            task={task}
                            updating={updatingTaskIds.has(task.id)}
                          />
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-app-border px-3 py-6 text-center text-xs text-text-secondary">
                          No tasks
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
