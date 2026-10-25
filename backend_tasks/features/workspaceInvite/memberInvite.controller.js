import pool from "../../db.js";

//memberInvite.controller.js
/*CREATE TABLE workspace_invitations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  workspace_id INT UNSIGNED NOT NULL,
  invited_user_id INT UNSIGNED NOT NULL,
  invited_by INT UNSIGNED NOT NULL,

  role ENUM('admin', 'member', 'viewer')
    NOT NULL DEFAULT 'member',

  status ENUM('pending', 'accepted', 'declined', 'revoked')
    NOT NULL DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,

  UNIQUE KEY uq_workspace_invited_user
    (workspace_id, invited_user_id),

  FOREIGN KEY (workspace_id)
    REFERENCES workspaces(id) ON DELETE CASCADE,

  FOREIGN KEY (invited_user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  FOREIGN KEY (invited_by)
    REFERENCES users(id) ON DELETE RESTRICT
);*/


// 1. Send an invitation
// POST /api/workspaces/:workspaceId/invitations
// Only workspace owners/admins
export const createInvitation = async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, role = "member" } = req.body;
  const invitedBy = req.user.userId;

  const parsedWorkspaceId = Number(workspaceId);
  const parsedUserId = Number(userId);

  if (
    !/^[1-9]\d*$/.test(workspaceId) ||
    !Number.isSafeInteger(parsedWorkspaceId) ||
    !Number.isSafeInteger(parsedUserId) ||
    parsedUserId <= 0 ||
    !["admin", "member", "viewer"].includes(role)
  ) {
    return res.status(400).json({
      message: "Provide valid workspaceId, userId, and invitation role.",
    });
  }

  try {
    const [members] = await pool.query(
      `SELECT role
       FROM workspace_members
       WHERE workspace_id = ? AND user_id = ?`,
      [parsedWorkspaceId, invitedBy],
    );

    if (members.length === 0) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    if (!["owner", "admin"].includes(members[0].role)) {
      return res.status(403).json({
        message: "You are not allowed to invite users to this workspace.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO workspace_invitations
         (workspace_id, invited_user_id, invited_by, role)
       VALUES (?, ?, ?, ?)`,
      [parsedWorkspaceId, parsedUserId, invitedBy, role],
    );

    return res.status(201).json({
      message: "Invitation created successfully.",
      invitation: {
        id: result.insertId,
        workspace_id: parsedWorkspaceId,
        invited_user_id: parsedUserId,
        invited_by: invitedBy,
        role,
        status: "pending",
      },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "An invitation already exists for this user and workspace.",
      });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({ message: "User not found." });
    }

    console.error("Invitation creation error:", err);
    return res.status(500).json({
      message: "Failed to create invitation.",
    });
  }
};

// 2. Get invitations received by the logged-in user
// GET /api/invitations/pending

export const getPendingInvitations = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [rows] = await pool.query(
      `SELECT
         wi.id,
         wi.workspace_id,
         wi.invited_by,
         wi.invited_user_id,
         wi.role,
         wi.status,
         wi.created_at,
         w.name AS workspace_name,
         u.name AS inviter_name
       FROM workspace_invitations AS wi
       JOIN workspaces AS w ON w.id = wi.workspace_id
       JOIN users AS u ON u.id = wi.invited_by
       WHERE wi.invited_user_id = ?
         AND wi.status = 'pending'
       ORDER BY wi.created_at DESC`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message: "No pending invitations.",
        invitations: []
      });
    }

    return res.status(200).json({
      message: "Pending invitations fetched successfully.",
      invitations: rows
    });
  } catch (err) {
    console.error("Error fetching invitations:", err);

    return res.status(500).json({
      message: "Failed to fetch invitations."
    });
  }
};

const parsePositiveId = (value) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

export const acceptInvitation = async (req, res) => {
  const invitationId = parsePositiveId(req.params.invitationId);
  if (invitationId === null) {
    return res.status(400).json({ message: "Provide a valid invitation ID." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [invitations] = await connection.query(
      `SELECT workspace_id, invited_user_id, role, status
       FROM workspace_invitations
       WHERE id = ?
       FOR UPDATE`,
      [invitationId],
    );

    if (invitations.length === 0 || invitations[0].invited_user_id !== req.user.userId) {
      await connection.rollback();
      return res.status(404).json({ message: "Invitation not found." });
    }

    const invitation = invitations[0];
    if (invitation.status !== "pending") {
      await connection.rollback();
      return res.status(409).json({ message: "Invitation is no longer pending." });
    }

    await connection.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES (?, ?, ?)`,
      [invitation.workspace_id, req.user.userId, invitation.role],
    );
    await connection.query(
      `UPDATE workspace_invitations
       SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [invitationId],
    );

    await connection.commit();
    return res.status(200).json({ message: "Invitation accepted successfully." });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You are already a member of this workspace.",
      });
    }

    console.error("Error accepting invitation:", err);
    return res.status(500).json({ message: "Failed to accept invitation." });
  } finally {
    connection.release();
  }
};

export const declineInvitation = async (req, res) => {
  const invitationId = parsePositiveId(req.params.invitationId);
  if (invitationId === null) {
    return res.status(400).json({ message: "Provide a valid invitation ID." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE workspace_invitations
       SET status = 'declined', responded_at = CURRENT_TIMESTAMP
       WHERE id = ? AND invited_user_id = ? AND status = 'pending'`,
      [invitationId, req.user.userId],
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        `SELECT status
         FROM workspace_invitations
         WHERE id = ? AND invited_user_id = ?`,
        [invitationId, req.user.userId],
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Invitation not found." });
      }
      return res.status(409).json({ message: "Invitation is no longer pending." });
    }

    return res.status(200).json({ message: "Invitation declined successfully." });
  } catch (err) {
    console.error("Error declining invitation:", err);
    return res.status(500).json({ message: "Failed to decline invitation." });
  }
};

