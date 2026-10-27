
import { NavLink } from "react-router-dom";
import {
  CheckCheck,
  LayoutDashboard,
  BriefcaseBusiness,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Workspaces", path: "/workspaces", icon: BriefcaseBusiness },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "My Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Team Members", path: "/members", icon: Users },
  { name: "Pending Invitations", path: "/invitations", icon: Users },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-700 px-5">
        <div className="rounded-lg bg-blue-600 p-2">
          <CheckCheck size={22} />
        </div>
        <span className="text-xl font-bold">TaskFlow</span>
      </div>

      <div className="px-4 pt-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-700 p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <Settings size={19} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
