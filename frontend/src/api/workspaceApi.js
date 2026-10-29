//workspaceApi.js
import api from "./axios";

export const getWorkspaces = async () => {
  const { data } = await api.get("/workspaces");
  return data;
};

export const createWorkspace = async (workspaceData) => {
  const { data } = await api.post("/workspaces", workspaceData);
  return data;
};

export const getWorkspaceById = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}`);
  return data;
};
export const getWorkspaceMembers = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/members/${workspaceId}`);
  return data;
};

export const updateWorkspaceMemberRole = async (
  workspaceId,
  userId,
  role,
) => {
  const { data } = await api.put(
    `/workspaces/members/${workspaceId}/${userId}/role`,
    { role },
  );
  return data;
};

export const removeWorkspaceMember = async (workspaceId, userId) => {
  const { data } = await api.delete(
    `/workspaces/members/${workspaceId}/${userId}`,
  );
  return data;
};