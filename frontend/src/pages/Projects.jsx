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
import useDebounce from "../hooks/useDebounce";

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
  const debouncedSearch = useDebounce(search);
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
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
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
  }, [projects, debouncedSearch, statusFilter]);

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
// # Understanding your `Projects.jsx` component

// Your `Projects.jsx` file is the main page for managing projects in TaskFlow. It brings together the workspace selector, project list, search and filters, project creation/editing, and archive/restore/delete actions.

// Think of it as the coordinator between your UI components and your backend APIs.

// Projects.jsx

// Manages page state, loading, filters and user actions

// API modules

// `projectApi.js`, `workspaceApi.js`

// Send HTTP requests to the backend.

// Child components

// `ProjectCard`, `ProjectForm`

// Display projects and collect form input.

// Express + MySQL backend

// Validates permissions and reads or changes project records.

// Let's understand it in the order the code works, from imports to rendering.

// ## 1. Imports: what does the page depend on?

// ```
// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// ```

// These are React hooks, each with a different responsibility.

// | Hook          | Purpose in your page                                                           |
// | ------------- | ------------------------------------------------------------------------------ |
// | `useState`    | Stores workspaces, projects, filters, errors, modal state, and loading status. |
// | `useEffect`   | Fetches workspaces and projects and responds to changes.                       |
// | `useCallback` | Keeps the `loadProjects` function reference stable between renders.            |
// | `useMemo`     | Calculates the filtered project list from the current projects and filters.    |
// | `useRef`      | Tracks request IDs without triggering a render.                                |

// You also import:

// - `useSearchParams` to store the selected workspace ID in the URL.
// - `Link` to navigate to the workspaces page.
// - Lucide icons for the buttons and empty states.
// - API functions to fetch and modify data.
// - `ProjectCard` and `ProjectForm` to keep the UI split into reusable components.

// This is good component organization: your page doesn't need to contain every card's and form's internal implementation.

// ## 2. Constants and helper function

// ### Input styles

// ```
// const INPUT_STYLES =
//   "w-full rounded-lg border ... dark:bg-slate-950 ...";
// ```

// Instead of repeating the same Tailwind classes on every input and dropdown, you store them in one string.

// When you write:

// ```
// <select className={INPUT_STYLES}>
// ```

// React passes those classes to the element. The shared styling also defines dark-mode colors, borders, focus states, and spacing.

// ### Project statuses

// ```
// const PROJECT_STATUSES = [
//   { value: "planning", label: "Planning" },
//   { value: "active", label: "Active" },
//   { value: "on_hold", label: "On hold" },
//   { value: "completed", label: "Completed" },
// ];
// ```

// The `value` is the status used in your database and API. The `label` is the human-readable text displayed in the dropdown.

// For example, a project with `status: "on_hold"` displays as On hold.

// Archived projects are added separately in the dropdown because they represent a different state in your application.

// ### Error helper

// ```
// function getErrorMessage(error, fallback) {
//   return error.response?.data?.message || fallback;
// }
// ```

// If your backend returns an error such as:

// ```
// { message: "Project not found." }
// ```

// the helper returns `"Project not found."`. If the backend provides no message, it returns the fallback text you supply.

// The `?.` operator is optional chaining: it prevents an error if `response` or `data` doesn't exist.

// ## 3. State: what information does this page remember?

// Your component starts with a number of state variables. They're grouped by responsibility below.

// ### Workspace state

// Controls the available workspaces and their loading/error states.

// ```
// const [workspaces, setWorkspaces] = useState([]);
// const [workspacesLoading, setWorkspacesLoading] = useState(true);
// const [workspacesError, setWorkspacesError] = useState("");
// const [workspacesReload, setWorkspacesReload] = useState(0);
// ```

// `workspacesReload` is a counter used to trigger another fetch when the user clicks Try again.

// ### Project state

// Stores the projects and tracks which workspace they belong to.

// ```
// const [projects, setProjects] = useState([]);
// const [projectsWorkspaceId, setProjectsWorkspaceId] = useState("");
// const [projectsLoading, setProjectsLoading] = useState(false);
// const [projectsError, setProjectsError] = useState("");
// ```

// `projectsWorkspaceId` is especially important: it lets the UI distinguish projects loaded for the currently selected workspace from projects left over from a previous selection.

// ### Search and filter state

