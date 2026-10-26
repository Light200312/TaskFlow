import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./layouts/ProtectedRoute";
import GuestRoute from "./layouts/GuestRoute";
import AppLayout from "./layouts/AppLayout";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspaces from "./pages/Workspaces";
import Projects from "./pages/Projects";
import MyTasks from "./pages/MyTasks";
import TeamMembers from "./pages/TeamMembers";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import WorkspaceDetails from "./pages/WorkspaceDetails";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/workspaces/:workspaceId"
              element={<WorkspaceDetails />}
            />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/members" element={<TeamMembers />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
