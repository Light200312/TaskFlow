import express from 'express';
import {createTask,getAllTasks, getTaskById,updateTask,deleteTask,assignTask,getAssignedTasks,filterTasks,searchTasks}from "./tasks.controllers.js";
import {requireWorkspaceRole} from "../../midlewares/authGuard.js";
const router = express.Router();
router.get('/assigned', getAssignedTasks);
router.get('/workspaces/:workspaceId/projects/:projectId/tasks/filter', filterTasks);
router.get('/workspaces/:workspaceId/projects/:projectId/tasks/search', searchTasks);
router.get('/workspaces/:workspaceId/projects/:projectId',getAllTasks)
router.get('/workspaces/:workspaceId/projects/:projectId/tasks/:taskId',getTaskById)
router.post('/workspaces/:workspaceId/projects/:projectId', requireWorkspaceRole('member','owner','admin'), createTask);
router.put('/workspaces/:workspaceId/projects/:projectId/tasks/:taskId', requireWorkspaceRole('member','owner','admin'), updateTask);
router.delete('/workspaces/:workspaceId/projects/:projectId/tasks/:taskId', requireWorkspaceRole('member','owner','admin'), deleteTask);
router.patch('/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/assignee', requireWorkspaceRole('member','owner','admin'), assignTask);

export default router