// ```
// const [search, setSearch] = useState("");
// const [statusFilter, setStatusFilter] = useState("all");
// ```

// These values control which projects appear on screen without requiring another API request.

// ### Modal and action state

// ```
// const [modalProject, setModalProject] = useState(null);
// const [modalOpen, setModalOpen] = useState(false);
// const [formError, setFormError] = useState("");
// const [submitting, setSubmitting] = useState(false);

// const [busyProjectId, setBusyProjectId] = useState(null);
// const [actionError, setActionError] = useState("");
// ```

// `modalProject === null` means you're creating a project. If it contains a project object, you're editing that project. `submitting` prevents the form from being treated as idle while a save is in progress.

// ### Selected workspace and permissions

// ```
// const [searchParams, setSearchParams] = useSearchParams();
// const workspaceId = searchParams.get("workspaceId") ?? "";

// const activeWorkspace = workspaces.find(
//   (workspace) => String(workspace.id) === workspaceId,
// );

// const canManageProjects = ["owner", "admin"].includes(
//   activeWorkspace?.role,
// );
// ```

// The URL might look like:

// `/projects?workspaceId=12`

// `useSearchParams()` reads `12` from the URL. The code then finds the matching workspace in the fetched list.

// Why convert `workspace.id` to a string? URL query parameters are strings, while a database ID may be a number. Converting both sides avoids a type mismatch.

// Finally, `canManageProjects` checks the user's role in the selected workspace. It controls whether buttons such as Create project are displayed.

// Important: this is a UI permission check, not a security boundary. Your Express middleware must independently enforce the workspace role for every protected operation.

// ## 4. The first `useEffect`: loading workspaces

// ```
// useEffect(() => {
//   let cancelled = false;

//   const loadWorkspaces = async () => {
//     setWorkspacesLoading(true);
//     setWorkspacesError("");

//     try {
//       const response = await getWorkspaces();

//       if (cancelled) return;

//       setWorkspaces(response.workspaces ?? []);
//     } catch (error) {
//       if (cancelled) return;

//       setWorkspacesError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to load workspaces.",
//       );
//     } finally {
//       if (!cancelled) setWorkspacesLoading(false);
//     }
//   };

//   loadWorkspaces();

//   return () => {
//     cancelled = true;
//   };
// }, [workspacesReload]);
// ```

// This effect runs when the component first mounts and whenever `workspacesReload` changes.

// Here's the sequence:

// 1. Set the loading state to `true`.
// 2. Clear any previous workspace error.
// 3. Call `getWorkspaces()`.
// 4. If successful, save the returned workspace array.
// 5. If unsuccessful, save an error message.
// 6. When the request finishes, turn off the loading state.

// ### Why is there a `cancelled` variable?

// Imagine you navigate away from the page while the request is still running. The cleanup function sets `cancelled = true`, so the old effect won't update state when its request finishes.

// This is a simple way to protect against stale updates. It does not cancel the actual HTTP request; it just ignores its result.

// ### How does Retry work?

// ```
// onClick={() => setWorkspacesReload((count) => count + 1)}
// ```

// React updates the counter, which causes the effect to run again.

// The counter isn't the number of retries you want to allow. It's simply a trigger.

// ## 5. The second `useEffect`: selecting a valid workspace

// ```
// useEffect(() => {
//   if (!workspaces.length) return;

//   const selectedWorkspaceExists = workspaces.some(
//     (workspace) => String(workspace.id) === workspaceId,
//   );

//   if (selectedWorkspaceExists) return;

//   const nextParams = new URLSearchParams(searchParams);
//   nextParams.set("workspaceId", String(workspaces[0].id));

//   setSearchParams(nextParams, { replace: true });
// }, [searchParams, setSearchParams, workspaceId, workspaces]);
// ```

// This effect makes sure the URL always points to a workspace that exists in the user's workspace list.

// For example, suppose the URL is:

// `/projects?workspaceId=999`

// But the user has workspaces with IDs `3` and `12`. Since `999` isn't found, the code selects the first workspace and changes the URL to:

// `/projects?workspaceId=3`

// The `replace: true` option replaces the current history entry instead of adding another one. That prevents the browser's Back button from getting stuck on an invalid selection.

// Why use `new URLSearchParams(searchParams)`? It creates a copy so you can update the query parameter without directly mutating the existing search parameters.

// ## 6. `loadProjects`: fetching the projects

// This function is the core of your page's data loading.

