import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

function useCrumbs() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, index) => ({
    label: part
      .replace(/-/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .slice(0, 28),
    href: `/${parts.slice(0, index + 1).join("/")}`,
    last: index === parts.length - 1,
  }));
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  breadcrumbs = true,
  gradient = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  breadcrumbs?: boolean;
  gradient?: boolean;
}) {
  const crumbs = useCrumbs();


  return (
    <div className="space-y-3">
      {breadcrumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Dashboard</span>
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb.href} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              {crumb.last ? (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              ) : (
                <span className="truncate text-muted-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1
            className={`display-title text-2xl sm:text-3xl lg:text-[34px] ${
              gradient ? "gradient-text" : ""
            }`}
          >
            {title}
          </h1>

          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
