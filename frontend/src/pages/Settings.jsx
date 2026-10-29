
import { useEffect, useState } from "react";
import { UserRound, Mail, ShieldCheck, Pencil, Save, X } from "lucide-react";
import { getCurrentUser, updateUserName } from "../api/userApi";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        setLoading(true);
        setError("");

        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
          setName(currentUser.name);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your account details.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (trimmedName.length > 150) {
      setError("Name cannot exceed 150 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateUserName(trimmedName);

      setUser(response.user);
      setName(response.user.name);
      setEditing(false);
      setSuccess("Your name was updated successfully.");

      // Keep the stored username consistent with the backend.
      localStorage.setItem("taskflow_username", response.user.name);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update your name.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? "");
    setEditing(false);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
        Loading your settings...
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account details and preferences.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {success}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 sm:p-6 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <UserRound size={26} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Personal information
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your TaskFlow account details
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full name
            </label>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-3">
                <input
                  autoFocus
                  type="text"
                  maxLength={150}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="break-words text-sm text-slate-900 dark:text-white">
                  {user.name}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  Edit name
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-2">
              <Mail size={16} className="text-slate-500" />
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
            </div>
            <p className="break-all text-sm text-slate-600 dark:text-slate-400">
              {user.email}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Email editing is not available yet.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Account ID
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {user.id}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