// ```
// const loadProjects = useCallback(async (selectedWorkspaceId) => {
//   if (!selectedWorkspaceId) return;

//   const requestId = ++projectRequestId.current;
//   setProjectsLoading(true);
//   setProjectsError("");

//   try {
//     const response =
//       await getProjectsByWorkspace(selectedWorkspaceId);

//     if (requestId !== projectRequestId.current) return;

//     setProjects(response.projects ?? []);
//     setProjectsWorkspaceId(selectedWorkspaceId);
//   } catch (error) {
//     if (requestId !== projectRequestId.current) return;

//     setProjects([]);
//     setProjectsWorkspaceId(selectedWorkspaceId);
//     setProjectsError(
//       error.response?.data?.message ||
//         error.message ||
//         "Failed to load projects.",
//     );
//   } finally {
//     if (requestId === projectRequestId.current) {
//       setProjectsLoading(false);
//     }
//   }
// }, []);
// ```

// ### Step by step

// Step 1: Validate the input

// ```
// if (!selectedWorkspaceId) return;
// ```

// If there is no workspace ID, don't make an API request.

// Step 2: Assign a request ID

// ```
// const requestId = ++projectRequestId.current;
// ```

// `projectRequestId` is a ref:

// ```
// const projectRequestId = useRef(0);
// ```

// A ref lets you update a value without triggering a React render. Here, it's used to determine which request is the newest.

// Step 3: Make the API call

// ```
// const response =
//   await getProjectsByWorkspace(selectedWorkspaceId);
// ```

// This sends a request through your API module to an endpoint like:

// ```
// GET /api/workspaces/12/projects
// ```

// The backend returns a response containing the projects for workspace `12`.

// Step 4: Ignore outdated responses

// ```
// if (requestId !== projectRequestId.current) return;
// ```

// Consider this scenario:

// - Request A fetches projects for workspace `3`.
// - You switch to workspace `12`, triggering request B.
// - Request B finishes first.
// - Request A finishes later.

// Without protection, request A could overwrite the projects from workspace `12` with the old projects from workspace `3`.

// The request ID check prevents that: only the most recent request can update the state.

// Step 5: Save the results

// ```
// setProjects(response.projects ?? []);
// setProjectsWorkspaceId(selectedWorkspaceId);
// ```

// The `?? []` means that if `response.projects` is `null` or `undefined`, the component uses an empty array instead.

// `projectsWorkspaceId` records which workspace the results belong to.

// Step 6: Handle errors and loading

// If the request fails, the component clears the projects and stores an error message. The `finally` block turns off loading only if the request is still the newest.

// ### Why use `useCallback`?

// ```
// }, []);
// ```

// `useCallback` preserves the function reference across renders while its dependencies remain unchanged. Because this callback has no dependencies, it stays stable for the lifetime of the mounted component.

// That helps prevent the project-fetching effect from running again just because the component rendered.

// ## 7. The third `useEffect`: deciding when to fetch projects

// ```
// useEffect(() => {
//   if (!workspaceId || !activeWorkspace) {
//     projectRequestId.current += 1;
//     return undefined;
//   }

//   let cancelled = false;

//   Promise.resolve().then(() => {
//     if (!cancelled) void loadProjects(workspaceId);
//   });

//   return () => {
//     cancelled = true;
//     projectRequestId.current += 1;
//   };
// }, [workspaceId, activeWorkspace, loadProjects]);
// ```

// This effect runs when the selected workspace or the relevant dependencies change.

// It checks that a valid workspace is selected, then calls `loadProjects(workspaceId)`.

// ### Why the cleanup increments the request ID

// ```
// projectRequestId.current += 1;
// ```

// If the workspace changes or the component unmounts, this invalidates an earlier in-flight request. Its result won't pass the request ID check.

// ### Why `Promise.resolve().then(...)`?

// It schedules the call to `loadProjects` in a microtask, giving the effect a chance to clean up before the fetch starts. If the effect has already been cancelled, the request is skipped.

// It's valid JavaScript, but it adds complexity. In a simpler implementation, you can call `loadProjects(workspaceId)` directly and use the cleanup to invalidate stale requests. The important thing is to keep one project-fetching effect, not duplicate effects that both fetch the same workspace's projects.

// One nuance in your current code: the early return when there is no active workspace invalidates requests, but doesn't immediately clear the old `projectsWorkspaceId` or loading state. Your workspace-selection effect normally corrects an invalid URL, but explicitly resetting those states in that branch would make the loading behavior more robust.

