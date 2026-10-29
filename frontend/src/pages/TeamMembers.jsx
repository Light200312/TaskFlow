import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  Search,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import {
  getWorkspaceMembers,
  getWorkspaces,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../api/workspaceApi";
import useDebounce from "../hooks/useDebounce";

const ROLES = ["admin", "member", "viewer"];

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function TeamMembers() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [reloadWorkspaces, setReloadWorkspaces] = useState(0);
  const [reloadMembers, setReloadMembers] = useState(0);
  const [search, setSearch] = useState("");
  const [roleDrafts, setRoleDrafts] = useState({});
  const [busyMemberId, setBusyMemberId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      setWorkspaceLoading(true);
      setWorkspaceError("");

      try {
        const response = await getWorkspaces();
        if (!cancelled) {
          const accessibleWorkspaces = response.workspaces ?? [];
          setWorkspaces(accessibleWorkspaces);
          setSelectedWorkspaceId((currentId) => {
            const currentExists = accessibleWorkspaces.some(
              (workspace) => String(workspace.id) === currentId,
            );
            return currentExists
              ? currentId
              : String(accessibleWorkspaces[0]?.id ?? "");
          });
        }
      } catch (error) {
        if (!cancelled) {
          setWorkspaceError(
            getErrorMessage(error, "Unable to load your workspaces."),
          );
        }
      } finally {
        if (!cancelled) setWorkspaceLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadWorkspaces]);

  useEffect(() => {
    if (!selectedWorkspaceId) return undefined;

    let cancelled = false;

    Promise.resolve().then(async () => {
      setMembersLoading(true);
      setMembersError("");
      setActionError("");
      setActionMessage("");

      try {
        const response = await getWorkspaceMembers(selectedWorkspaceId);
        const workspaceMembers = Array.isArray(response)
          ? response
          : response.members ?? [];
        if (!cancelled) {
          setMembers(workspaceMembers);
          setRoleDrafts(
            Object.fromEntries(
              workspaceMembers.map((member) => [member.id, member.role]),
            ),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setMembers([]);
          setMembersError(
            getErrorMessage(error, "Unable to load workspace members."),
          );
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId, reloadMembers]);

  const selectedWorkspace = workspaces.find(
    (workspace) => String(workspace.id) === selectedWorkspaceId,
  );
  const canManageMembers = ["owner", "admin"].includes(
    selectedWorkspace?.role,
  );

  const filteredMembers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) =>
      `${member.name} ${member.email} ${member.role}`
        .toLowerCase()
        .includes(query),
    );
  }, [debouncedSearch, members]);

  async function handleSaveRole(member) {
    const role = roleDrafts[member.id];
    if (!role || role === member.role) return;

    setBusyMemberId(member.id);
    setActionError("");
    setActionMessage("");

    try {
      await updateWorkspaceMemberRole(selectedWorkspaceId, member.id, role);
      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.id === member.id
            ? { ...currentMember, role }
            : currentMember,
        ),
      );
      setActionMessage(`${member.name}'s role was updated.`);
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to update member role."));
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [member.id]: member.role,
      }));
    } finally {
      setBusyMemberId(null);
    }
  }

  async function handleRemoveMember(member) {
    if (
      !window.confirm(
        `Remove ${member.name} from ${selectedWorkspace?.name}?`,
      )
    ) {
      return;
    }

    setBusyMemberId(member.id);
    setActionError("");
    setActionMessage("");

    try {
      await removeWorkspaceMember(selectedWorkspaceId, member.id);
      setMembers((currentMembers) =>
        currentMembers.filter((currentMember) => currentMember.id !== member.id),
      );
      setActionMessage(`${member.name} was removed from the workspace.`);
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to remove workspace member."));
    } finally {
      setBusyMemberId(null);
    }
  }

  const refreshMembers = () => {
    setMembersLoading(true);
    setReloadMembers((count) => count + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Collaboration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">
            Team members
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            See who belongs to your workspaces and manage member roles.
          </p>
        </div>
        <label className="w-full sm:w-72">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Workspace
          </span>
          <select
            className="w-full rounded-lg border border-app-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
            disabled={workspaceLoading || workspaces.length === 0}
            onChange={(event) => setSelectedWorkspaceId(event.target.value)}
            value={selectedWorkspaceId}
          >
            {workspaces.length === 0 && (
              <option value="">No workspaces available</option>
            )}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      {workspaceError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <span>{workspaceError}</span>
          <button
            className="font-semibold underline"
            onClick={() => {
              setWorkspaceLoading(true);
              setReloadWorkspaces((count) => count + 1);
            }}
            type="button"
          >
            Retry
          </button>
        </div>
      )}

      {!workspaceLoading && !workspaceError && workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-app-border bg-surface px-6 py-12 text-center">
          <Users className="mx-auto text-text-secondary" size={32} />
          <h2 className="mt-3 font-semibold text-text-primary">
            No workspaces yet
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Join or create a workspace to see its members.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-app-border bg-surface p-4 shadow-sm">
              <p className="text-sm text-text-secondary">Workspace members</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {membersLoading ? "—" : members.length}
              </p>
            </article>
            <article className="rounded-xl border border-app-border bg-surface p-4 shadow-sm">
              <p className="text-sm text-text-secondary">Admins and owners</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {membersLoading
                  ? "—"
                  : members.filter((member) =>
                      ["owner", "admin"].includes(member.role),
                    ).length}
              </p>
            </article>
            <article className="rounded-xl border border-app-border bg-surface p-4 shadow-sm">
              <p className="text-sm text-text-secondary">Your access</p>
              <p className="mt-1 font-semibold capitalize text-text-primary">
                {selectedWorkspace?.role ?? "—"}
              </p>
            </article>
          </section>

          <section className="overflow-hidden rounded-xl border border-app-border bg-surface shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-app-border p-4 sm:flex-row sm:items-center sm:px-5">
              <div>
                <h2 className="font-semibold text-text-primary">
                  {selectedWorkspace?.name ?? "Members"}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {canManageMembers
                    ? "Manage roles and workspace access."
                    : "People who have access to this workspace."}
                </p>
              </div>
              <div className="flex gap-2">
                <label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                  <span className="sr-only">Search workspace members</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    size={17}
                  />
                  <input
                    className="w-full rounded-lg border border-app-border bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search members"
                    type="search"
                    value={search}
                  />
                </label>
                <button
                  aria-label="Refresh team members"
                  className="shrink-0 rounded-lg border border-app-border p-2.5 text-text-secondary hover:bg-subtle-hover hover:text-brand disabled:opacity-50"
                  disabled={membersLoading || !selectedWorkspaceId}
                  onClick={refreshMembers}
                  type="button"
                >
                  <RefreshCw
                    className={membersLoading ? "animate-spin" : ""}
                    size={17}
                  />
                </button>
              </div>
            </div>

            {membersError && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                role="alert"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  {membersError}
                </span>
                <button
                  className="font-semibold underline"
                  onClick={refreshMembers}
                  type="button"
                >
                  Retry
                </button>
              </div>
            )}

            {membersLoading ? (
              <div
                aria-label="Loading team members"
                className="space-y-3 p-5"
                role="status"
              >
                {[0, 1, 2].map((item) => (
                  <div
                    className="h-16 animate-pulse rounded-lg bg-subtle-hover"
                    key={item}
                  />
                ))}
              </div>
            ) : !membersError && members.length === 0 ? (
              <div className="p-10 text-center text-sm text-text-secondary">
                No members found in this workspace.
              </div>
            ) : !membersError && filteredMembers.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-text-primary">
                  No matching members
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Try another name, email, or role.
                </p>
              </div>
            ) : !membersError ? (
              <div className="divide-y divide-app-border">
                {filteredMembers.map((member) => {
                  const roleChanged =
                    roleDrafts[member.id] !== undefined &&
                    roleDrafts[member.id] !== member.role;
                  const cannotRemove =
                    member.role === "owner" ||
                    (selectedWorkspace?.role === "admin" &&
                      member.role === "admin");

                  return (
                    <article
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      key={member.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {member.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-text-primary">
                            {member.name}
                          </h3>
                          <p className="truncate text-sm text-text-secondary">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="inline-flex items-center gap-1 rounded-full bg-subtle-hover px-2.5 py-1 text-xs font-medium capitalize text-text-secondary">
                          <Shield size={13} />
                          {member.role}
                        </span>
                        {canManageMembers && member.role !== "owner" && (
                          <>
                            <label className="sr-only" htmlFor={`role-${member.id}`}>
                              Role for {member.name}
                            </label>
                            <select
                              className="rounded-lg border border-app-border bg-surface px-2.5 py-2 text-sm text-text-primary"
                              disabled={busyMemberId === member.id}
                              id={`role-${member.id}`}
                              onChange={(event) =>
                                setRoleDrafts((currentDrafts) => ({
                                  ...currentDrafts,
                                  [member.id]: event.target.value,
                                }))
                              }
                              value={roleDrafts[member.id] ?? member.role}
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                              ))}
                            </select>
                            {roleChanged && (
                              <button
                                className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                                disabled={busyMemberId === member.id}
                                onClick={() => handleSaveRole(member)}
                                type="button"
                              >
                                Save
                              </button>
                            )}
                            {!cannotRemove && (
                              <button
                                aria-label={`Remove ${member.name}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
                                disabled={busyMemberId === member.id}
                                onClick={() => handleRemoveMember(member)}
                                type="button"
                              >
                                <UserMinus size={15} />
                                <span className="sm:hidden">Remove</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </>
      )}

      {(actionError || actionMessage) && (
        <p
          className={`rounded-lg border p-3 text-sm ${
            actionError
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
          role={actionError ? "alert" : "status"}
        >
          {actionError || actionMessage}
        </p>
      )}
    </div>
  );
}
