import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from "../db.js";
dotenv.config();

export const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request object
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireWorkspaceRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).json({
          message: "Workspace ID is required.",
        });
      }

      const [members] = await pool.query(
        `SELECT role
         FROM workspace_members
         WHERE workspace_id = ? AND user_id = ?`,
        [workspaceId, userId]
      );

      if (members.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this workspace.",
        });
      }

      const requesterRole = members[0].role;

      if (!allowedRoles.includes(requesterRole)) {
        return res.status(403).json({
          message: "You do not have permission to perform this action.",
        });
      }

      // Make the role available to the controller if needed.
      req.user.role = requesterRole;

      return next();
    } catch (error) {
      console.error("Workspace authorization error:", error);

      return res.status(500).json({
        message: "Internal server error.",
      });
    }
  };
};