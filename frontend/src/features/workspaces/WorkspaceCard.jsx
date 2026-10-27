import { Link } from "react-router-dom";

export default function WorkspaceCard({ workspace }) {
  return (
    <Link
      className="block cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
      to={`/workspaces/${workspace.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">
              {workspace.name}
            </h3>
            <p className="truncate text-sm text-slate-500">
              /{workspace.slug}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
          {workspace.role || "Member"}
        </span>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">Workspace ID: {workspace.id}</p>
      </div>
    </Link>
  );
}
