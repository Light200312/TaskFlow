import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import WorkspaceInvitations from "../features/workspaces/WorkspaceInvitations";
import { getWorkspaceById } from "../api/workspaceApi";
import { createProject, getProjectsByWorkspace } from "../api/projectApi";
import ProjectCard from "../features/projects/ProjectCard";
import ProjectForm from "../features/projects/ProjectForm";
import useDebounce from "../hooks/useDebounce";

const PROJECT_STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectsError, setProjectsError] = useState("");
  const [reloadWorkspace, setReloadWorkspace] = useState(0);
  const [reloadProjects, setReloadProjects] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getWorkspaceById(workspaceId);
        if (!cancelled) setWorkspace(data.workspace);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load this workspace.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadWorkspace]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      setProjectsLoading(true);
      setProjectsError("");

      try {
        const data = await getProjectsByWorkspace(workspaceId);
        if (!cancelled) setProjects(data.projects ?? []);
      } catch (requestError) {
        if (!cancelled) {
          setProjectsError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load projects.",
          );
        }
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadProjects]);

  const filteredProjects = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        `${project.name} ${project.description ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, debouncedSearch, statusFilter]);

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;

  async function handleCreateProject(projectData) {
    setFormError("");
    setCreating(true);

    try {
      await createProject(workspaceId, projectData);
      setShowModal(false);
      setProjectsLoading(true);
      setReloadProjects((count) => count + 1);
    } catch (requestError) {
      setFormError(
        requestError.response?.data?.message ||
          "Unable to create project. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  function openCreateModal() {
    setFormError("");
    setShowModal(true);
  }

  if (loading) {
    return (
      <div
        aria-label="Loading workspace"
        className="space-y-5"
        role="status"
      >
        <div className="h-40 animate-pulse rounded-xl border border-app-border bg-surface" />
        <div className="h-24 animate-pulse rounded-xl border border-app-border bg-surface" />
        <div className="h-52 animate-pulse rounded-xl border border-app-border bg-surface" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error || "Workspace not found."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50"
            onClick={() => setReloadWorkspace((count) => count + 1)}
            type="button"
          >
            <RefreshCw size={15} /> Try again
          </button>
          <Link
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50"
            to="/workspaces"
          >
            Back to workspaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-brand"
        to="/workspaces"
      >
        <ArrowLeft size={17} />
        All workspaces
      </Link>

      <section className="overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm">
        <div className="bg-gradient-to-r from-indigo-50 to-white p-5 dark:from-indigo-950/60 dark:to-slate-900 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                <FolderKanban size={27} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand">Workspace</p>
                <h1 className="mt-0.5 break-words text-2xl font-bold tracking-tight text-text-primary">
                  {workspace.name}
                </h1>
                <p className="mt-1 truncate text-sm text-text-secondary">
                  /{workspace.slug}
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={18} />
              New project
            </button>
          </div>
        </div>
        <div className="grid divide-y divide-app-border border-t border-app-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 px-5 py-4 sm:px-7">
            <span className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <FolderKanban size={19} />
            </span>
            <div>
              <p className="text-xs text-text-secondary">Projects</p>
              <p className="font-semibold text-text-primary">
                {projectsLoading ? "Loading…" : projects.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4 sm:px-7">
            <span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Users size={19} />
            </span>
            <div>
              <p className="text-xs text-text-secondary">Active projects</p>
              <p className="font-semibold text-text-primary">
                {projectsLoading ? "Loading…" : activeProjects}
              </p>
            </div>
          </div>
        </div>
      </section>

      <WorkspaceInvitations workspaceId={workspaceId} />

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Projects
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Manage the work happening in this workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
              <span className="sr-only">Search projects</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={17}
              />
              <input
                className="w-full rounded-lg border border-app-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="sr-only">Filter projects by status</span>
              <select
                className="h-full rounded-lg border border-app-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-label="Refresh projects"
              className="shrink-0 rounded-lg border border-app-border bg-surface p-2.5 text-text-secondary transition hover:bg-subtle-hover hover:text-brand disabled:opacity-50"
              disabled={projectsLoading}
              onClick={() => {
                setProjectsLoading(true);
                setReloadProjects((count) => count + 1);
              }}
              type="button"
            >
              <RefreshCw
                className={projectsLoading ? "animate-spin" : ""}
                size={17}
              />
            </button>
          </div>
        </div>

        {!projectsError && !projectsLoading && projects.length > 0 && (
          <p className="text-sm text-text-secondary" aria-live="polite">
            Showing {filteredProjects.length} of {projects.length}{" "}
            {projects.length === 1 ? "project" : "projects"}
          </p>
        )}

        {projectsError && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            <span>{projectsError}</span>
            <button
              className="font-semibold underline"
              onClick={() => {
                setProjectsLoading(true);
                setReloadProjects((count) => count + 1);
              }}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {projectsLoading ? (
          <div
            aria-label="Loading projects"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            role="status"
          >
            {[0, 1, 2].map((item) => (
              <div
                className="h-52 animate-pulse rounded-xl border border-app-border bg-surface"
                key={item}
              />
            ))}
          </div>
        ) : !projectsError && projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
            <FolderKanban
              className="mx-auto text-text-secondary"
              size={30}
              aria-hidden="true"
            />
            <h3 className="mt-3 font-semibold text-text-primary">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Create a project to start organizing your work.
            </p>
            <button
              className="mt-5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              onClick={openCreateModal}
              type="button"
            >
              Create your first project
            </button>
          </div>
        ) : !projectsError && filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
            <Search
              className="mx-auto text-text-secondary"
              size={28}
              aria-hidden="true"
            />
            <h3 className="mt-3 font-semibold text-text-primary">
              No matching projects
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Try changing your search or status filter.
            </p>
            <button
              className="mt-4 text-sm font-semibold text-brand hover:text-brand-hover"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        ) : !projectsError ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                workspaceId={workspaceId}
              />
            ))}
          </div>
        ) : null}
      </section>

      {showModal && (
        <ProjectForm
          error={formError}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateProject}
          submitting={creating}
          workspaceName={workspace.name}
        />
      )}
    </div>
  );
}
