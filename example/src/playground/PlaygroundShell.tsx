import { Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";

import { PlaygroundLocaleProvider, usePlaygroundLocale } from "./locale";
import { playgroundMenus } from "./routes";
import { resolveFrameworkRoute, frameworkExamplePath } from "../shared/framework-navigation";
import { FrameworkSource } from "./FrameworkSource";
import { getExampleApiNames } from "../shared/framework-api";
import { exampleDescription } from "../shared/example-descriptions";
import { getExampleGuidance } from "../shared/example-guidance";

export function PlaygroundShell({ children, routePath }: { children: ReactNode; routePath: string }) {
  const embedded = new URLSearchParams(window.location.search).get("embed") === "1";
  return (
    <PlaygroundLocaleProvider initialLocale={new URLSearchParams(window.location.search).has("locale") || embedded ? (new URLSearchParams(window.location.search).get("locale") === "en" ? "en" : "ko") : undefined} persist={!embedded}>
      {embedded ? <main className="playground-embed" key={routePath}>{children}</main> :
        <PlaygroundShellContent routePath={routePath}>{children}</PlaygroundShellContent>}
    </PlaygroundLocaleProvider>
  );
}

function PlaygroundShellContent({ children, routePath }: { children: ReactNode; routePath: string }) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const { locale, setLocale } = usePlaygroundLocale();
  const [query, setQuery] = useState("");
  const [showCode, setShowCode] = useState(false);
  const route = resolveFrameworkRoute(routePath);
  const basePath = route?.example.path ?? routePath;
  const framework = route?.framework ?? "react";
  const guidance = route ? getExampleGuidance(route.example.id, locale, framework) : undefined;
  const pathFor = (path: string) => route?.explicit ? frameworkExamplePath(path.replace(/^\/examples\//, ""), framework) : path;
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
        <NavLink className="docs-top-nav__brand" to={pathFor("/examples/widget/basic")}>
          <img src="/comins-symbol.svg" width="32" height="32" alt="" style={{ flexShrink: 0, alignSelf: "center" }} />
          <div style={{ display: "grid", gap: 2 }}>
            <strong>comins-grid-layout</strong>
            <span>{text.docsPlayground}</span>
          </div>
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
                      onClick={() => navigate(pathFor(menu.path))}
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
            <label className="playground-example-select">
              {locale === 'ko' ? '예제 선택' : 'Select example'}
              <select aria-label={locale === "ko" ? "예제 선택" : "Select example"} value={basePath} onChange={event => navigate(pathFor(event.target.value))}>
                {playgroundMenus.map(menu => <optgroup label={menu.label[locale]} key={menu.path}>
                  {menu.submenus.map(submenu => <option key={submenu.path} value={submenu.path}>{submenu.label[locale]}</option>)}
                </optgroup>)}
              </select>
            </label>
            <section className="docs-sidebar__group">
              <h2>{text.section}</h2>
              <div className="docs-sidebar__links">
                {playgroundMenus.map((menu) => (
                  <div className="playground-sidebar__menu" key={menu.path}>
                    <Link
                      aria-current={basePath.startsWith(menu.prefix) ? "page" : undefined}
                      className="docs-sidebar__link"
                      to={pathFor(menu.path)}
                    >
                      {menu.label[locale]}
                    </Link>
                    <div
                      aria-label={`${menu.label[locale]} ${text.submenu}`}
                      className="playground-sidebar__submenu"
                      role="group"
                    >
                      {menu.submenus.map((submenu) => (
                        <NavLink aria-current={basePath === submenu.path ? "page" : undefined} className="docs-sidebar__link playground-sidebar__submenu-link" key={submenu.path} to={pathFor(submenu.path)}>
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
          {route ? <>
            <header className="framework-intro playground-header">
              <div><span className="framework-route">examples / {route.example.id}</span>
                <h1>{route.example.label[locale]}</h1><p>{exampleDescription(route.example.id, locale)}</p>
                <div className="framework-api" aria-label={locale === "ko" ? "관련 API" : "Related API"}>{getExampleApiNames(route.example.id, framework).map(name => <code key={name}>{name}</code>)}</div>
              </div>
              <div className="framework-intro-actions"><button type="button" aria-expanded={showCode} onClick={() => setShowCode(value => !value)}>{locale === "ko" ? (showCode ? "코드 닫기" : "코드 보기") : (showCode ? "Hide code" : "View code")}</button><Link to={`/api?framework=${framework}`}>API</Link></div>
            </header>
            <div className="framework-toolbar">
              <div className="framework-tabs" role="tablist" aria-label={locale === "ko" ? "프레임워크" : "Framework"}>
                {(["react", "vue"] as const).map(value => <button key={value} id={`framework-tab-${value}`} type="button" role="tab" aria-controls="framework-panel" aria-selected={framework === value} tabIndex={framework === value ? 0 : -1}
                  onKeyDown={event => { if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 'react' : event.key === 'End' ? 'vue' : value === 'react' ? 'vue' : 'react'; navigate(frameworkExamplePath(route.example.id, next)); document.getElementById(`framework-tab-${next}`)?.focus(); }}
                  onClick={() => navigate(frameworkExamplePath(route.example.id, value))}><span aria-hidden="true" className={`framework-dot framework-dot--${value}`} />{value === "react" ? "React" : "Vue 3"}</button>)}
              </div>
            </div>
          </> : null}
          <div className="playground-route-content framework-runtime" id={route ? "framework-panel" : undefined} role={route ? "tabpanel" : undefined} aria-labelledby={route ? `framework-tab-${framework}` : undefined}>
            <RouteLifecycleBoundary key={routePath} routePath={routePath}>
              {children}
            </RouteLifecycleBoundary>
          </div>
          {guidance ? <details className="framework-guidance" key={`guidance-${routePath}`}>
            <summary>{locale === 'ko' ? '기능 설명 · 동작 및 API' : 'Feature details · Behavior and API'}</summary>
            <div className="framework-guidance__body">
              <ul>{guidance.items.map(item => <li key={item}>{item}</li>)}</ul>
              {guidance.references?.length ? <div className="framework-guidance__reference">
                <table aria-label={guidance.referenceCaption}>
                  <caption>{guidance.referenceCaption}</caption>
                  <thead><tr><th scope="col">{guidance.referenceNameLabel}</th><th scope="col">{locale === 'ko' ? '기능 설명' : 'Description'}</th></tr></thead>
                  <tbody>{guidance.references.map(row => <tr key={row.name}><th scope="row"><code>{row.name}</code></th><td>{row.description}</td></tr>)}</tbody>
                </table>
              </div> : null}
            </div>
          </details> : null}
          {showCode && route ? <FrameworkSource exampleId={route.example.id} framework={framework} locale={locale} /> : null}
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
