import express from "express";
import {
  createProject,
  getProjectsByWorkspace,getProjectsByProjectId,updateProject,deleteProject,archiveProject,restoreProject
} from "./projects.controller.js";
import { requireWorkspaceRole } from "../../midlewares/authGuard.js";
const router = express.Router();
router.get("/workspaces/:workspaceId/projects",  requireWorkspaceRole("viewer", "member", "admin", "owner"),getProjectsByWorkspace);
router.get("/workspaces/:workspaceId/projects/:projectId", requireWorkspaceRole("viewer", "member", "admin", "owner"), getProjectsByProjectId);
router.post("/workspaces/:workspaceId/projects", requireWorkspaceRole("admin","owner"), createProject);
router.put("/workspaces/:workspaceId/projects/:projectId", requireWorkspaceRole("admin","owner"), updateProject);
router.delete("/workspaces/:workspaceId/projects/:projectId",requireWorkspaceRole("admin","owner"), deleteProject);
router.patch(
  "/workspaces/:workspaceId/projects/:projectId/archive",
  requireWorkspaceRole("admin", "owner"),
  archiveProject
);

router.patch(
  "/workspaces/:workspaceId/projects/:projectId/restore",
  requireWorkspaceRole("admin", "owner"),
  restoreProject
);
export default router;
