import pool from "../../db.js";

export const getDashboardSummary = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [taskSummaryRows, activeProjectRows, upcomingTasksRows] =
      await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) AS assigned_tasks,
             COALESCE(SUM(t.status = 'done'), 0) AS completed_tasks,
             COALESCE(
               SUM(
                 t.status <> 'done'
                 AND t.due_date IS NOT NULL
                 AND t.due_date < CURRENT_DATE
               ),
               0
             ) AS overdue_tasks
           FROM tasks AS t
           INNER JOIN projects AS p
             ON p.id = t.project_id
           INNER JOIN workspace_members AS wm
             ON wm.workspace_id = p.workspace_id
            AND wm.user_id = ?
           WHERE t.assignee_id = ?`,
          [userId, userId],
        ),
        pool.query(
          `SELECT COUNT(*) AS active_projects
           FROM projects AS p
           INNER JOIN workspace_members AS wm
             ON wm.workspace_id = p.workspace_id
           WHERE wm.user_id = ?
             AND p.status = 'active'`,
          [userId],
        ),
        pool.query(
          `SELECT
             t.id,
             t.project_id,
             t.title,
             t.description,
             t.status,
             t.priority,
             t.due_date,
             p.name AS project_name,
             p.workspace_id
           FROM tasks AS t
           INNER JOIN projects AS p
             ON p.id = t.project_id
           INNER JOIN workspace_members AS wm
             ON wm.workspace_id = p.workspace_id
            AND wm.user_id = ?
           WHERE t.assignee_id = ?
             AND t.status <> 'done'
             AND t.due_date IS NOT NULL
           ORDER BY
             (t.due_date < CURRENT_DATE) DESC,
             t.due_date ASC,
             t.id DESC
           LIMIT 5`,
          [userId, userId],
        ),
      ]);

    const [taskSummary] = taskSummaryRows[0];
    const [activeProjectSummary] = activeProjectRows[0];

    return res.status(200).json({
      message: "Dashboard summary fetched successfully.",
      stats: {
        assignedTasks: Number(taskSummary.assigned_tasks),
        completedTasks: Number(taskSummary.completed_tasks),
        overdueTasks: Number(taskSummary.overdue_tasks),
        activeProjects: Number(activeProjectSummary.active_projects),
      },
      upcomingTasks: upcomingTasksRows[0],
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);

    return res.status(500).json({
      message: "Unable to load dashboard summary.",
    });
  }
};
