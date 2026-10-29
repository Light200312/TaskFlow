import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  deleteCurrentUserAvatar,
  getCurrentUser,
  getCurrentUserAvatar,
  updateUserName,
  uploadCurrentUserAvatar,
} from "../api/userApi";
import { useAuthStore } from "../stores/authStore";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const INPUT_STYLES =
  "w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900";

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function Settings() {
  const setUsername = useAuthStore((state) => state.setUsername);
  const refreshAvatar = useAuthStore((state) => state.refreshAvatar);
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarRevision, setAvatarRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
          setName(currentUser.name);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            getErrorMessage(
              requestError,
              "Unable to load your account details.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    getCurrentUserAvatar()
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setAvatarUrl(objectUrl);
          setAvatarError("");
        }
      })
      .catch((requestError) => {
        if (cancelled) return;
        if (requestError.response?.status === 404) {
          setAvatarUrl("");
          setAvatarError("");
          return;
        }
        setAvatarError(
          getErrorMessage(requestError, "Unable to load your profile picture."),
        );
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarRevision]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  async function handleSave(event) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }
    if (trimmedName.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateUserName(trimmedName);
      setUser(response.user);
      setName(response.user.name);
      setUsername(response.user.name);
      setEditing(false);
      setSuccess("Your name was updated successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to update your name."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarSelection(event) {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setAvatarPreview("");

    setAvatarError("");
    setError("");
    setSuccess("");

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Choose a PNG, JPEG, or WebP image.");
      setAvatarFile(null);
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Profile pictures must be 2 MB or smaller.");
      setAvatarFile(null);
      return;
    }

    previewUrlRef.current = URL.createObjectURL(file);
    setAvatarPreview(previewUrlRef.current);
    setAvatarFile(file);
  }

  function clearAvatarSelection() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setAvatarPreview("");
    setAvatarFile(null);
  }

  async function handleUploadAvatar() {
    if (!avatarFile) return;

    try {
      setUploading(true);
      setAvatarError("");
      setSuccess("");
      const response = await uploadCurrentUserAvatar(avatarFile);
      clearAvatarSelection();
      setAvatarRevision((revision) => revision + 1);
      refreshAvatar();
      setSuccess(response.message || "Profile picture updated successfully.");
    } catch (requestError) {
      setAvatarError(
        getErrorMessage(requestError, "Unable to upload your profile picture."),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    try {
      setRemovingAvatar(true);
      setAvatarError("");
      setSuccess("");
      const response = await deleteCurrentUserAvatar();
      clearAvatarSelection();
      setAvatarUrl("");
      setAvatarRevision((revision) => revision + 1);
      refreshAvatar();
      setSuccess(response.message || "Profile picture removed successfully.");
    } catch (requestError) {
      setAvatarError(
        getErrorMessage(requestError, "Unable to remove your profile picture."),
      );
    } finally {
      setRemovingAvatar(false);
    }
  }

  function handleCancelNameEdit() {
    setName(user?.name ?? "");
    setEditing(false);
    setError("");
    setSuccess("");
  }

  if (loading) {
    return (
      <div
        aria-label="Loading settings"
        className="mx-auto max-w-4xl space-y-4"
        role="status"
      >
        <div className="h-20 animate-pulse rounded-xl bg-subtle-hover" />
        <div className="h-80 animate-pulse rounded-2xl bg-subtle-hover" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
        <button
          className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-300"
          onClick={() => window.location.reload()}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) return null;

  const displayedAvatar = avatarPreview || avatarUrl;
  const avatarBusy = uploading || removingAvatar;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-medium text-brand">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your profile and account details.
        </p>
      </header>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm">
        <div className="border-b border-app-border p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative size-24 shrink-0">
              {displayedAvatar ? (
                <img
                  alt={`${user.name}'s profile`}
                  className="size-24 rounded-full border border-app-border object-cover"
                  src={displayedAvatar}
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <UserRound size={38} />
                </div>
              )}
              <span className="absolute bottom-0 right-0 rounded-full bg-brand p-2 text-white">
                <ImagePlus size={15} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-text-primary">
                Profile picture
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                PNG, JPEG, or WebP. Maximum file size: 2 MB.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleAvatarSelection}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-subtle-hover disabled:opacity-50"
                  disabled={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <ImagePlus size={16} />
                  Choose image
                </button>
                {avatarFile && (
                  <>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
                      disabled={avatarBusy}
                      onClick={handleUploadAvatar}
                      type="button"
                    >
                      {uploading ? (
                        <RefreshCw className="animate-spin" size={16} />
                      ) : (
                        <Upload size={16} />
                      )}
                      {uploading ? "Uploading..." : "Upload picture"}
                    </button>
                    <button
                      className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-subtle-hover disabled:opacity-50"
                      disabled={avatarBusy}
                      onClick={clearAvatarSelection}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {!avatarFile && avatarUrl && (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
                    disabled={avatarBusy}
                    onClick={handleRemoveAvatar}
                    type="button"
                  >
                    {removingAvatar ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {removingAvatar ? "Removing..." : "Remove picture"}
                  </button>
                )}
              </div>
              {avatarError && (
                <p
                  className="mt-3 text-sm text-red-700 dark:text-red-300"
                  role="alert"
                >
                  {avatarError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <UserRound className="text-text-secondary" size={16} />
              <label className="text-sm font-medium text-text-primary">
                Full name
              </label>
            </div>
            {editing ? (
              <form className="space-y-3" onSubmit={handleSave}>
                <input
                  autoFocus
                  className={INPUT_STYLES}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                  value={name}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={saving || !name.trim()}
                    type="submit"
                  >
                    {saving ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-app-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-subtle-hover disabled:opacity-50"
                    disabled={saving}
                    onClick={handleCancelNameEdit}
                    type="button"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="break-words text-sm text-text-primary">
                  {user.name}
                </p>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-subtle-hover"
                  onClick={() => {
                    setName(user.name);
                    setEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                  type="button"
                >
                  <Pencil size={15} />
                  Edit name
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-app-border pt-5">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="text-text-secondary" size={16} />
              <span className="text-sm font-medium text-text-primary">
                Email address
              </span>
            </div>
            <p className="break-all text-sm text-text-secondary">{user.email}</p>
            <p className="mt-1 text-xs text-text-secondary">
              Email editing is not available yet.
            </p>
          </div>

          <div className="border-t border-app-border pt-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="text-text-secondary" size={16} />
              <span className="text-sm font-medium text-text-primary">
                Account ID
              </span>
            </div>
            <p className="text-sm text-text-secondary">{user.id}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
