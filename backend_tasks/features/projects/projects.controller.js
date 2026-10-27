/*

CREATE TABLE projects (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  status       ENUM('planning','active','on_hold','completed') NOT NULL DEFAULT 'planning',
  due_date     DATE NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
*/
import pool from "../../db.js";

const validateProjectDetails = (name, description, status, due_date, partial = false) => {
  const validDate = (date) =>
    date == null ||
    (typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !isNaN(Date.parse(date)) &&
      new Date(date).toISOString().startsWith(date));
  const validName =
    (partial && name === undefined) ||
    (typeof name === "string" &&
      !!name.trim() &&
      name.trim().length <= 150);

  return (
    validName &&
    (!partial ||
      [name, description, status, due_date].some(
        (value) => value !== undefined,
      )) &&
    (description == null || typeof description === "string") &&
    (status === undefined ||
      ["planning", "active", "on_hold", "completed"].includes(status)) &&
    validDate(due_date)
  );
};

// TODO: Create a new project inside a workspace
// POST /workspaces/:workspaceId/projects
export const createProject = async (req, res) => {
  const { workspaceId } = req.params;
  const { name, description, status, due_date } = req.body ?? {};

  // TODO: Validate inputs

  if (!validateProjectDetails(name, description, status, due_date)) {
    return res.status(400).json({ message: "Invalid project details." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO projects
       (workspace_id, name, description, status, due_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Number(workspaceId),
        name.trim(),
        description ?? null,
        status ?? "planning",
        due_date ?? null,
      ],
    );

    const [projects] = await pool.query("SELECT * FROM projects WHERE id = ?", [
      result.insertId,
    ]);

    return res.status(201).json({
      message: "Project created successfully",
      project: projects[0],
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// TODO: Get all projects belonging to a workspace
export const getProjectsByWorkspace = async (req, res) => {
  //get /:workspaceid
  const { workspaceId } = req.params;
  if (!Number.isInteger(Number(workspaceId)) || Number(workspaceId) <= 0) {
    return res.status(400).json({ message: "Invalid workspaceId!" });
  }
  try {
    const [projects] = await pool.query(
      `SELECT id, name, status, description, due_date,
              workspace_id, created_at
       FROM projects
       WHERE workspace_id = ?
       ORDER BY created_at DESC`,
      [Number(workspaceId)],
    );

    return res.status(200).json({
      message: "Projects fetched successfully!",
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
// TODO: Get project details by ID
export const getProjectsByProjectId = async (req, res) => {
  //get /:workspaceid
  const { workspaceId, projectId } = req.params;
  if (
    !Number.isInteger(Number(workspaceId)) ||
    Number(workspaceId) <= 0 ||
    !Number.isInteger(Number(projectId)) ||
    Number(projectId) <= 0
  ) {
    return res
      .status(400)
      .json({ message: "Invalid workspaceId or projectId!" });
  }
  try {
    const [projects] = await pool.query(
      `SELECT id, name, status, description, due_date,
              workspace_id, created_at
       FROM projects
       WHERE workspace_id = ? AND id = ?
       ORDER BY created_at DESC`,
      [Number(workspaceId), Number(projectId)],
    );

    return res.status(200).json({
      message: "Project fetched successfully!",
      project: projects?.[0],
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
// TODO: Update project details
export const updateProject = async (req, res) => {
  const { workspaceId, projectId } = req.params;
  const { name, description, status, due_date } = req.body ?? {};

  // Validate inputs
  if (!validateProjectDetails(name, description, status, due_date, true)) {
    return res.status(400).json({ message: "Invalid project details." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE projects
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           status = COALESCE(?, status),
           due_date = COALESCE(?, due_date)
       WHERE workspace_id = ? AND id = ?`,
      [
        name?.trim() ?? null,
        description ?? null,
        status ?? null,
        due_date ?? null,
        Number(workspaceId),
        Number(projectId),
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    const [updatedProjects] = await pool.query(
      "SELECT * FROM projects WHERE id = ?",
      [Number(projectId)],
    );

    return res.status(200).json({
      message: "Project updated successfully.",
      project: updatedProjects[0],
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
// TODO: Delete a project
// TODO: Delete a project
// DELETE /workspaces/:workspaceId/projects/:projectId
export const deleteProject = async (req, res) => {
  const { workspaceId, projectId } = req.params;

  if (
    !Number.isInteger(Number(workspaceId)) ||
    Number(workspaceId) <= 0 ||
    !Number.isInteger(Number(projectId)) ||
    Number(projectId) <= 0
  ) {
    return res.status(400).json({ message: "Invalid workspace or project ID!" });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM projects WHERE id = ? AND workspace_id = ?",
      [Number(projectId), Number(workspaceId)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Project not found in this workspace.",
      });
    }

    return res.status(200).json({
      message: `Project with ID ${projectId} deleted successfully!`,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
// TODO: Archive a project
// PATCH /workspaces/:workspaceId/projects/:projectId/archive
export const archiveProject = async (req, res) => {
  const { workspaceId, projectId } = req.params;

  if (
    !Number.isInteger(Number(workspaceId)) ||
    Number(workspaceId) <= 0 ||
    !Number.isInteger(Number(projectId)) ||
    Number(projectId) <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace or project ID.",
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE projects
       SET status = 'archived'
       WHERE workspace_id = ? AND id = ? AND status != 'archived'`,
      [Number(workspaceId), Number(projectId)]
    );

    if (result.affectedRows === 0) {
      const [projects] = await pool.query(
        "SELECT id, status FROM projects WHERE workspace_id = ? AND id = ?",
        [Number(workspaceId), Number(projectId)]
      );

      if (projects.length === 0) {
        return res.status(404).json({
          message: "Project not found in this workspace.",
        });
      }

      return res.status(400).json({
        message: "Project is already archived.",
      });
    }

    return res.status(200).json({
      message: "Project archived successfully.",
    });
  } catch (error) {
    console.error("Error archiving project:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
// TODO: Restore an archived project
// PATCH /workspaces/:workspaceId/projects/:projectId/restore
export const restoreProject = async (req, res) => {
  const { workspaceId, projectId } = req.params;

  if (
    !Number.isInteger(Number(workspaceId)) ||
    Number(workspaceId) <= 0 ||
    !Number.isInteger(Number(projectId)) ||
    Number(projectId) <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace or project ID.",
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE projects
       SET status = 'planning'
       WHERE workspace_id = ? AND id = ? AND status = 'archived'`,
      [Number(workspaceId), Number(projectId)]
    );

    if (result.affectedRows === 0) {
      const [projects] = await pool.query(
        "SELECT id, status FROM projects WHERE workspace_id = ? AND id = ?",
        [Number(workspaceId), Number(projectId)]
      );

      if (projects.length === 0) {
        return res.status(404).json({
          message: "Project not found in this workspace.",
        });
      }

      return res.status(400).json({
        message: "Project is not archived.",
      });
    }

    return res.status(200).json({
      message: "Project restored successfully.",
      status: "planning",
    });
  } catch (error) {
    console.error("Error restoring project:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};