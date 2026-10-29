
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function AppLayout() {
  return (
    <div className="flex h-dvh overflow-hidden bg-app-background text-text-primary">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
