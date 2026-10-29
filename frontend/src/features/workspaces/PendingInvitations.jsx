import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  acceptInvitation,
  declineInvitation,
  getPendingInvitations,
  revokeInvitation,
} from "../../api/invitationApi";
import { useAuthStore } from "../../stores/authStore";
import useDebounce from "../../hooks/useDebounce";

function InvitationCard({ invitation, sent, busy, onAction }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-xl border border-app-border bg-surface p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-800 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          {sent ? <Send size={18} /> : <Mail size={18} />}
        </span>
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-text-primary">
            {invitation.workspace_name}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {sent
              ? `Invited ${invitation.invited_user_name || "a user"}`
              : `Invited by ${invitation.inviter_name || "a workspace admin"}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {invitation.role}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
              <Clock3 size={13} />
              {invitation.created_at
                ? new Date(invitation.created_at).toLocaleDateString()
                : "Pending"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 sm:justify-end">
        {sent ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
            disabled={busy}
            onClick={() => onAction(invitation, "revoke")}
            type="button"
          >
            {busy ? (
              <RefreshCw className="animate-spin" size={15} />
            ) : (
              <X size={15} />
            )}
            Revoke
          </button>
        ) : (
          <>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
              disabled={busy}
              onClick={() => onAction(invitation, "accept")}
              type="button"
            >
              {busy ? (
                <RefreshCw className="animate-spin" size={15} />
              ) : (
                <Check size={15} />
              )}
              Accept
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-subtle-hover disabled:opacity-50"
              disabled={busy}
              onClick={() => onAction(invitation, "decline")}
              type="button"
            >
              <X size={15} />
              Decline
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function InvitationGroup({
  title,
  icon: Icon,
  invitations,
  emptyText,
  busyId,
  onAction,
  sent,
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="text-brand" size={18} />
        <h2 className="font-semibold text-text-primary">{title}</h2>
        <span className="rounded-full bg-subtle-hover px-2 py-0.5 text-xs font-medium text-text-secondary">
          {invitations.length}
        </span>
      </div>
      {invitations.length ? (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <InvitationCard
              busy={busyId === invitation.id}
              invitation={invitation}
              key={invitation.id}
              onAction={onAction}
              sent={sent}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-app-border bg-surface px-5 py-6 text-sm text-text-secondary">
          {emptyText}
        </p>
      )}
    </section>
  );
}

export default function PendingInvitations() {
  const username = useAuthStore((state) => state.username);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [acceptedWorkspaceId, setAcceptedWorkspaceId] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const loadInvitations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const data = await getPendingInvitations();
      setInvitations(data.invitations ?? []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Could not load your invitations.",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadInvitations());
  }, [loadInvitations]);

  const isSentByCurrentUser = useCallback(
    (invitation) =>
      invitation.is_sender === true ||
      invitation.is_sender === 1 ||
      (invitation.is_sender === undefined &&
        invitation.inviter_name === username),
    [username],
  );

  const filteredInvitations = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return invitations.filter((invitation) => {
      if (!query) return true;
      return `${invitation.workspace_name} ${invitation.inviter_name ?? ""} ${
        invitation.invited_user_name ?? ""
      } ${invitation.role}`
        .toLowerCase()
        .includes(query);
    });
  }, [debouncedSearch, invitations]);

  const receivedInvitations = filteredInvitations.filter(
    (invitation) => !isSentByCurrentUser(invitation),
  );
  const sentInvitations = filteredInvitations.filter(isSentByCurrentUser);

  async function handleResponse(invitation, action) {
    setError("");
    setMessage("");
    setAcceptedWorkspaceId(null);
    setBusyId(invitation.id);

    try {
      if (action === "accept") {
        await acceptInvitation(invitation.id);
        setMessage(`You joined ${invitation.workspace_name} successfully.`);
        setAcceptedWorkspaceId(invitation.workspace_id);
      } else if (action === "revoke") {
        await revokeInvitation(invitation.workspace_id, invitation.id);
        setMessage(`Invitation to ${invitation.workspace_name} revoked.`);
      } else {
        await declineInvitation(invitation.id);
        setMessage(`Invitation to ${invitation.workspace_name} declined.`);
      }

      await loadInvitations(false);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          `Could not ${action} this invitation.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  function refreshInvitations() {
    setLoading(true);
    void loadInvitations();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Collaboration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            Workspace invitations
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review invitations you&apos;ve received and track those you&apos;ve sent.
          </p>
        </div>
        <button
          aria-label="Refresh invitations"
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-subtle-hover disabled:opacity-50 sm:self-auto"
          disabled={loading}
          onClick={refreshInvitations}
          type="button"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
          Refresh
        </button>
      </header>

      {error && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>
          <button
            className="font-semibold underline"
            onClick={refreshInvitations}
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {message && (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          role="status"
        >
          {message}
          {acceptedWorkspaceId && (
            <Link
              className="ml-2 font-semibold underline"
              to={`/workspaces/${acceptedWorkspaceId}`}
            >
              Open workspace
            </Link>
          )}
        </div>
      )}

      <div className="relative max-w-md">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          size={17}
        />
        <input
          className="w-full rounded-lg border border-app-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search workspace or inviter"
          type="search"
          value={search}
        />
      </div>

      {loading ? (
        <div
          aria-label="Loading invitations"
          className="space-y-3"
          role="status"
        >
          {[0, 1, 2].map((item) => (
            <div
              className="h-28 animate-pulse rounded-xl border border-app-border bg-surface"
              key={item}
            />
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-app-border bg-surface p-10 text-center">
          <Mail className="mx-auto mb-3 text-text-secondary" size={32} />
          <h2 className="font-semibold text-text-primary">
            You&apos;re all caught up
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            You don&apos;t have any pending workspace invitations.
          </p>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-app-border bg-surface p-10 text-center">
          <Search className="mx-auto mb-3 text-text-secondary" size={28} />
          <h2 className="font-semibold text-text-primary">
            No matching invitations
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Try a different workspace or person name.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          <InvitationGroup
            busyId={busyId}
            emptyText="No invitations are waiting for your response."
            icon={Mail}
            invitations={receivedInvitations}
            onAction={handleResponse}
            sent={false}
            title="Received"
          />
          <InvitationGroup
            busyId={busyId}
            emptyText="You have no pending invitations sent to others."
            icon={Send}
            invitations={sentInvitations}
            onAction={handleResponse}
            sent
            title="Sent"
          />
        </div>
      )}
    </div>
  );
}
