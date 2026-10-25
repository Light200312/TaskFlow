/*
CREATE TABLE workspace_members (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  role         ENUM('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
  joined_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_workspace_user (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
);
*/

import pool from "../../db.js";
// workspaceMember.controller.js
// TODO: Get workspace members
export const getWorkspaceMembers = async (req, res) => {
  const { workspaceId } = req.params;
  // Fetch members from the database based on workspaceId
  try {
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, wm.role FROM workspace_members wm JOIN users u ON wm.user_id = u.id WHERE wm.workspace_id = ?`,
      [workspaceId],
    );
    res.json(members);
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// TODO: Update member role

export const updateMemberRole = async (req, res) => {
  const { workspaceId, userId } = req.params;
  const { role } = req.body;

  const allowedTargetRoles = ["admin", "member", "viewer"];

  if (!allowedTargetRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role.",
    });
  }

  try {
    if(role==="admin" && req.user.role === "admin") {
      return res.status(403).json({
        message: "Admins cannot promote other members to admin.",
      });
    }
    const [result] = await pool.query(
      `UPDATE workspace_members
       SET role = ?
       WHERE workspace_id = ? AND user_id = ?`,
      [role, workspaceId, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Member not found.",
      });
    }

    return res.json({
      message: "Member role updated successfully.",
    });
  } catch (error) {
    console.error("Error updating member role:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// TODO: Remove member from workspace

export const removeMember = async (req, res) => {
  const { workspaceId, userId } = req.params;
  const requesterId = req.user.userId;

  try {
    // Find the target member's role in this workspace
    const [targetMembers] = await pool.execute(
      `SELECT role
       FROM workspace_members
       WHERE user_id = ? AND workspace_id = ?`,
      [userId, workspaceId]
    );

    if (targetMembers.length === 0) {
      return res.status(404).json({
        message: "Member not found in this workspace.",
      });
    }

    const targetRole = targetMembers[0].role;

    // Never remove the workspace owner through this endpoint
    if (targetRole === "owner") {
      return res.status(403).json({
        message: "Cannot remove the owner of the workspace.",
      });
    }

    // Fetch the requester's role in this specific workspace
    const [requesters] = await pool.execute(
      `SELECT role
       FROM workspace_members
       WHERE user_id = ? AND workspace_id = ?`,
      [requesterId, workspaceId]
    );

    if (requesters.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this workspace.",
      });
    }

    const requesterRole = requesters[0].role;

    // Admins cannot remove other admins
    if (
      requesterRole === "admin" &&
      targetRole === "admin"
    ) {
      return res.status(403).json({
        message: "Admins cannot remove other admins.",
      });
    }

    // Delete only the target membership in this workspace
    const [result] = await pool.execute(
      `DELETE FROM workspace_members
       WHERE user_id = ?
         AND workspace_id = ?
         AND role != 'owner'`,
      [userId, workspaceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Member not found.",
      });
    }

    return res.json({
      message: "Member removed successfully.",
    });
  } catch (err) {
    console.error("Error removing member:", err);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// TODO: Leave workspace

export const leaveWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;

  try {
    const [memberships] = await pool.execute(
      `SELECT role
       FROM workspace_members
       WHERE user_id = ? AND workspace_id = ?`,
      [userId, workspaceId]
    );

    if (memberships.length === 0) {
      return res.status(404).json({
        message: "You are not a member of this workspace.",
      });
    }

    if (memberships[0].role === "owner") {
      return res.status(403).json({
        message:
          "Owners cannot leave their own workspace. Transfer ownership or delete the workspace.",
      });
    }

    const [result] = await pool.execute(
      `DELETE FROM workspace_members
       WHERE user_id = ? AND workspace_id = ?`,
      [userId, workspaceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Membership no longer exists.",
      });
    }

    return res.status(200).json({
      message: "You have successfully left the workspace.",
    });
  } catch (err) {
    console.error("Error leaving workspace:", err);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

