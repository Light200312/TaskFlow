
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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-app-border bg-surface text-text-primary">
      <div className="flex h-16 items-center gap-3 border-b border-app-border px-5">
        <div className="rounded-lg bg-indigo-600 p-2 text-white">
          <CheckCheck size={22} />
        </div>
        <span className="text-xl font-bold">TaskFlow</span>
      </div>

      <div className="px-4 pt-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
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
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "text-text-secondary hover:bg-subtle-hover hover:text-text-primary"
                }`
              }
            >
              <Icon size={19} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-app-border p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-text-secondary hover:bg-subtle-hover hover:text-text-primary"
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
