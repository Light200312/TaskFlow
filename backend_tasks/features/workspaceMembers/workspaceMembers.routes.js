//workspaceMembers.routes.js
import express from "express";
import { requireWorkspaceRole } from "../../midlewares/authGuard.js";
import {
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,leaveWorkspace
} from "./workspaceMembers.controller.js";
const router = express.Router({ mergeParams: true });

// Get all members of a workspace
router.get(
  "/:workspaceId",
  requireWorkspaceRole("admin", "member", "viewer","owner"),
  getWorkspaceMembers
);

// Update a member's role in a workspace
router.put(
  "/:workspaceId/:userId/role",
  requireWorkspaceRole("admin", "owner"),
  updateMemberRole
);

router.delete(
  "/:workspaceId/leave",
  leaveWorkspace
);

// Remove a member from a workspace
router.delete(
  "/:workspaceId/:userId",
  requireWorkspaceRole("admin", "owner"),
  removeMember
);
export default router;