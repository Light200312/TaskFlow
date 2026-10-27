import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FolderKanban,
  Plus,
  RefreshCw,
} from "lucide-react";
import WorkspaceInvitations from
  "../features/workspaces/WorkspaceInvitations";
import { getWorkspaceById } from "../api/workspaceApi";
import { getProjectsByWorkspace, createProject } from "../api/projectApi";
import ProjectCard from "../features/projects/ProjectCard";
import ProjectForm from "../features/projects/ProjectForm";

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

  async function loadProjects() {
    setProjectsLoading(true);
    setProjectsError("");

    try {
      const data = await getProjectsByWorkspace(workspaceId);
      setProjects(data.projects ?? []);
    } catch (err) {
      setProjectsError(
        err.response?.data?.message || "Unable to load projects.",
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
            err.response?.data?.message || "Unable to load this workspace.",
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

  async function handleCreateProject(projectData) {
    setFormError("");

    setCreating(true);

    try {
      await createProject(workspaceId, projectData);

      setShowModal(false);
      await loadProjects();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to create project. Please try again.",
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
<WorkspaceInvitations workspaceId={workspaceId} />
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
              setFormError("");
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
            <button onClick={loadProjects} className="font-semibold underline">
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
                setFormError("");
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
              <ProjectCard
                key={project.id}
                project={project}
                workspaceId={workspaceId}
              />
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
