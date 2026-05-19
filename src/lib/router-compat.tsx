// Compat shim: maps TanStack Router-style APIs onto react-router-dom.
// Lets the existing route files keep their imports untouched.
import * as React from "react";
import {
  Link as RRLink,
  Navigate as RRNavigate,
  Outlet as RROutlet,
  useLocation,
  useNavigate as useRRNavigate,
  useParams as useRRParams,
  type LinkProps as RRLinkProps,
} from "react-router-dom";

export const Outlet = RROutlet;
export const Navigate = RRNavigate;

function resolveHref(to: string, params?: Record<string, string | number>): string {
  if (!params) return to;
  let href = to;
  for (const k of Object.keys(params)) {
    href = href.replace(`$${k}`, encodeURIComponent(String(params[k])));
  }
  return href;
}

type AnyProps = Record<string, any>;

interface CompatLinkProps extends Omit<RRLinkProps, "to"> {
  to: string;
  params?: Record<string, string | number>;
  search?: AnyProps;
  from?: string;
  activeProps?: AnyProps;
  inactiveProps?: AnyProps;
  activeOptions?: { exact?: boolean };
  preload?: any;
  preloadDelay?: any;
}

export function Link(props: CompatLinkProps) {
  const {
    to,
    params,
    search,
    from,
    activeProps,
    inactiveProps,
    activeOptions,
    preload,
    preloadDelay,
    className,
    children,
    ...rest
  } = props;

  const href = resolveHref(to, params);
  const loc = useLocation();
  const isActive = activeOptions?.exact
    ? loc.pathname === href
    : href === "/"
      ? loc.pathname === "/"
      : loc.pathname === href || loc.pathname.startsWith(href + "/");

  const extra = isActive ? activeProps : inactiveProps;
  const mergedClassName = [className, extra?.className].filter(Boolean).join(" ") || undefined;

  return (
    <RRLink to={href} {...rest} {...(extra || {})} className={mergedClassName}>
      {typeof children === "function" ? (children as any)({ isActive }) : children}
    </RRLink>
  );
}

type NavigateArg = string | { to: string; params?: Record<string, string | number>; replace?: boolean; search?: any };

export function useNavigate(_opts?: { from?: string }) {
  const nav = useRRNavigate();
  return React.useCallback(
    (arg: NavigateArg) => {
      if (typeof arg === "string") return nav(arg);
      const href = resolveHref(arg.to, arg.params);
      nav(href, { replace: !!arg.replace });
    },
    [nav],
  );
}

export function useParams<T extends Record<string, string> = Record<string, string>>(_opts?: any): T {
  return useRRParams() as unknown as T;
}

export function useRouterState<T = string>({ select }: { select: (s: { location: { pathname: string; search: string; hash: string } }) => T }): T {
  const loc = useLocation();
  return select({ location: { pathname: loc.pathname, search: loc.search, hash: loc.hash } });
}

export function useRouter() {
  const nav = useRRNavigate();
  return {
    navigate: (arg: NavigateArg) => {
      if (typeof arg === "string") return nav(arg);
      nav(resolveHref(arg.to, arg.params), { replace: !!arg.replace });
    },
    invalidate: () => {},
  };
}

// Route declarations become inert at runtime — App.tsx owns the real routing.
// We still return useParams and a component handle so legacy
// `Route.useParams({ from: "/x/$id" })` calls keep working.
interface RouteHandle {
  useParams: <T extends Record<string, string> = Record<string, string>>() => T;
  component?: React.ComponentType<any>;
  fullPath: string;
}

export function createFileRoute(path: string) {
  return (config: { component?: React.ComponentType<any>; [k: string]: any } = {}): RouteHandle => ({
    useParams: <T extends Record<string, string> = Record<string, string>>() =>
      useRRParams() as unknown as T,
    component: config.component,
    fullPath: path,
  });
}

export function createRootRouteWithContext<_T>() {
  return (config: any = {}): RouteHandle => ({
    useParams: () => useRRParams() as any,
    component: config.component,
    fullPath: "/",
  });
}

export function createRootRoute(config: any = {}): RouteHandle {
  return {
    useParams: () => useRRParams() as any,
    component: config.component,
    fullPath: "/",
  };
}

// No-op stubs so route files that import these don't break.
export const HeadContent = () => null;
export const Scripts = () => null;
