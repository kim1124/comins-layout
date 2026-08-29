import { Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";

import { PlaygroundLocaleProvider, usePlaygroundLocale } from "./locale";
import { playgroundMenus } from "./routes";

export function PlaygroundShell({ children, routePath }: { children: ReactNode; routePath: string }) {
  return (
    <PlaygroundLocaleProvider>
      <PlaygroundShellContent routePath={routePath}>{children}</PlaygroundShellContent>
    </PlaygroundLocaleProvider>
  );
}

function PlaygroundShellContent({ children, routePath }: { children: ReactNode; routePath: string }) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const { locale, setLocale } = usePlaygroundLocale();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const searchResults = useMemo(
    () => normalizedQuery
      ? playgroundMenus.flatMap((menu) => [menu, ...menu.submenus]).filter((item) =>
          `${item.label.ko} ${item.label.en}`.toLocaleLowerCase(locale).includes(normalizedQuery),
        )
      : [],
    [locale, normalizedQuery],
  );

  useEffect(() => {
    setFocused(false);
    setQuery("");
  }, [locale, routePath]);

  const text = locale === "ko"
    ? {
        docsPlayground: "문서 Playground",
        locale: "Playground 언어",
        navigation: "예제 메뉴",
        noResults: "검색된 결과가 없습니다.",
        search: "문서 및 예제 검색",
        searchResults: "Playground 검색 결과",
        section: "Playground",
        submenu: "서브 메뉴",
      }
    : {
        docsPlayground: "Docs Playground",
        locale: "Playground language",
        navigation: "Example menu",
        noResults: "No results found.",
        search: "Search docs and examples",
        searchResults: "Playground search results",
        section: "Playground",
        submenu: "Submenu",
      };

  return (
    <div className="docs-shell playground-shell">
      <header className="docs-top-nav">
        <NavLink className="docs-top-nav__brand" to="/examples/widget/basic">
          <strong>comins-grid-layout</strong>
          <span>{text.docsPlayground}</span>
        </NavLink>
        <div className="docs-top-nav__tools">
          <div
            aria-label={text.locale}
            className="playground-locale-toggle"
            data-testid="playground-locale-toggle"
            role="group"
          >
            <button aria-pressed={locale === "ko"} onClick={() => setLocale("ko")} type="button">
              한
            </button>
            <button aria-pressed={locale === "en"} onClick={() => setLocale("en")} type="button">
              EN
            </button>
          </div>
          <div className="global-playground-search" ref={searchRef}>
            <label className="example-search">
              <Search aria-hidden="true" className="example-search__icon" focusable="false" />
              <input
                aria-label={text.search}
                onBlur={(event) => {
                  if (event.relatedTarget instanceof Node && searchRef.current?.contains(event.relatedTarget)) {
                    return;
                  }
                  setFocused(false);
                }}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setFocused(true)}
                placeholder={text.search}
                type="search"
                value={query}
              />
            </label>
            {focused && normalizedQuery ? (
              <div aria-label={text.searchResults} className="global-search-popup" role="listbox">
                {searchResults.length ? (
                  searchResults.map((menu) => (
                    <button
                      aria-selected="false"
                      className="global-search-popup__item"
                      key={menu.path}
                      role="option"
                      type="button"
                      onClick={() => navigate(menu.path)}
                    >
                      <strong>{menu.label[locale]}</strong>
                      <span>{text.section}</span>
                    </button>
                  ))
                ) : (
                  <p className="global-search-popup__empty">{text.noResults}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <div className="docs-shell__body">
        <aside className="docs-sidebar">
          <nav aria-label={text.navigation}>
            <section className="docs-sidebar__group">
              <h2>{text.section}</h2>
              <div className="docs-sidebar__links">
                {playgroundMenus.map((menu) => (
                  <div className="playground-sidebar__menu" key={menu.path}>
                    <Link
                      aria-current={routePath.startsWith(menu.prefix) ? "page" : undefined}
                      className="docs-sidebar__link"
                      to={menu.path}
                    >
                      {menu.label[locale]}
                    </Link>
                    <div
                      aria-label={`${menu.label[locale]} ${text.submenu}`}
                      className="playground-sidebar__submenu"
                      role="group"
                    >
                      {menu.submenus.map((submenu) => (
                        <NavLink className="docs-sidebar__link playground-sidebar__submenu-link" key={submenu.path} to={submenu.path}>
                          {submenu.label[locale]}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </nav>
        </aside>
        <main className="docs-shell__content playground-main">
          <div className="playground-route-content">
            <RouteLifecycleBoundary key={routePath} routePath={routePath}>
              {children}
            </RouteLifecycleBoundary>
          </div>
        </main>
      </div>
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
