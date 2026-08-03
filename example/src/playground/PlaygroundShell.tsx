import { type ReactNode, useEffect, useRef } from "react";
import { NavLink } from "react-router";

const playgroundLinks = [
  { label: "위젯", path: "/examples/widget" },
  { label: "레이아웃", path: "/examples/layout" },
  { label: "고급 예제", path: "/examples/advanced" },
] as const;

export function PlaygroundShell({ children, routePath }: { children: ReactNode; routePath: string }) {
  return (
    <div className="playground-shell">
      <nav aria-label="예제 메뉴" className="playground-nav">
        {playgroundLinks.map((link) => (
          <NavLink key={link.path} to={link.path}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <main className="playground-main">
        <RouteLifecycleBoundary key={routePath} routePath={routePath}>
          {children}
        </RouteLifecycleBoundary>
      </main>
    </div>
  );
}

function RouteLifecycleBoundary({ children, routePath }: { children: ReactNode; routePath: string }) {
  const cleanupCountRef = useRef(0);

  useEffect(() => {
    return () => {
      cleanupCountRef.current += 1;
      if (cleanupCountRef.current > 1) {
        window.__cominsGridLayoutLastUnmount = { routePath };
      }
    };
  }, [routePath]);

  return <>{children}</>;
}