// ## 8. `useMemo`: searching and filtering projects

// ```
// const filteredProjects = useMemo(() => {
//   const normalizedSearch = search.trim().toLowerCase();

//   return projects.filter((project) => {
//     const matchesSearch =
//       !normalizedSearch ||
//       `${project.name} ${project.description ?? ""}`
//         .toLowerCase()
//         .includes(normalizedSearch);

//     const matchesStatus =
//       statusFilter === "all" ||
//       project.status === statusFilter;

//     return matchesSearch && matchesStatus;
//   });
// }, [projects, search, statusFilter]);
// ```

// This filters projects in the frontend. It doesn't send another request to the server.

// Suppose you have these projects:

// | Project   | Status    |
// | --------- | --------- |
// | TaskFlow  | active    |
// | Portfolio | completed |
// | Chat App  | planning  |

// If the user searches for `"app"` and selects `"planning"`, only Chat App matches.

// The search checks both the project name and description. The `trim()` removes whitespace at the beginning and end, while `toLowerCase()` makes the search case-insensitive.

// The filter combines two conditions:

// ```
// return matchesSearch && matchesStatus;
// ```

// Both must be true.

// `useMemo` caches the filtered array until `projects`, `search`, or `statusFilter` changes. For a small list, this optimization isn't essential, but it's reasonable to use here.

// ## 9. Workspace selection and modal functions

// ### Selecting a workspace

// ```
// function selectWorkspace(nextWorkspaceId) {
//   const nextParams = new URLSearchParams(searchParams);
//   nextParams.set("workspaceId", nextWorkspaceId);
//   setSearchParams(nextParams);
//   setActionError("");
// }
// ```

// When a user selects a different workspace from the dropdown:

// 1. Update the `workspaceId` query parameter.
// 2. React Router updates the URL.
// 3. The project-fetching effect detects the change.
// 4. Projects for the newly selected workspace are fetched.

// This is useful because you can bookmark or share a URL pointing to a particular workspace.

// ### Opening the create modal

// ```
// function openCreateModal() {
//   setModalProject(null);
//   setFormError("");
//   setModalOpen(true);
// }
// ```

// Setting `modalProject` to `null` indicates that the form should create a new project rather than edit an existing one.

// ### Opening the edit modal

// ```
// function openEditModal(project) {
//   setModalProject(project);
//   setFormError("");
//   setModalOpen(true);
// }
// ```

// This time, you store the existing project object. `ProjectForm` can use its properties to populate the form fields.

// The same form component therefore supports both operations.

// ## 10. Saving a project: create versus update

// ```
// async function handleSaveProject(projectData) {
//   setSubmitting(true);
//   setFormError("");

//   try {
//     if (modalProject) {
//       await updateProject(
//         workspaceId,
//         modalProject.id,
//         projectData,
//       );
//     } else {
//       await createProject(workspaceId, projectData);
//     }

//     setModalOpen(false);
//     setModalProject(null);
//     await loadProjects(workspaceId);
//   } catch (error) {
//     setFormError(
//       getErrorMessage(
//         error,
//         `Unable to ${modalProject ? "update" : "create"} the project.`,
//       ),
//     );
//   } finally {
//     setSubmitting(false);
//   }
// }
// ```

// The logic is straightforward:

// - If `modalProject` exists, send an update request.
// - Otherwise, send a create request.
// - On success, close the modal and reload the project list.
// - On failure, display the error in the form.
// - Regardless of success or failure, reset `submitting`.

// The `await` keyword ensures that each asynchronous operation finishes before the next step runs.

// For example, creating a project follows this sequence:

// 1

// User submits ProjectForm

// 2

// POST request creates project

// 3

// Modal closes on success

// 4

// GET request refreshes project list

// 5

// React renders the updated list

// One detail: the modal closes only after the create/update request succeeds. If the request fails, the modal stays open so the user can correct the problem or try again.

// ## 11. Archive, restore, and delete

// Your `handleProjectAction` function uses one handler for three different actions:

// ```
// if (action === "archive") {
//   await archiveProject(workspaceId, project.id);
// } else if (action === "restore") {
//   await restoreProject(workspaceId, project.id);
// } else {
//   await deleteProject(workspaceId, project.id);
// }
// ```

