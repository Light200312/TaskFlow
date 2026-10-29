import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  archiveProject,
  createProject,
  deleteProject,
  getProjectsByWorkspace,
  restoreProject,
  updateProject,
} from "../api/projectApi";
import { getWorkspaces } from "../api/workspaceApi";
import ProjectCard from "../features/projects/ProjectCard";
import ProjectForm from "../features/projects/ProjectForm";

const INPUT_STYLES =
  "w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900";
const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") ?? "";
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState("");
  const [workspacesReload, setWorkspacesReload] = useState(0);
  const [projects, setProjects] = useState([]);
  const [projectsWorkspaceId, setProjectsWorkspaceId] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalProject, setModalProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyProjectId, setBusyProjectId] = useState(null);
  const [actionError, setActionError] = useState("");
  const projectRequestId = useRef(0);

  const activeWorkspace = workspaces.find(
    (workspace) => String(workspace.id) === workspaceId,
  );
  const canManageProjects = ["owner", "admin"].includes(activeWorkspace?.role);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaces = async () => {
      setWorkspacesLoading(true);
      setWorkspacesError("");

      try {
        const response = await getWorkspaces();
        if (cancelled) return;

        setWorkspaces(response.workspaces ?? []);
      } catch (error) {
        if (cancelled) return;

        setWorkspacesError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load workspaces.",
        );
      } finally {
        if (!cancelled) setWorkspacesLoading(false);
      }
    };

    loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [workspacesReload]);

  useEffect(() => {
    if (!workspaces.length) return;

    const selectedWorkspaceExists = workspaces.some(
      (workspace) => String(workspace.id) === workspaceId,
    );
    if (selectedWorkspaceExists) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("workspaceId", String(workspaces[0].id));
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, workspaceId, workspaces]);

  const loadProjects = useCallback(async (selectedWorkspaceId) => {
    if (!selectedWorkspaceId) return;

    const requestId = ++projectRequestId.current;
    setProjectsLoading(true);
    setProjectsError("");

    try {
      const response = await getProjectsByWorkspace(selectedWorkspaceId);
      if (requestId !== projectRequestId.current) return;

      setProjects(response.projects ?? []);
      setProjectsWorkspaceId(selectedWorkspaceId);
    } catch (error) {
      if (requestId !== projectRequestId.current) return;

      setProjects([]);
      setProjectsWorkspaceId(selectedWorkspaceId);
      setProjectsError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load projects.",
      );
    } finally {
      if (requestId === projectRequestId.current) {
        setProjectsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!workspaceId || !activeWorkspace) {
      projectRequestId.current += 1;
      return undefined;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) void loadProjects(workspaceId);
    });

    return () => {
      cancelled = true;
      projectRequestId.current += 1;
    };
  }, [workspaceId, activeWorkspace, loadProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        `${project.name} ${project.description ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  function selectWorkspace(nextWorkspaceId) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("workspaceId", nextWorkspaceId);
    setSearchParams(nextParams);
    setActionError("");
  }

  function openCreateModal() {
    setModalProject(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(project) {
    setModalProject(project);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSaveProject(projectData) {
    setSubmitting(true);
    setFormError("");
    try {
      if (modalProject) {
        await updateProject(workspaceId, modalProject.id, projectData);
      } else {
        await createProject(workspaceId, projectData);
      }
      setModalOpen(false);
      setModalProject(null);
      await loadProjects(workspaceId);
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          `Unable to ${modalProject ? "update" : "create"} the project.`,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProjectAction(action, project) {
    if (
      action === "delete" &&
      !window.confirm(
        `Delete "${project.name}" permanently? This action cannot be undone.`,
      )
    ) {
      return;
    }
    if (
      action === "archive" &&
      !window.confirm(`Archive "${project.name}"?`)
    ) {
      return;
    }

    setBusyProjectId(project.id);
    setActionError("");
    try {
      if (action === "archive") {
        await archiveProject(workspaceId, project.id);
      } else if (action === "restore") {
        await restoreProject(workspaceId, project.id);
      } else {
        await deleteProject(workspaceId, project.id);
      }
      await loadProjects(workspaceId);
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          `Unable to ${action} the project. Please try again.`,
        ),
      );
    } finally {
      setBusyProjectId(null);
    }
  }

  if (workspacesLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-text-secondary">
        <RefreshCw className="animate-spin" size={18} />
        Loading workspaces...
      </div>
    );
  }

  if (workspacesError) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {workspacesError}
        </p>
        <button
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 dark:text-red-300"
          onClick={() => setWorkspacesReload((count) => count + 1)}
          type="button"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  if (!workspaces.length) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-app-border bg-surface p-8 text-center shadow-sm">
        <FolderKanban
          className="mx-auto text-slate-400 dark:text-slate-500"
          size={36}
        />
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          No workspaces yet
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Create or join a workspace before adding projects.
        </p>
        <Link
          className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          to="/workspaces"
        >
          Go to workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">
            Workspace projects
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            Projects
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Find and manage projects across your workspaces.
          </p>
        </div>

        {canManageProjects && (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            onClick={openCreateModal}
            type="button"
          >
            <Plus size={18} /> Create project
          </button>
        )}
      </header>

      <section className="rounded-xl border border-app-border bg-surface p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.5fr)_minmax(10rem,0.7fr)]">
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
              htmlFor="workspace-filter"
            >
              Workspace
            </label>
            <select
              className={INPUT_STYLES}
              id="workspace-filter"
              onChange={(event) => selectWorkspace(event.target.value)}
              value={activeWorkspace ? workspaceId : ""}
            >
              {!activeWorkspace && <option value="">Select workspace</option>}
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
              htmlFor="project-search"
            >
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={17}
              />
              <input
                className={`${INPUT_STYLES} pl-9`}
                id="project-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search project name or description"
                type="search"
                value={search}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary"
              htmlFor="project-status-filter"
            >
              Status
            </label>
            <select
              className={INPUT_STYLES}
              id="project-status-filter"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              {PROJECT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      {actionError && (
        <div
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <span>{actionError}</span>
          <button
            aria-label="Dismiss error"
            className="shrink-0 rounded p-0.5 hover:bg-red-100 dark:hover:bg-red-900"
            onClick={() => setActionError("")}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-text-primary">
            {activeWorkspace?.name ?? "Projects"}
          </h2>
          {!projectsLoading && !projectsError && (
            <p className="mt-0.5 text-sm text-text-secondary">
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
              {search || statusFilter !== "all" ? " found" : ""}
            </p>
          )}
        </div>
        <button
          aria-label="Refresh projects"
          className="rounded-lg border border-app-border p-2 text-text-secondary transition hover:bg-subtle-hover hover:text-brand disabled:opacity-50"
          disabled={projectsLoading}
          onClick={() => loadProjects(workspaceId)}
          title="Refresh projects"
          type="button"
        >
          <RefreshCw
            className={projectsLoading ? "animate-spin" : ""}
            size={17}
          />
        </button>
      </div>

      {projectsWorkspaceId === workspaceId && projectsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {projectsError}
          </p>
          <button
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 dark:text-red-300"
            onClick={() => loadProjects(workspaceId)}
            type="button"
          >
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      ) : !activeWorkspace ||
        projectsLoading ||
        projectsWorkspaceId !== workspaceId ? (
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
      ) : filteredProjects.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              busy={busyProjectId === project.id}
              canManage={canManageProjects}
              key={project.id}
              onAction={handleProjectAction}
              onEdit={openEditModal}
              project={project}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      ) : projects.length ? (
        <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
          <Search
            className="mx-auto text-slate-400 dark:text-slate-500"
            size={32}
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
      ) : (
        <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
          <FolderKanban
            className="mx-auto text-slate-400 dark:text-slate-500"
            size={36}
          />
          <h3 className="mt-3 font-semibold text-text-primary">
            No projects in this workspace
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {canManageProjects
              ? "Create a project to start organizing work."
              : "Projects created in this workspace will appear here."}
          </p>
          {canManageProjects && (
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              onClick={openCreateModal}
              type="button"
            >
              <Plus size={17} /> Create project
            </button>
          )}
        </div>
      )}

      {modalOpen && (
        <ProjectForm
          error={formError}
          onClose={() => {
            setModalOpen(false);
            setModalProject(null);
            setFormError("");
          }}
          onSubmit={handleSaveProject}
          project={modalProject}
          submitting={submitting}
          workspaceName={activeWorkspace?.name}
        />
      )}
    </div>
  );
}
