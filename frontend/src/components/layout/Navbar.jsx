
import { useEffect, useState } from "react";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import useTheme from "../../hooks/useTheme";
import { getCurrentUserAvatar } from "../../api/userApi";

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
  const avatarRevision = useAuthStore((state) => state.avatarRevision);
  const logout = useAuthStore((state) => state.logout);
  const { isDark, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    getCurrentUserAvatar()
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setAvatarUrl(objectUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl("");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarRevision]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const pageTitle = pageTitles[location.pathname] ?? "TaskFlow";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-app-border bg-surface px-4 sm:px-6">
      <h1 className="text-lg font-semibold text-text-primary">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          className="rounded-lg p-2 text-text-secondary transition hover:bg-subtle-hover hover:text-text-primary"
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-text-secondary hover:bg-subtle-hover"
        >
          <Bell size={20} />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text-primary">
            {username || "User"}
          </p>
          <p className="text-xs text-text-secondary">TaskFlow account</p>
        </div>

        {avatarUrl ? (
          <img
            alt={`${username || "User"} profile`}
            className="size-9 rounded-full border border-app-border object-cover"
            src={avatarUrl}
          />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {(username || "U").charAt(0).toUpperCase()}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="rounded-lg p-2 text-text-secondary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
