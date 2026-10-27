
import api from "./axios";

// Invite a user to a workspace
export const createInvitation = async (workspaceId, userId, role = "member") => {
  const { data } = await api.post(`/invitations/${workspaceId}`, {
    userId: Number(userId),
    role,
  });
  return data;
};

// Get invitations sent for a workspace
export const getWorkspaceInvitations = async (workspaceId) => {
  const { data } = await api.get(`/invitations/${workspaceId}`);
  return data;
};

// Get invitations received by the logged-in user
export const getPendingInvitations = async () => {
  const { data } = await api.get("/invitations/pending");
  return data;
};

// Accept an invitation
export const acceptInvitation = async (invitationId) => {
  const { data } = await api.patch(
    `/invitations/${invitationId}/accept`
  );
  return data;
};

// Decline an invitation
export const declineInvitation = async (invitationId) => {
  const { data } = await api.patch(
    `/invitations/${invitationId}/decline`
  );
  return data;
};

// Revoke an invitation sent by an owner/admin
export const revokeInvitation = async (workspaceId, invitationId) => {
  const { data } = await api.delete(
    `/invitations/${workspaceId}/invitations/${invitationId}`
  );
  return data;
};
