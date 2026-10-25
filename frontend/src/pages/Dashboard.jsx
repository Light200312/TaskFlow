
import { useAuthStore } from "../stores/authStore";

export default function Dashboard() {
  const username = useAuthStore((state) => state.username);
  const logout = useAuthStore((state) => state.logout);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              TaskFlow
            </h1>
            <p className="mt-1 text-slate-500">
              Welcome back, {username}!
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg bg-red-50 px-4 py-2 font-medium text-red-600 hover:bg-red-100"
          >
            Logout
          </button>
        </header>

        <section className="mt-6 rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">
            Your dashboard
          </h2>
          <p className="mt-2 text-slate-500">
            Your workspaces, projects, and tasks will appear here.
          </p>
        </section>
      </div>
    </main>
  );
}
