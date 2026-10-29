import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

export default function WorkspaceCard({ workspace }) {
  return (
    <Link
      className="group block rounded-xl border border-app-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
      to={`/workspaces/${workspace.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <BriefcaseBusiness size={21} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-text-primary">
              {workspace.name}
            </h3>
            <p className="truncate text-sm text-text-secondary">
              /{workspace.slug}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {workspace.role || "Member"}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-app-border pt-4">
        <p className="text-xs text-text-secondary">Open workspace</p>
        <ArrowUpRight
          aria-hidden="true"
          className="text-text-secondary transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
          size={17}
        />
      </div>
    </Link>
  );
}
