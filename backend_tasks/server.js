import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import taskRoutes from './routes/tasks.js';
import userRoutes from './features/users/users.routes.js'
import {authGuard} from './midlewares/authGuard.js';
import inviteRoutes from './features/workspaceInvite/memberInvite.route.js'
import workspaceRoutes from './features/workspaces/workspaces.routes.js'
import workspaceMemberRoutes from './features/workspaceMembers/workspaceMembers.routes.js'
import projectRoutes from './features/projects/projects.routes.js'
import taskRoutes from './features/tasks/tasks.routes.js'
import dashboardRoutes from './features/dashboard/dashboard.routes.js'
dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());


// app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.get('/', (req, res) => {
  res.send('Hello World!');
});
//protected route example
app.use(authGuard);
app.get('/api/protected', authGuard, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
app.use('/api/workspaces', workspaceRoutes);
// app.use('/api/workspaces', workspaceInvitationRouter);
app.use('/api/invitations', inviteRoutes);
app.use('/api/workspaces/members', workspaceMemberRoutes);
app.use("/api",projectRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});