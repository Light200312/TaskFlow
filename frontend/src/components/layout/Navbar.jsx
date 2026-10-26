
import { Bell, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/workspaces": "Workspaces",
  "/projects": "Projects",
  "/tasks": "My Tasks",
  "/members": "Team Members",
  "/settings": "Settings",
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const username = useAuthStore((state) => state.username);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const pageTitle = pageTitles[location.pathname] ?? "TaskFlow";

  return (
    <header className="flex h-16 items-center justify-between border-b  border-slate-600 dark:bg-slate-900  bg-white px-6">
      <h1 className="text-lg font-semibold  dark:text-white text-slate-800">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2  dark:text-white text-slate-500 hover:bg-slate-100"
        >
          <Bell size={20} />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium  dark:text-white text-slate-800">
            {username || "User"}
          </p>
          <p className="text-xs  dark:text-gray-400 text-slate-500">TaskFlow account</p>
        </div>

        <div className="flex size-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
          {(username || "U").charAt(0).toUpperCase()}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="rounded-lg p-2  dark:text-white text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