// The action is selected by the `ProjectCard` component, which calls `onAction`.

// Before deletion or archiving, the function asks for confirmation:

// ```
// window.confirm(`Archive "${project.name}"?`)
// ```

// Deletion has a stronger warning because it is permanent.

// ### What is `busyProjectId` for?

// ```
// setBusyProjectId(project.id);
// ```

// When an action begins, the component records which project is being processed. Then the card receives:

// ```
// busy={busyProjectId === project.id}
// ```

// That allows `ProjectCard` to disable buttons or show a loading indicator for the affected project.

// After the request finishes, `finally` resets `busyProjectId` to `null`.

// One limitation: because you're storing only one ID, two actions on different cards could overlap. If you want to prevent that, disable all project actions while any action is running, or track multiple busy IDs.

// Also, hiding buttons from members or viewers is only a user-experience feature. The backend must still reject unauthorized requests.

// ## 12. Conditional rendering: which UI does the user see?

// The page uses early `return` statements to handle workspace-level states before rendering the main page.

// Workspaces are loading

// Show a spinner and “Loading workspaces...” instead of the page.

// Workspace request failed

// Show the error and a Try again button.

// No workspaces exist

// Show a message directing the user to create or join a workspace.

// Workspaces are available

// Render the main Projects page, including filters, cards, and modal.

// Within the main page, this expression decides whether to show the projects, loading skeletons, an error, or an empty state:

// ```
// projectsWorkspaceId === workspaceId && projectsError
//   ? /* error UI */
//   : !activeWorkspace ||
//     projectsLoading ||
//     projectsWorkspaceId !== workspaceId
//   ? /* loading skeletons */
//   : filteredProjects.length
//   ? /* project cards */
//   : projects.length
//   ? /* no matching projects */
//   : /* no projects in this workspace */
// ```

// The nested ternary works, but it can be difficult to read. Conceptually, the decision order is:

// 1. Is there an error for the current workspace?
// 2. Is the selected workspace still loading or not yet synchronized with the project list?
// 3. Are there projects matching the filters?
// 4. Are there projects, but none match the filters?
// 5. Is the workspace genuinely empty?

// That distinction between “no matching projects” and “no projects in this workspace” is a nice UX detail.

// ## 13. Rendering the filters and project cards

// The workspace dropdown is generated dynamically:

// ```
// {workspaces.map((workspace) => (
//   <option key={workspace.id} value={workspace.id}>
//     {workspace.name}
//   </option>
// ))}
// ```

// React's `.map()` converts each workspace object into an option. The `key` gives React a stable identity for each option.

// The project cards work similarly:

// ```
// {filteredProjects.map((project) => (
//   <ProjectCard
//     busy={busyProjectId === project.id}
//     canManage={canManageProjects}
//     key={project.id}
//     onAction={handleProjectAction}
//     onEdit={openEditModal}
//     project={project}
//     workspaceId={workspaceId}
//   />
// ))}
// ```

// This is a good example of props in React:

// | Prop          | What it tells `ProjectCard`                             |
// | ------------- | ------------------------------------------------------- |
// | `project`     | Which project's data to display.                        |
// | `workspaceId` | Which workspace the project belongs to.                 |
// | `canManage`   | Whether management actions should be available.         |
// | `busy`        | Whether this project's action is in progress.           |
// | `onAction`    | What to do when archive, restore, or delete is clicked. |
// | `onEdit`      | What to do when Edit is clicked.                        |

// The child component doesn't need to know how the API request works. It calls the callback provided by the parent, and the parent handles the request.

// At the bottom, `ProjectForm` receives the current project, errors, submitting state, and callbacks. That keeps form UI separate from page-level data management.

// ## 14. A few improvements worth considering

// Your code is organized reasonably well. These are the main things I would improve next:

// 1. Simplify the project-fetching effect. The current `Promise.resolve().then(...)` is more complex than necessary. Keep the request-ID protection, but make the fetch lifecycle easier to follow.
// 2. Clear project state when there is no valid workspace. This avoids stale loading or project state if the selected workspace disappears.
// 3. Disable duplicate actions. Prevent users from submitting multiple archive/delete requests simultaneously.
// 4. Keep status values consistent. Your frontend includes `archived`; ensure your MySQL enum and backend validation also permit it.
// 5. Handle network errors consistently. Your `getErrorMessage` helper could also fall back to `error.message`, so the same helper works for network failures.