import * as React from "react";
import { parsePath } from "history";
import type {
  Action,
  History,
  InitialEntry,
  Location,
  MemoryHistory,
  Path,
  State,
  To,
  Transition
} from "history";
import { PathPattern, generatePath } from "react-router";
import {
  PathMatch,
  Router as V6Router,
  MemoryRouter as V6MemoryRouter,
  BrowserRouter as V6BrowserRouter,
  HashRouter as V6HashRouter,
  Routes,
  Link as V6Link,
  useLocation,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  matchPath,
  useInRouterContext,
  useHref,
  useNavigate,
  Navigate
} from "react-router-dom";

import { StaticRouter as V6StaticRouter } from "react-router-dom/server";
import type * as LegacyDOM from "./legacy-dom-types";
import type * as Legacy from "./legacy-types";
import type * as LegacyHistory from "./legacy-history";

function invariant(cond: any, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

export type CompatRouterProps = React.PropsWithChildren<
  Omit<LegacyDOM.RouterProps, "history">
> & {
  history: History;
};

export function Router({ children, history }: CompatRouterProps) {
  let [, setState] = React.useState({});
  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <V6Router
      navigator={history}
      location={history.location}
      action={history.action as Action}
    >
      {children}
    </V6Router>
  );
}

export function StaticRouter(
  props: React.PropsWithChildren<LegacyDOM.StaticRouterProps>
) {
  let { children, basename, context, location = "" } = props;

  if (typeof context !== "undefined") {
    console.warn("context has no effect anymore");
  }

  if ((props as any).history) {
    console.warn("<StaticRouter> ignores the history prop");
  }

  let v6Location = React.useMemo<Partial<Location>>(() => {
    if (typeof location === "string") {
      return parsePath(location);
    }

    return location as Partial<Location>;
  }, [location]);

  if (v6Location.pathname) {
    v6Location.pathname = decodeURI(v6Location.pathname);
  }

  return (
    <V6StaticRouter location={v6Location} basename={basename}>
      {children}
    </V6StaticRouter>
  );
}

export function MemoryRouter(
  props: React.PropsWithChildren<LegacyDOM.MemoryRouterProps>
) {
  let {
    getUserConfirmation,
    initialEntries,
    initialIndex,
    keyLength,
    children
  } = props;

  if (typeof keyLength !== "undefined") {
    console.warn("keyLength has no effect anymore");
  }

  if (typeof getUserConfirmation !== "undefined") {
    console.warn("getUserConfirmation has no effect anymore");
  }

  if ((props as any).history) {
    console.warn("<MemoryRouter> ignores the history prop");
  }

  return (
    <V6MemoryRouter
      initialEntries={initialEntries as InitialEntry[]}
      initialIndex={initialIndex}
    >
      {children}
    </V6MemoryRouter>
  );
}

export function BrowserRouter(
  props: React.PropsWithChildren<LegacyDOM.BrowserRouterProps>
) {
  let { basename, children, getUserConfirmation, forceRefresh } = props;

  if ((props as any).history) {
    console.warn("<BrowserRouter> ignores the history prop");
  }

  if (typeof forceRefresh !== "undefined") {
    console.warn("forceRefresh has no effect anymore");
  }

  if (typeof getUserConfirmation !== "undefined") {
    console.warn("getUserConfirmation has no effect anymore");
  }

  return <V6BrowserRouter basename={basename}>{children}</V6BrowserRouter>;
}

export function HashRouter(
  props: React.PropsWithChildren<LegacyDOM.HashRouterProps>
) {
  let { basename, children, getUserConfirmation, hashType } = props;

  if ((props as any).history) {
    console.warn("<HashRouter> ignores the history prop");
  }

  if (typeof hashType !== "undefined") {
    console.warn("hashType has no effect anymore");
  }

  if (typeof getUserConfirmation !== "undefined") {
    console.warn("getUserConfirmation has no effect anymore");
  }

  return <V6HashRouter basename={basename}>{children}</V6HashRouter>;
}

export function Switch({
  children,
  location: providedLocation
}: LegacyDOM.SwitchProps) {
  invariant(
    useInRouterContext(),
    "You should not use <Switch> outside a <Router>"
  );

  let parentLocation = useLocation();
  let location = providedLocation || parentLocation;
  let element: any;
  let match: PathMatch<string> | null = null;
  React.Children.forEach(children, child => {
    if (!match && React.isValidElement(child)) {
      element = child;

      const path = child.props.path || child.props.from || location.pathname;

      let pattern: PathPattern = {
        caseSensitive: child.props.sensitive || false,
        end: child.props.exact,
        path
      };

      match = path ? matchPath(pattern, location.pathname) : null;
    }
  });

  return match
    ? React.cloneElement(element, { location, computedMatch: match })
    : null;
}

function isEmptyChildren(children: any) {
  return React.Children.count(children) === 0;
}

