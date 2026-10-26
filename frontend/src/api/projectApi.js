
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
