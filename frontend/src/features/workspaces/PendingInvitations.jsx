
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, RefreshCw, Mail } from "lucide-react";
import {
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,revokeInvitation
} from "../../api/invitationApi";
import { useAuthStore } from "../../stores/authStore";
export default function PendingInvitations() {
const {username} = useAuthStore();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [acceptedWorkspaceId, setAcceptedWorkspaceId] = useState(null);

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPendingInvitations();
      setInvitations(data.invitations ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load your invitations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleResponse = async (invitation, action) => {
    setError("");
    setMessage("");
    setAcceptedWorkspaceId(null);
    setBusyId(invitation.id);

    try {
      if (action === "accept") {
        await acceptInvitation(invitation.id);
        setMessage(
          `You joined ${invitation.workspace_name} successfully.`
        );
        setAcceptedWorkspaceId(invitation.workspace_id);
      }
      else if (action === "revoke") {
        await revokeInvitation(invitation.workspace_id,invitation.id);
        setMessage(
          `Invitation to ${invitation.workspace_name} revoked.`
        );
      }
      else {
        await declineInvitation(invitation.id);
        setMessage(
          `Invitation to ${invitation.workspace_name} declined.`
        );
      }

      await loadInvitations();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Could not ${action} this invitation.`
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Workspace invitations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage invitations you've received.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInvitations}
          disabled={loading}
          aria-label="Refresh invitations"
          className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
          {acceptedWorkspaceId && (
            <Link
              to={`/workspaces/${acceptedWorkspaceId}`}
              className="ml-2 font-semibold underline"
            >
              Open workspace
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">
          Loading invitations...
        </p>
      ) : invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Mail className="mx-auto mb-3 text-slate-400" size={32} />
          <h2 className="font-semibold text-slate-800">
            You're all caught up
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            You don't have any pending invitations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <article
              key={invitation.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {invitation.workspace_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Invited by {invitation.inviter_name===username?"you":invitation.inviter_name}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
                    {invitation.role}
                  </span>
                </div>

                <div className="flex gap-2">
             {invitation.inviter_name===username? (
                <div className="text-sm text-slate-500">
                   <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => handleResponse(invitation, "revoke")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                   <X size={16} />
                    Revoke
                  </button>
                </div>
             ): <div> <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => handleResponse(invitation, "accept")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Check size={16} />
                    Accept
                  </button>

                  <button
                    type="button"
                    disabled={busyId === invitation.id}
                    onClick={() => handleResponse(invitation, "decline")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X size={16} />
                    Decline
                  </button></div>}  
             
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