function createLegacyHistory(internalLocation: any, navigate: any) {
  return {
    action: internalLocation.action,
    block: navigate.navigator.block as any, // TODO: Map to legacy structure
    createHref: navigate.navigator.createHref,
    push: navigate.navigator.push,
    replace: navigate.navigator.replace,
    go: navigate.navigator.go,
    goBack: () => navigate.navigator.go(-1),
    goForward: () => navigate.navigator.go(1),
    location: internalLocation.location,
    get length() {
      console.warn(
        "This is unreliable and we have removed it. Please use window.history.length instead but it's also unreliable."
      );
      return 0;
    },
    listen: (() => {
      console.warn(
        "Sorry, this is deprecated. Please useEffect utilizing the location."
      );
    }) as any
  };
}

export function Route({
  children,
  component,
  exact,
  location: locationProp,
  path: providedPath = "",
  render,
  sensitive,
  strict
}: LegacyDOM.RouteProps) {
  invariant(
    useInRouterContext(),
    "You should not use <Route> outside a <Router>"
  );

  let contextLocation = useLocation();
  let location = locationProp || contextLocation;
  let internalLocation = React.useContext(UNSAFE_LocationContext);
  let navigate = React.useContext(UNSAFE_NavigationContext);

  let paths: string[];
  if (Array.isArray(providedPath)) {
    paths = providedPath;
  } else {
    paths = [providedPath as string];
  }

  paths = paths.filter(path => {
    if (typeof path !== "string") {
      console.warn(
        `<Route path={/regexp/}> is no longer supported, please provide only string paths.`
      );
      return false;
    }

    return true;
  });

  if (!paths.length) {
    return null;
  }

  let cleanChildren = children;
  // Preact uses an empty array as children by
  // default, so use null if that's the case.
  if (Array.isArray(cleanChildren) && isEmptyChildren(cleanChildren)) {
    cleanChildren = null;
  }

  for (let path of paths) {
    let pattern = {
      path: path as string,
      caseSensitive: sensitive || false,
      end: exact || false
    };
    let match: PathMatch<string> | null = path
      ? matchPath(pattern, location.pathname)
      : {
          params: {},
          pathname: location.pathname,
          pattern
        };

    if (!match || (strict && match?.pathname !== path)) {
      continue;
    }

    let componentProps = {
      location,
      match: match
        ? {
            isExact: match.pathname === location.pathname,
            params: match.params,
            path: match.pattern.path,
            url: match.pathname
          }
        : null,
      history: createLegacyHistory(internalLocation, navigate)
    } as LegacyDOM.RouteChildrenProps & LegacyDOM.RouteComponentProps;

    return (
      <UNSAFE_RouteContext.Provider
        value={{
          outlet: null,
          params: match?.params || {},
          pathname: location.pathname,
          route: match
            ? {
                caseSensitive: sensitive,
                path: match.pathname
              }
            : null
        }}
      >
        {match
          ? cleanChildren
            ? typeof cleanChildren === "function"
              ? cleanChildren(componentProps)
              : cleanChildren
            : component
            ? React.createElement(component, componentProps)
            : render
            ? render(componentProps)
            : null
          : typeof cleanChildren === "function"
          ? cleanChildren(componentProps)
          : null}
      </UNSAFE_RouteContext.Provider>
    );
  }

  return (
    <UNSAFE_RouteContext.Provider
      value={{
        outlet: null,
        params: {},
        pathname: location.pathname,
        route: null
      }}
    >
      {typeof cleanChildren === "function"
        ? cleanChildren({
            location,
            match: null,
            history: createLegacyHistory(internalLocation, navigate)
          })
        : null}
    </UNSAFE_RouteContext.Provider>
  );
}

export const Link = React.forwardRef<HTMLAnchorElement, LegacyDOM.LinkProps>(
  ({ to, replace, innerRef, component, children, onClick, ...rest }, ref) => {
    invariant(
      useInRouterContext(),
      "You should not use <Link> outside a <Router>"
    );

    if (typeof to === "undefined") {
      console.error("The prop `to` is marked as required in `Link`");
    }

    let location = useLocation();
    let v6To: To =
      typeof to === "string"
        ? to
        : typeof to === "function"
        ? to(location)
        : to || "";

    let href = useHref(v6To);
    let v6Ref = ref || innerRef;
    let navigate = useNavigate();

    let locationHref = useHref(location);
    let ultimateReplace = replace || href === locationHref;

    let navigateCalled = false;
    let element = component
      ? React.createElement(component, {
          ...rest,
          href,
          ref: v6Ref,
          navigate() {
            navigateCalled = true;
            navigate(v6To, {
              replace: ultimateReplace
            });
          }
        })
      : children;

    let onClickHandler = React.useMemo(() => {
      if (!onClick) {
        return undefined;
      }

      return (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        try {
          onClick?.(event);

          if (!event.defaultPrevented && !navigateCalled) {
            navigate(v6To, {
              replace: ultimateReplace
            });
            event.preventDefault();
          }
        } catch (error) {
          event.preventDefault();
          throw error;
        }
      };
    }, [onClick, ultimateReplace, navigateCalled]);

    return (
      <V6Link {...rest} to={v6To} ref={v6Ref} onClick={onClickHandler}>
        {element}
      </V6Link>
    );
  }
);

