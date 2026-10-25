import express from "express";
import {createWorkspace,getAllWorkspaces,getWorkspaceById,updateWorkspace,deleteWorkspace}from "./workspaces.controller.js";
const router = express.Router();

router.post("/", createWorkspace);
router.get("/", getAllWorkspaces);
router.get("/:workspaceId", getWorkspaceById);
router.put("/:workspaceId", updateWorkspace);
router.delete("/:workspaceId", deleteWorkspace);
export default router;
