
import { useEffect, useState } from "react";
import { Plus, Users, FolderKanban, X, RefreshCw } from "lucide-react";
import { getWorkspaces, createWorkspace } from "../api/workspaceApi";
import { useNavigate } from "react-router-dom";
function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export default function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
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

  function handleNameChange(value) {
    setName(value);

    if (!slugEdited) {
      setSlug(createSlug(value));
    }
  }

  function openCreateModal() {
    setName("");
    setSlug("");
    setSlugEdited(false);
    setFormError("");
    setShowModal(true);
  }

  async function handleCreateWorkspace(event) {
    event.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      setFormError("Workspace name is required.");
      return;
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug) ||
      trimmedSlug.length > 100
    ) {
      setFormError(
        "Use lowercase letters, numbers, and single hyphens in the slug."
      );
      return;
    }

    setCreating(true);

    try {
      await createWorkspace({
        name: trimmedName,
        slug: trimmedSlug,
      });

      setShowModal(false);
      setName("");
      setSlug("");
      setSlugEdited(false);

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
              <article
              onClick={() => navigate(`/workspaces/${workspace.id}`)}
                key={workspace.id}
                className="rounded-xl cursor-pointer border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {workspace.name}
                      </h3>
                      <p className="truncate text-sm text-slate-500">
                        /{workspace.slug}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                    {workspace.role || "Member"}
                  </span>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    Workspace ID: {workspace.id}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-workspace-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="create-workspace-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Create workspace
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set up a space for your team and projects.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                disabled={creating}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label
                  htmlFor="workspace-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Workspace name
                </label>
                <input
                  id="workspace-name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  maxLength={100}
                  required
                  autoFocus
                  placeholder="e.g. Engineering Team"
                  className="w-full text-black rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="workspace-slug"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Workspace slug
                </label>
                <input
                  id="workspace-slug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugEdited(true);
                  }}
                  maxLength={100}
                  required
                  placeholder="engineering-team"
                  className="w-full text-black rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
