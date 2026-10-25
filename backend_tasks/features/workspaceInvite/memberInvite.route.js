import express from "express";
import {
  acceptInvitation,
  createInvitation,
  declineInvitation,
  getPendingInvitations,
  getWorkspaceInvitations,
  revokeInvitation,
} from "./memberInvite.controller.js";

const router = express.Router();

router.post("/:workspaceId", createInvitation);

router.get("/pending", getPendingInvitations);
router.patch("/:invitationId/accept", acceptInvitation);
router.patch("/:invitationId/decline", declineInvitation);

router.get("/:workspaceId", getWorkspaceInvitations);
router.delete("/:workspaceId/invitations/:invitationId", revokeInvitation);

export default router;
