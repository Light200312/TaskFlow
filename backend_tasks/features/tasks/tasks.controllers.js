import pool from "../../db.js";
/*
CREATE TABLE tasks (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id  INT UNSIGNED NOT NULL,
  assignee_id INT UNSIGNED NULL,
  created_by  INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      ENUM('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
  priority    ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  due_date    DATE NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE RESTRICT,
  INDEX idx_tasks_project_status (project_id, status),
  INDEX idx_tasks_assignee (assignee_id)
);
*/

const VALID_STATUSES = ["todo", "in_progress", "review", "done"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];


export const validateTaskDetails = (
  { title, description, status, priority, due_date },
  { partial = false } = {}
) => {
  const errors = {};

  // Title: required for creation, validated if supplied during update
  if (!partial || title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      errors.title = "Title is required.";
    } else if (title.trim().length > 200) {
      errors.title = "Title cannot exceed 200 characters.";
    }
  }

  // Description: optional; must be a string or null
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    errors.description = "Description must be a string or null.";
  }

  // Status
  if (
    status !== undefined &&
    !VALID_STATUSES.includes(status)
  ) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(", ")}.`;
  }

  // Priority
  if (
    priority !== undefined &&
    !VALID_PRIORITIES.includes(priority)
  ) {
    errors.priority = `Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`;
  }

  // Due date: valid YYYY-MM-DD, null, or empty string to clear
  if (due_date !== undefined && due_date !== null && due_date !== "") {
    if (
      typeof due_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(due_date)
    ) {
      errors.due_date = "Due date must use YYYY-MM-DD format.";
    } else {
      const date = new Date(`${due_date}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== due_date
      ) {
        errors.due_date = "Due date is not a valid calendar date.";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};


// TODO: Create a new task inside a project
// post :wsId/project/projectid/taskId