function joinClassnames(...classnames: (string | undefined)[]) {
  return classnames.filter(i => i).join(" ");
}

export const NavLink = React.forwardRef<
  HTMLAnchorElement,
  LegacyDOM.NavLinkProps
>((props, ref) => {
  let {
    to,
    innerRef,
    children,
    exact,
    strict,
    activeClassName = "active",
    className,
    activeStyle,
    style,
    location: providedLocation,
    isActive,
    sensitive,
    "aria-current": ariaCurrent = "page",
    ...rest
  } = props as typeof props & { sensitive?: boolean };

  invariant(
    useInRouterContext(),
    "You should not use <NavLink> outside a <Router>"
  );

  if (typeof to === "undefined") {
    console.error("The prop `to` is marked as required in `NavLink`");
  }

  let actualLocation = useLocation();
  let location = React.useMemo(
    () =>
      providedLocation
        ? {
            hash: providedLocation.hash,
            key: providedLocation.key || "", // TODO: figure out what to do if a key isn't provided
            pathname: providedLocation.pathname,
            search: providedLocation.search,
            state: providedLocation.state as any
          }
        : actualLocation,
    [providedLocation, actualLocation]
  );

  let v6To: To =
    typeof to === "string"
      ? to
      : typeof to === "function"
      ? to(location)
      : to || "";

  let href = useHref(v6To);
  let v6Ref = ref || innerRef;

  let computedIsActive = React.useMemo(() => {
    let pattern = {
      path: href,
      caseSensitive: sensitive || false,
      end: exact || false
    };
    let match = matchPath(pattern, location.pathname);
    if (match && strict && href !== location.pathname) {
      match = null;
    }

    return isActive
      ? isActive(
          match
            ? {
                isExact: match.pathname === location.pathname,
                params: match?.params,
                path: match.pattern.path,
                url: match.pathname
              }
            : null,
          location
        )
      : !!match;
  }, [href, sensitive, exact, location, strict]);

  let computedClassname = React.useMemo<string | undefined>(() => {
    let res =
      typeof className === "function" ? className(computedIsActive) : className;

    if (!computedIsActive) {
      return res;
    }

    return joinClassnames(res, activeClassName);
  }, [computedIsActive, activeClassName, className]);

  let computedStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    let styles = typeof style === "function" ? style(computedIsActive) : style;

    if (!computedIsActive) {
      return styles;
    }

    return styles || activeStyle ? { ...styles, ...activeStyle } : undefined;
  }, [computedIsActive, style, activeStyle]);

  return (
    <Link
      {...rest}
      to={v6To}
      ref={v6Ref}
      className={computedClassname}
      style={computedStyle}
      aria-current={(computedIsActive && ariaCurrent) || undefined}
    >
      {children}
    </Link>
  );
});

export function withRouter<
  P extends LegacyDOM.RouteComponentProps<any>,
  C extends React.ComponentType<P>
>(Component: C & React.ComponentType<P>) {
  return React.forwardRef(
    (
      props: Omit<P, keyof LegacyDOM.RouteComponentProps<any>> &
        Legacy.WithRouterProps<C> &
        Legacy.WithRouterStatics<C>,
      ref
    ) => {
      let { WrappedComponent, wrappedComponentRef, ...rest } = props as any;

      let internalLocation = React.useContext(UNSAFE_LocationContext);
      let navigate = React.useContext(UNSAFE_NavigationContext);
      let routeContext = React.useContext(UNSAFE_RouteContext);

      let history = React.useMemo(
        () => createLegacyHistory(internalLocation, navigate),
        [internalLocation, navigate]
      );
      let location = useLocation();

      return (
        <Component
          {...(rest as any)}
          ref={ref || wrappedComponentRef}
          history={history}
          location={location}
          match={{
            isExact: routeContext.pathname === location.pathname,
            params: routeContext.params,
            path: routeContext.route?.path,
            url: routeContext.pathname
          }}
        />
      );
    }
  );
}

export function Redirect({
  exact,
  strict,
  from,
  to,
  push
}: LegacyDOM.RedirectProps) {
  let location = useLocation();

  let state = typeof to === "object" ? (to.state as Object) : undefined;

  let v6To: PathPattern =
    typeof to === "string"
      ? {
          path: to
        }
      : {
          path: to.pathname!,
          end: !!exact
        };

  if (from) {
    let match = matchPath(
      {
        path: from,
        end: !!exact
      },
      location.pathname
    );
    if (match && (!strict || match.pathname === location.pathname)) {
      let matchedPath =
        typeof to === "string" ? generatePath(to, match.params) : to;
      return <Navigate to={matchedPath} replace={!push} state={state} />;
    }

    return null;
  } else if (matchPath(v6To, location.pathname)) {
    return null;
  }

  return <Navigate to={to} replace={!push} state={state} />;
}
