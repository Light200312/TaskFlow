
import { useCallback, useEffect, useState } from "react";
import { UserPlus, RefreshCw, X } from "lucide-react";
import {
  createInvitation,
  getWorkspaceInvitations,
  revokeInvitation,
} from "../../api/invitationApi";

export default function WorkspaceInvitations({ workspaceId }) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getWorkspaceInvitations(workspaceId);
      setInvitations(data.invitations ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load workspace invitations."
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    Promise.resolve().then(loadInvitations);
  }, [loadInvitations]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^[1-9]\d*$/.test(userId)) {
      setError("Enter a valid user ID.");
      return;
    }

    try {
      setSubmitting(true);

      await createInvitation(workspaceId, userId, role);

      setMessage("Invitation sent successfully.");
      setUserId("");
      setRole("member");

      await loadInvitations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not send invitation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (invitationId) => {
    setError("");
    setMessage("");

    try {
      await revokeInvitation(workspaceId, invitationId);
      setMessage("Invitation revoked.");
      await loadInvitations();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not revoke invitation."
      );
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">
          Invite members
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Invite an existing TaskFlow user to this workspace.
        </p>
      </div>

      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-4 rounded-xl border border-app-border bg-surface p-5 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="invite-user-id"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            User ID
          </label>
          <input
            id="invite-user-id"
            type="number"
            min="1"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Enter user ID"
            className="w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
            required
          />
        </div>

        <div>
          <label
            htmlFor="invite-role"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm text-text-primary sm:w-36"
          >
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus size={17} />
          {submitting ? "Sending..." : "Send invite"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-app-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-app-border p-4">
          <h3 className="font-semibold text-text-primary">
            Sent invitations
          </h3>
          <button
            type="button"
            onClick={loadInvitations}
            disabled={loading}
            aria-label="Refresh invitations"
            className="rounded-lg p-2 text-text-secondary hover:bg-subtle-hover"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-text-secondary">
            Loading invitations...
          </p>
        ) : invitations.length === 0 ? (
          <p className="p-5 text-sm text-text-secondary">
            No invitations have been sent yet.
          </p>
        ) : (
          <div className="divide-y divide-app-border">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-text-primary">
                    {invitation.invited_user_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {invitation.invited_user_email}
                  </p>
                  <p className="mt-1 text-xs capitalize text-text-secondary">
                    {invitation.role} · {invitation.status}
                  </p>
                </div>

                {invitation.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(invitation.id)}
                    className="inline-flex items-center gap-1 self-start rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50 sm:self-auto"
                  >
                    <X size={15} />
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
