
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Layers3,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FolderKanban },
  { label: "My Tasks", icon: CheckSquare },
  { label: "Members", icon: Users },
];

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Layers3 size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TaskFlow</h1>
            <p className="text-xs text-slate-500">Team workspace</p>
          </div>
        </div>

        <button className="mt-9 flex items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50">
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers3 size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                My Workspace
              </span>
              <span className="text-xs text-slate-500">Free plan</span>
            </span>
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        <p className="mb-3 mt-9 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            <Settings size={19} />
            Settings
          </button>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              U
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Your account</p>
              <p className="text-xs text-slate-500">Workspace member</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div>
            <p className="text-sm text-slate-500">Workspace / Overview</p>
            <h2 className="font-semibold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400 sm:flex">
              <Search size={16} />
              Search tasks...
              <span className="ml-5 rounded border px-1.5 py-0.5 text-xs">
                /
              </span>
            </div>
            <button
              aria-label="Notifications"
              className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5 md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500">Your team's workspace</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Welcome to TaskFlow
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Organize projects and keep your team moving forward.
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
              <Plus size={18} />
              New project
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total projects", "—"],
              ["My open tasks", "—"],
              ["Completed tasks", "—"],
              ["Team members", "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-4 text-3xl font-bold">{value}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Data will appear when connected to the API
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                <CheckSquare size={22} />
              </div>
              <div>
                <h3 className="font-semibold">Your tasks</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tasks assigned to you will appear here.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-slate-200 py-12 text-center">
              <CheckSquare
                size={30}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No tasks to display yet
              </p>
              <p className="mt-1 text-sm text-slate-400">
                We'll connect this section to your backend in a later stage.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