export const revokeInvitation = async (req, res) => {
  const workspaceId = parsePositiveId(req.params.workspaceId);
  const invitationId = parsePositiveId(req.params.invitationId);
  if (workspaceId === null || invitationId === null) {
    return res.status(400).json({
      message: "Provide valid workspace and invitation IDs.",
    });
  }

  try {
    const [members] = await pool.query(
      `SELECT role
       FROM workspace_members
       WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.userId],
    );
    if (members.length === 0) {
      return res.status(404).json({ message: "Workspace not found." });
    }
    if (!["owner", "admin"].includes(members[0].role)) {
      return res.status(403).json({
        message: "You are not allowed to revoke invitations for this workspace.",
      });
    }

    const [result] = await pool.query(
      `UPDATE workspace_invitations
       SET status = 'revoked', responded_at = CURRENT_TIMESTAMP
       WHERE id = ? AND workspace_id = ? AND status = 'pending'`,
      [invitationId, workspaceId],
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        `SELECT status
         FROM workspace_invitations
         WHERE id = ? AND workspace_id = ?`,
        [invitationId, workspaceId],
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: "Invitation not found." });
      }
      return res.status(409).json({ message: "Invitation is no longer pending." });
    }

    return res.status(200).json({ message: "Invitation revoked successfully." });
  } catch (err) {
    console.error("Error revoking invitation:", err);
    return res.status(500).json({ message: "Failed to revoke invitation." });
  }
};

export const getWorkspaceInvitations = async (req, res) => {
  const workspaceId = parsePositiveId(req.params.workspaceId);
  if (workspaceId === null) {
    return res.status(400).json({ message: "Provide a valid workspace ID." });
  }

  try {
    const [members] = await pool.query(
      `SELECT role
       FROM workspace_members
       WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.userId],
    );
    if (members.length === 0) {
      return res.status(404).json({ message: "Workspace not found." });
    }
    if (!["owner", "admin"].includes(members[0].role)) {
      return res.status(403).json({
        message: "You are not allowed to view invitations for this workspace.",
      });
    }

    const [invitations] = await pool.query(
      `SELECT wi.id, wi.workspace_id, wi.invited_user_id, wi.invited_by,
              wi.role, wi.status, wi.created_at, wi.responded_at,
              u.name AS invited_user_name, u.email AS invited_user_email
       FROM workspace_invitations AS wi
       JOIN users AS u ON u.id = wi.invited_user_id
       WHERE wi.workspace_id = ?
       ORDER BY wi.created_at DESC`,
      [workspaceId],
    );
    return res.status(200).json({ invitations });
  } catch (err) {
    console.error("Error fetching workspace invitations:", err);
    return res.status(500).json({ message: "Failed to fetch invitations." });
  }
};