// POST /workspaces/:workspaceId/projects/:projectId/tasks
export const createTask = async (req, res) => {
  const { workspaceId, projectId } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  const userId = req.user.userId;

  // 1. Validate route IDs
  const wsId = Number(workspaceId);
  const projId = Number(projectId);

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID.",
    });
  }

  // 2. Validate task details
  const validation = validateTaskDetails({
    title,
    description,
    status,
    priority,
    due_date,
  });

  if (!validation.isValid) {
    return res.status(400).json({
      message: "Invalid task details.",
      errors: validation.errors,
    });
  }

  try {
    // 3. Verify project, workspace and membership
    const [rows] = await pool.query(
      `SELECT p.id, wm.role
       FROM projects p
       JOIN workspace_members wm
         ON wm.workspace_id = p.workspace_id
       WHERE p.id = ?
         AND p.workspace_id = ?
         AND wm.user_id = ?
       LIMIT 1`,
      [projId, wsId, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project not found in this workspace or access denied.",
      });
    }

    // 5. Insert task
    const [result] = await pool.query(
      `INSERT INTO tasks
       (project_id, created_by, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projId,
        userId,
        title.trim(),
        description?.trim() || null,
        status ?? "todo",
        priority ?? "medium",
        due_date || null,
      ],
    );

    // 6. Return created task
    const [newTaskRows] = await pool.query(`SELECT * FROM tasks WHERE id = ?`, [
      result.insertId,
    ]);

    return res.status(201).json({
      message: "Task created successfully.",
      task: newTaskRows[0],
    });
  } catch (error) {
    console.error("Error creating task:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// TODO: Get all tasks belonging to a project
export const getAllTasks = async (req, res) => {
  const { workspaceId, projectId } = req.params;
  // 1. Validate route IDs
  const wsId = Number(workspaceId);
  const projId = Number(projectId);

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID.",
    });
  }
  try {
    const [rows] = await pool.query(
      `SELECT t.*
   FROM tasks t
   JOIN projects p ON t.project_id = p.id
   WHERE p.id = ?
     AND p.workspace_id = ?`,
      [projId, wsId],
    );
    // if (rows.length === 0) {
    //   return res.status(404).json({ message: "Project has no tasks!" });
    // }
    return res
      .status(200)
      .json({ message: "All tasks fetched successfully!", tasks: rows });
  } catch (error) {
    console.error("Error creating task:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
// TODO: Get task details by ID
export const getTaskById = async (req, res) => {
  const { workspaceId, projectId, taskId } = req.params;
  // 1. Validate route IDs
  const wsId = Number(workspaceId);
  const projId = Number(projectId);
  const tId = Number(taskId);

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(tId) ||
    tId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID or task ID.",
    });
  }
  try {
    const [rows] = await pool.query(
      `SELECT t.*
   FROM tasks t
   JOIN projects p ON t.project_id = p.id
   WHERE p.id = ?
     AND p.workspace_id = ?
     AND t.id = ?`,
      [projId, wsId, tId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Task not found!" });
    }
    return res
      .status(200)
      .json({ message: "Task fetched successfully!", task: rows[0] });
  } catch (error) {
    console.error("Error fetching task:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
// TODO: Update task details
export const updateTask = async (req, res) => {
  const { workspaceId, projectId, taskId } = req.params;
 

  // 1. Validate route IDs
  const wsId = Number(workspaceId);
  const projId = Number(projectId);
  const tId = Number(taskId);

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0 ||
    !Number.isSafeInteger(tId) ||
    tId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID or task ID.",
    });
  }

//todo make validation for update task details
if (Object.keys(req.body).length === 0) {
  return res.status(400).json({
    message: "Provide at least one field to update.",
  });
}
const validation = validateTaskDetails(req.body, {
  partial: true,
});

if (!validation.isValid) {
  return res.status(400).json({
    message: "Invalid task details.",
    errors: validation.errors,
  });
}
  try {
    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "due_date",
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(
          field === "title" && typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field],
        );
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Provide at least one field to update.",
      });
    }

    values.push(tId, projId);

    const [result] = await pool.query(
      `UPDATE tasks
   SET ${updates.join(", ")}
   WHERE id = ? AND project_id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }
    return res.status(200).json({
      message: "Task updated successfully.",
    });
  } catch (error) {
    console.error("Error Updating task:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const deleteTask = async (req, res) => {
  const { workspaceId, projectId, taskId } = req.params;
  const wsId = Number(workspaceId);
  const projId = Number(projectId);
  const tId = Number(taskId);

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0 ||
    !Number.isSafeInteger(tId) ||
    tId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID or task ID.",
    });
  }

  try {
    const [result] = await pool.query(
      `DELETE t
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.id = ? AND p.workspace_id = ? AND t.id = ?`,
      [projId, wsId, tId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting task:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const assignTask = async (req, res) => {
  const { workspaceId, projectId, taskId } = req.params;
  const wsId = Number(workspaceId);
  const projId = Number(projectId);
  const tId = Number(taskId);
  if (!Object.hasOwn(req.body, "assignee_id")) {
  return res.status(400).json({
    message: "assignee_id is required and must be a positive integer or null.",
  });
}


const assigneeId =
  req.body.assignee_id === null ? null : Number(req.body.assignee_id);
  if (
  assigneeId !== null &&
  (!Number.isSafeInteger(assigneeId) || assigneeId <= 0)
) {
  return res.status(400).json({
    message: "assignee_id must be a positive integer or null.",
  });
}
  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0 ||
    !Number.isSafeInteger(tId) ||
    tId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID or task ID.",
    });
  }

 

  try {
    const [tasks] = await pool.query(
      `SELECT t.id
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = ? AND p.id = ? AND p.workspace_id = ?
       LIMIT 1`,
      [tId, projId, wsId],
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    if (assigneeId !== null) {
      const [members] = await pool.query(
        `SELECT 1
         FROM workspace_members
         WHERE workspace_id = ? AND user_id = ?
         LIMIT 1`,
        [wsId, assigneeId],
      );

      if (members.length === 0) {
        return res.status(400).json({
          message: "Assignee must be a member of this workspace.",
        });
      }
    }

    await pool.query(
      `UPDATE tasks SET assignee_id = ? WHERE id = ? AND project_id = ?`,
      [assigneeId, tId, projId],
    );

    const [updatedTasks] = await pool.query(
      `SELECT * FROM tasks WHERE id = ?`,
      [tId],
    );

    return res.status(200).json({
      message: assigneeId === null ? "Task unassigned successfully." : "Task assigned successfully.",
      task: updatedTasks[0],
    });
  } catch (error) {
    console.error("Error assigning task:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// TODO: Update task status
// TODO: Update task priority
// TODO: Set or update task due date
// TODO: Get tasks assigned to the logged-in user

export const getAssignedTasks = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [tasks] = await pool.query(
      `SELECT
        t.*,
        p.name AS project_name,
        p.status AS project_status,
        p.due_date AS project_due_date,
        p.workspace_id
      FROM tasks AS t
      INNER JOIN projects AS p
        ON p.id = t.project_id
      WHERE t.assignee_id = ?
      ORDER BY t.id DESC`,
      [userId],
    );

    return res.status(200).json({
      message: "Assigned tasks fetched successfully.",
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

//Filter tasks by status, priority, and assignee
export const filterTasks = async (req, res) => {
  const { workspaceId, projectId } = req.params;
  const wsId = Number(workspaceId);
  const projId = Number(projectId);
  const { status, priority, assignee_id: assigneeId } = req.query;

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID.",
    });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${VALID_STATUSES.join(", ")}.`,
    });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      message: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}.`,
    });
  }

  let assigneeValue;
  if (assigneeId !== undefined && assigneeId !== "unassigned") {
    assigneeValue = Number(assigneeId);
    if (!Number.isSafeInteger(assigneeValue) || assigneeValue <= 0) {
      return res.status(400).json({
        message: "assignee_id must be a positive integer or 'unassigned'.",
      });
    }
  }

  const conditions = ["p.id = ?", "p.workspace_id = ?"];
  const values = [projId, wsId];

  if (status !== undefined) {
    conditions.push("t.status = ?");
    values.push(status);
  }
  if (priority !== undefined) {
    conditions.push("t.priority = ?");
    values.push(priority);
  }
  if (assigneeId === "unassigned") {
    conditions.push("t.assignee_id IS NULL");
  } else if (assigneeValue !== undefined) {
    conditions.push("t.assignee_id = ?");
    values.push(assigneeValue);
  }

  try {
    const [tasks] = await pool.query(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE ${conditions.join(" AND ")}`,
      values,
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks match these filters." });
    }

    return res.status(200).json({
      message: "Filtered tasks fetched successfully.",
      tasks,
    });
  } catch (error) {
    console.error("Error filtering tasks:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
//Search tasks by title or description
export const searchTasks = async (req, res) => {
  const { workspaceId, projectId } = req.params;
  const wsId = Number(workspaceId);
  const projId = Number(projectId);
  const query = req.query.q;

  if (
    !Number.isSafeInteger(wsId) ||
    wsId <= 0 ||
    !Number.isSafeInteger(projId) ||
    projId <= 0
  ) {
    return res.status(400).json({
      message: "Invalid workspace ID or project ID.",
    });
  }

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      message: "Search query 'q' is required.",
    });
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    const [tasks] = await pool.query(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE p.id = ?
         AND p.workspace_id = ?
         AND (t.title LIKE ? OR t.description LIKE ?)`,
      [projId, wsId, searchTerm, searchTerm],
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No matching tasks found." });
    }

    return res.status(200).json({
      message: "Matching tasks fetched successfully.",
      tasks,
    });
  } catch (error) {
    console.error("Error searching tasks:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
