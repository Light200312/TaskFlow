
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FolderKanban,
  Plus,
  CalendarDays,
  RefreshCw,
  X,
} from "lucide-react";

import { getWorkspaceById } from "../api/workspaceApi";
import {
  getProjectsByWorkspace,
  createProject,
} from "../api/projectApi";

const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

const STATUS_STYLES = {
  planning:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  on_hold:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};

function formatDate(date) {
  if (!date) return null;

  // Avoid timezone shifts when MySQL returns a YYYY-MM-DD date.
  const [year, month, day] = String(date).slice(0, 10).split("-");
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectCard({ project }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <FolderKanban size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-semibold text-slate-900 dark:text-slate-100">
              {project.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Project #{project.id}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_STYLES[project.status] || STATUS_STYLES.planning
          }`}
        >
          {project.status.replace("_", " ")}
        </span>
      </div>

      <p className="mt-4 min-h-10 whitespace-pre-wrap break-words text-sm text-slate-600 dark:text-slate-300">
        {project.description || "No description provided."}
      </p>

      {project.due_date && (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <CalendarDays size={15} />
          Due {formatDate(project.due_date)}
        </div>
      )}
    </article>
  );
}

export default function WorkspaceDetails() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");
  const [projectsError, setProjectsError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [dueDate, setDueDate] = useState("");

  async function loadProjects() {
    setProjectsLoading(true);
    setProjectsError("");

    try {
      const data = await getProjectsByWorkspace(workspaceId);
      setProjects(data.projects ?? []);
    } catch (err) {
      setProjectsError(
        err.response?.data?.message ||
          "Unable to load projects."
      );
    } finally {
      setProjectsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoading(true);
      setError("");

      try {
        const data = await getWorkspaceById(workspaceId);

        if (!cancelled) {
          setWorkspace(data.workspace);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load this workspace."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    loadProjects();
  }, [workspaceId]);

  function resetForm() {
    setName("");
    setDescription("");
    setStatus("planning");
    setDueDate("");
    setFormError("");
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    setCreating(true);

    try {
      await createProject(workspaceId, {
        name: name.trim(),
        description: description.trim() || null,
        status,
        due_date: dueDate || null,
      });

      setShowModal(false);
      resetForm();
      await loadProjects();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to create project. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Loading workspace...
      </p>
    );
  }

  if (error || !workspace) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300">
          {error || "Workspace not found."}
        </p>
        <button
          onClick={() => navigate("/workspaces")}
          className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
        >
          Back to workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <button
        onClick={() => navigate("/workspaces")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
      >
        <ArrowLeft size={17} />
        All workspaces
      </button>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <FolderKanban size={28} />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-slate-100">
              {workspace.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              /{workspace.slug}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Workspace ID: {workspace.id}
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Projects
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage the work happening in this workspace.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            New project
          </button>
        </div>

        {projectsError && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <span>{projectsError}</span>
            <button
              onClick={loadProjects}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {projectsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <FolderKanban
              className="mx-auto text-slate-400 dark:text-slate-500"
              size={30}
            />
            <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a project to start organizing your work.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={loadProjects}
            disabled={projectsLoading}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white hover:text-indigo-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <RefreshCw
              size={15}
              className={projectsLoading ? "animate-spin" : ""}
            />
            Refresh projects
          </button>
        </div>
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-project-title"
                  className="text-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  Create project
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add a project to {workspace.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={creating}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Project name *
                </label>
                <input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={150}
                  required
                  autoFocus
                  placeholder="e.g. Website redesign"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-950"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="What is this project about?"
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="project-status"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Status
                  </label>
                  <select
                    id="project-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                    htmlFor="project-due-date"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Due date
                  </label>
                  <input
                    id="project-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
