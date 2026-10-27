
import api from "./axios";

export const getProjectsByWorkspace = async (workspaceId) => {
  const { data } = await api.get(
    `/workspaces/${workspaceId}/projects`
  );
  return data;
};

export const createProject = async (workspaceId, projectData) => {
  const { data } = await api.post(
    `/workspaces/${workspaceId}/projects`,
    projectData
  );
  return data;
};

export const getProjectById = async (workspaceId, projectId) => {
  const { data } = await api.get(
    `/workspaces/${workspaceId}/projects/${projectId}`
  );
  return data;
};

export const updateProject = async (
  workspaceId,
  projectId,
  projectData
) => {
  const { data } = await api.put(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    projectData
  );
  return data;
};

export const deleteProject = async (workspaceId, projectId) => {
  const { data } = await api.delete(
    `/workspaces/${workspaceId}/projects/${projectId}`
  );
  return data;
};

export const archiveProject = async (workspaceId, projectId) => {
  const { data } = await api.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/archive`
  );
  return data;
};

export const restoreProject = async (workspaceId, projectId) => {
  const { data } = await api.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/restore`
  );
  return data;
};
