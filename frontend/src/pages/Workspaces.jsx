import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { getWorkspaces, createWorkspace } from "../api/workspaceApi";
import WorkspaceCard from "../features/workspaces/WorkspaceCard";
import WorkspaceForm from "../features/workspaces/WorkspaceForm";
import useDebounce from "../hooks/useDebounce";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getWorkspaces();
        if (!cancelled) setWorkspaces(data.workspaces ?? []);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Could not load workspaces. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const filteredWorkspaces = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return workspaces;
    return workspaces.filter((workspace) =>
      `${workspace.name} ${workspace.slug} ${workspace.role}`
        .toLowerCase()
        .includes(query),
    );
  }, [debouncedSearch, workspaces]);

  function refreshWorkspaces() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  function openCreateModal() {
    setFormError("");
    setShowModal(true);
  }

  async function handleCreateWorkspace(workspaceData) {
    setFormError("");
    setCreating(true);

    try {
      await createWorkspace(workspaceData);
      setShowModal(false);
      refreshWorkspaces();
    } catch (requestError) {
      setFormError(
        requestError.response?.data?.message ||
          "Could not create workspace. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  const ownedCount = workspaces.filter(
    (workspace) => workspace.role === "owner",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Your organization</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            Workspaces
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Organize projects and collaborate with your team.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover sm:self-auto"
          onClick={openCreateModal}
          type="button"
        >
          <Plus size={18} />
          Create workspace
        </button>
      </header>

      <section
        aria-label="Workspace overview"
        className="grid gap-3 sm:grid-cols-2"
      >
        <article className="rounded-xl border border-app-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <FolderKanban size={21} />
            </span>
            <div>
              <p className="text-sm text-text-secondary">Total workspaces</p>
              <p className="mt-0.5 text-2xl font-bold text-text-primary">
                {loading ? "—" : workspaces.length}
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-app-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Users size={21} />
            </span>
            <div>
              <p className="text-sm text-text-secondary">Owned by you</p>
              <p className="mt-0.5 text-2xl font-bold text-text-primary">
                {loading ? "—" : ownedCount}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-text-primary">
              Your workspaces
            </h2>
            {!loading && !error && (
              <p className="mt-1 text-sm text-text-secondary">
                {filteredWorkspaces.length} of {workspaces.length}{" "}
                {workspaces.length === 1 ? "workspace" : "workspaces"}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <span className="sr-only">Search workspaces</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={17}
              />
              <input
                className="w-full rounded-lg border border-app-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workspaces"
                type="search"
                value={search}
              />
            </label>
            <button
              aria-label="Refresh workspaces"
              className="shrink-0 rounded-lg border border-app-border bg-surface p-2.5 text-text-secondary transition hover:bg-subtle-hover hover:text-brand disabled:opacity-50"
              disabled={loading}
              onClick={refreshWorkspaces}
              type="button"
            >
              <RefreshCw
                className={loading ? "animate-spin" : ""}
                size={18}
              />
            </button>
          </div>
        </div>

        {error && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            <span>{error}</span>
            <button
              className="font-semibold underline"
              onClick={refreshWorkspaces}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div
            aria-label="Loading workspaces"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            role="status"
          >
            {[0, 1, 2].map((item) => (
              <div
                className="h-36 animate-pulse rounded-xl border border-app-border bg-surface"
                key={item}
              />
            ))}
          </div>
        ) : !error && workspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <FolderKanban size={26} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              No workspaces yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
              Create your first workspace to organize projects and collaborate
              with others.
            </p>
            <button
              className="mt-5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              onClick={openCreateModal}
              type="button"
            >
              Create your first workspace
            </button>
          </div>
        ) : !error && filteredWorkspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
            <Search className="mx-auto text-text-secondary" size={28} />
            <h3 className="mt-3 font-semibold text-text-primary">
              No matching workspaces
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Try another name, slug, or role.
            </p>
            <button
              className="mt-4 text-sm font-semibold text-brand hover:text-brand-hover"
              onClick={() => setSearch("")}
              type="button"
            >
              Clear search
            </button>
          </div>
        ) : !error ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        ) : null}
      </section>

      {showModal && (
        <WorkspaceForm
          creating={creating}
          error={formError}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateWorkspace}
        />
      )}
    </div>
  );
}
