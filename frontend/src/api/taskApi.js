
import api from "./axios";

// Fetch all tasks belonging to a project
export const getTasksByProject = async (workspaceId, projectId) => {
  const { data } = await api.get(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}`
  );
  return data;
};

// Create a task
export const createTask = async (workspaceId, projectId, taskData) => {
  const { data } = await api.post(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}`,
    taskData
  );
  return data;
};

// Update task details
export const updateTask = async (
  workspaceId,
  projectId,
  taskId,
  taskData
) => {
  const { data } = await api.put(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    taskData
  );
  return data;
};

// Delete a task
export const deleteTask = async (workspaceId, projectId, taskId) => {
  const { data } = await api.delete(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
  );
  return data;
};

// Assign or unassign a task
export const assignTask = async (
  workspaceId,
  projectId,
  taskId,
  assigneeId
) => {
  const { data } = await api.patch(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/assignee`,
    { assignee_id: assigneeId }
  );
  return data;
};

// Filter tasks
export const filterTasks = async (workspaceId, projectId, filters) => {
  const { data } = await api.get(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}/tasks/filter`,
    { params: filters }
  );
  return data;
};

// Search tasks
export const searchTasks = async (workspaceId, projectId, query) => {
  const { data } = await api.get(
    `/tasks/workspaces/${workspaceId}/projects/${projectId}/tasks/search`,
    { params: { q: query } }
  );
  return data;
};

// Fetch tasks assigned to the logged-in user
export const getAssignedTasks = async () => {
  const { data } = await api.get("/tasks/assigned");
  return data;
};
