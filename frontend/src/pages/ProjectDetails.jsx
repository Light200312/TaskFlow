import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ListTodo,
  RefreshCw,
  Plus,
} from "lucide-react";
import { getWorkspaceMembers } from "../api/workspaceApi";
import { getProjectById } from "../api/projectApi";
import {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  filterTasks,
  searchTasks,
  assignTask,
} from "../api/taskApi";
import TaskCard from "../features/tasks/TaskCard";
import TaskForm from "../features/tasks/TaskForm";

export default function ProjectDetails() {
  const { workspaceId, projectId } = useParams();
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [taskActionError, setTaskActionError] = useState("");
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [members, setMembers] = useState([]);
  const [assigningTaskId, setAssigningTaskId] = useState(null);
  const [assignmentError, setAssignmentError] = useState("");
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [filtering, setFiltering] = useState(false);

  const handleAssignTask = async (taskId, assigneeValue) => {
    setAssigningTaskId(taskId);
    setAssignmentError("");

    const assigneeId = assigneeValue === "" ? null : Number(assigneeValue);

    try {
      await assignTask(workspaceId, projectId, taskId, assigneeId);

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId ? { ...task, assignee_id: assigneeId } : task,
        ),
      );
    } catch (err) {
      setAssignmentError(
        err.response?.data?.message || "Failed to assign task.",
      );
    } finally {
      setAssigningTaskId(null);
    }
  };
  const handleSearchAndFilter = async () => {
    setFiltering(true);
    setTaskActionError("");

    try {
      let result;

      if (searchQuery.trim()) {
        result = await searchTasks(workspaceId, projectId, searchQuery.trim());
      } else if (statusFilter || priorityFilter) {
        const filters = {};

        if (statusFilter) filters.status = statusFilter;
        if (priorityFilter) filters.priority = priorityFilter;

        result = await filterTasks(workspaceId, projectId, filters);
      } else {
        result = await getTasksByProject(workspaceId, projectId);
      }

      setTasks(result.tasks ?? []);
    } catch (err) {
      setTaskActionError(
        err.response?.data?.message || "Failed to search or filter tasks.",
      );
    } finally {
      setFiltering(false);
    }
  };
  const handleEditTask = async (taskData) => {
    setEditError("");

    if (!editingTask || !taskData.title.trim()) {
      setEditError("Task title is required.");
      return;
    }

    setSavingEdit(true);

    try {
      await updateTask(workspaceId, projectId, editingTask.id, taskData);
      await loadData();
      setEditingTask(null);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update task.");
    } finally {
      setSavingEdit(false);
    }
  };
  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteTask(workspaceId, projectId, deletingTask.id);
      setTasks((previous) =>
        previous.filter((task) => task.id !== deletingTask.id),
      );
      setDeletingTask(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };
  const handleCreateTask = async (taskData) => {
    setTaskError("");
    setSavingTask(true);

    try {
      await createTask(workspaceId, projectId, taskData);
      setShowTaskModal(false);
      await loadData();
    } catch (err) {
      setTaskError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [projectData, taskData, memberData] = await Promise.all([
        getProjectById(workspaceId, projectId),
        getTasksByProject(workspaceId, projectId),
        getWorkspaceMembers(workspaceId),
      ]);

      setProject(projectData.project);
      setTasks(taskData.tasks ?? []);
      setMembers(memberData ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load project details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId, projectId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 animate-spin" size={18} />
        Loading project...
      </div>
    );
  }
  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    setTaskActionError("");

    try {
      await updateTask(workspaceId, projectId, taskId, {
        status: newStatus,
      });

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      );
    } catch (err) {
      setTaskActionError(
        err.response?.data?.message || "Failed to update task status.",
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (error || !project) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">
          {error || "Project not found."}
        </p>
        <button
          onClick={loadData}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link
        to={`/workspaces/${workspaceId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to workspace
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Project
            </p>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {project.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              {project.description || "No project description provided."}
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {project.status?.replaceAll("_", " ")}
          </span>
        </div>

        {project.due_date && (
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <CalendarDays size={16} />
            Due: {String(project.due_date).slice(0, 10)}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Tasks
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} in this
              project
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              onClick={() => {
                setTaskError("");
                setShowTaskModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tasks..."
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="review">In review</option>
            <option value="done">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <button
            type="button"
            onClick={handleSearchAndFilter}
            disabled={filtering}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {filtering ? "Applying..." : "Apply"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("");
              setPriorityFilter("");
              getTasksByProject(workspaceId, projectId)
                .then((result) => setTasks(result.tasks ?? []))
                .catch(() => setTaskActionError("Failed to reset task list."));
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            Reset
          </button>
        </div>
        {taskActionError && (
          <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {taskActionError}
          </p>
        )}
        {assignmentError && (
  <p className="mb-3 text-sm text-red-600 dark:text-red-400">
    {assignmentError}
  </p>
)}

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
            <ListTodo className="mx-auto mb-3 text-slate-400" size={32} />
            <h3 className="font-medium text-slate-900 dark:text-white">
              No tasks yet
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tasks you create will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <TaskCard
                assigning={assigningTaskId === task.id}
                key={task.id}
                members={members}
                onAssign={handleAssignTask}
                onDelete={(selectedTask) => {
                  setDeleteError("");
                  setDeletingTask(selectedTask);
                }}
                onEdit={(selectedTask) => {
                  setEditError("");
                  setEditingTask(selectedTask);
                }}
                onStatusChange={handleStatusChange}
                task={task}
                updating={updatingTaskId === task.id}
              />
            ))}
          </div>
        )}
      </section>

      {showTaskModal && (
        <TaskForm
          error={taskError}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
          submitting={savingTask}
        />
      )}

      {editingTask && (
        <TaskForm
          error={editError}
          key={editingTask.id}
          onClose={() => setEditingTask(null)}
          onSubmit={handleEditTask}
          submitting={savingEdit}
          task={editingTask}
        />
      )}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Delete task?
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-900 dark:text-white">
                {deletingTask.title}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingTask(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteTask}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
