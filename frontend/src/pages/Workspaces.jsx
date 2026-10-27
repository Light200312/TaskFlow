
import { useEffect, useState } from "react";
import { Plus, Users, FolderKanban, RefreshCw } from "lucide-react";
import { getWorkspaces, createWorkspace } from "../api/workspaceApi";
import WorkspaceCard from "../features/workspaces/WorkspaceCard";
import WorkspaceForm from "../features/workspaces/WorkspaceForm";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formError, setFormError] = useState("");

  async function loadWorkspaces() {
    setLoading(true);
    setError("");

    try {
      const data = await getWorkspaces();
      setWorkspaces(data.workspaces ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load workspaces. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

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

      await loadWorkspaces();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Could not create workspace. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 dark:text-white">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white text-slate-900">
            Workspaces
          </h1>
          <p className="mt-1 text-sm dark:text-white text-slate-500">
            Organize projects and collaborate with your team.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Create <span className="hidden md:block">Workspace</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <FolderKanban size={22} />
            </div>
            <div>
              <p className="text-sm  text-slate-500">Total workspaces</p>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? "—" : workspaces.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Owned by you</p>
              <p className="text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : workspaces.filter((w) => w.role === "owner").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold dark:text-white text-slate-900">
            Your workspaces
          </h2>

          <button
            onClick={loadWorkspaces}
            disabled={loading}
            aria-label="Refresh workspaces"
            className="rounded-lg p-2 dark:text-white text-slate-500 hover:bg-white hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={loadWorkspaces}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading workspaces...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={26} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No workspaces yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Create your first workspace to organize projects and collaborate
              with others.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
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
