import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Highlight, themes } from "prism-react-renderer";
import { PanelLeft, Search } from "lucide-react";

import { apiFeatures, docsNavGroups, docsPages, searchDocs } from "./content";
import type { DocsCodeSample, DocsPage, DocsSearchItem } from "./types";

function ApiReference() {
  return (
    <div className="docs-reference-list">
      {apiFeatures.map((section, index) => (
        <section className="docs-reference-list__group" id={section.id} key={section.id}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          <p>{section.summary}</p>
          {section.props.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Props`}>
              <h3>Props</h3>
              <dl>
                {section.props.map((prop) => (
                  <div className="docs-reference-list__item" key={prop.name}>
                    <dt>
                      <span>{prop.name}</span>
                      <em>{prop.type}</em>
                    </dt>
                    <dd>
                      <p>{prop.description}</p>
                      <small>{prop.detail}</small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {section.methods?.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Methods`}>
              <h3>Methods</h3>
              <dl>
                {section.methods.map((method) => (
                  <div className="docs-reference-list__item" key={method.name}>
                    <dt>
                      <span>{method.name}</span>
                      <em>method</em>
                    </dt>
                    <dd>
                      <p>{method.description}</p>
                      <small>
                        <strong>파라미터:</strong> {method.params}
                      </small>
                      <small>
                        <strong>리턴값:</strong> {method.returns}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
              {section.methods.map((method) =>
                method.sample ? (
                  <div className="docs-reference-list__sample" key={method.sample.title}>
                    <h4>간단한 예제 코드</h4>
                    <CodeExample sample={method.sample} />
                  </div>
                ) : null,
              )}
            </section>
          ) : null}
          {section.events?.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Events`}>
              <h3>Events</h3>
              <dl>
                {section.events.map((event) => (
                  <div className="docs-reference-list__item" key={event.name}>
                    <dt>
                      <span>{event.name}</span>
                      <em>event</em>
                    </dt>
                    <dd>
                      <p>{event.description}</p>
                      <small>
                        <strong>발생 시점:</strong> {event.when}
                      </small>
                      <small>
                        <strong>페이로드:</strong> {event.payload}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <section className="docs-reference-list__subsection" aria-label={`${section.title} 예제 코드`}>
            <h3>예제 코드</h3>
            {section.samples.map((sample) => (
              <div className="docs-reference-list__sample" key={sample.title}>
                <CodeExample sample={sample} />
              </div>
            ))}
          </section>
        </section>
      ))}
    </div>
  );
}

export function DocsShell() {
  const location = useLocation();
  const page = docsPages.find((candidate) => candidate.path === location.pathname) ?? docsPages[0]!;

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "start" });
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.hash, location.pathname]);

  return (
    <div className="docs-shell">
      <DocsTopNav />
      <div className="docs-shell__body">
        <DocsSidebar />
        <main className="docs-shell__content">
          <RouteLifecycleBoundary key={location.pathname} routePath={location.pathname}>
            <DocsArticle page={page} />
          </RouteLifecycleBoundary>
        </main>
      </div>
    </div>
  );
}

function DocsTopNav() {
  return (
    <header className="docs-topnav">
      <div className="docs-topnav__brand">
        <p className="docs-topnav__eyebrow">Comins Playground</p>
        <h1>comins-grid-layout</h1>
      </div>
      <GlobalDocsSearch />
    </header>
  );
}

function GlobalDocsSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDocs(query), [query]);

  useEffect(() => {
    setQuery("");
  }, [location.key]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectResult = (item: DocsSearchItem) => {
    navigate(`${item.path}${item.hash ?? ""}`);
    setQuery("");

    if (item.hash) {
      setTimeout(() => {
        document.getElementById(decodeURIComponent(item.hash!.slice(1)))?.scrollIntoView({ block: "start" });
      }, 0);
    }
  };

  return (
    <div className="global-docs-search" ref={rootRef}>
      <div className="example-search">
        <Search aria-hidden="true" size={16} />
        <input
          aria-controls={query.trim() ? "global-docs-search-results" : undefined}
          aria-expanded={Boolean(query.trim())}
          aria-label="전체 문서 검색"
          placeholder="전체 문서 검색"
          role="searchbox"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
            }
          }}
        />
      </div>
      {query.trim() ? (
        <div aria-label="전체 문서 검색 결과" className="global-search-popup" id="global-docs-search-results" role="listbox">
          {results.length ? (
            results.map((item) => (
              <button
                aria-label={`${item.kind} ${item.title} ${item.description}`}
                className="global-search-popup__item"
                key={item.id}
                role="option"
                type="button"
                onClick={() => selectResult(item)}
              >
                <span className="global-search-popup__badge">{item.kind}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="global-search-popup__empty">검색된 결과가 없습니다.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DocsSidebar() {
  return (
    <aside aria-label="GridStack 문서" className="docs-sidebar">
      <div className="docs-sidebar__heading">
        <PanelLeft aria-hidden="true" size={16} />
        <strong>문서</strong>
      </div>
      <nav aria-label="문서 메뉴">
        {docsNavGroups.map((group) => (
          <section className="docs-sidebar__group" key={group.category}>
            <h2>{group.category}</h2>
            <div className="docs-sidebar__links">
              {group.pages.map((page) => (
                <NavLink className="docs-sidebar__link" key={page.path} to={page.path}>
                  {page.label}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}

function DocsArticle({ page }: { page: DocsPage }) {
  return (
    <article className="docs-article">
      <header className="docs-article__header">
        <p className="docs-article__eyebrow">{page.category}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </header>

      {page.path === "/api" ? (
        <section className="docs-article__body">
          <ApiReference />
        </section>
      ) : page.body ? (
        <section className="docs-article__body">{page.body}</section>
      ) : null}

      {page.examples.map((example, index) => (
        <section className="docs-example-case" id={`${page.path}-example-${index + 1}`} key={`${page.path}-${example.title}`}>
          <header className="docs-example-case__header">
            <h2>
              {index + 1}. {example.title}
            </h2>
            <p>{example.description}</p>
          </header>

          {example.codeSamples.map((sample) => (
            <CodeExample key={`${page.path}-${example.title}-${sample.title}`} sample={sample} />
          ))}
        </section>
      ))}
    </article>
  );
}

function CodeExample({ sample }: { sample: DocsCodeSample }) {
  return (
    <section aria-label={sample.title} className="docs-code">
      <div className="docs-code__header">
        <span>{sample.title}</span>
        <span>{sample.language}</span>
      </div>
      <Highlight code={sample.code.trim()} language={sample.language} theme={themes.github}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} docs-code__pre`} style={style}>
            {tokens.map((line, lineIndex) => (
              <div key={lineIndex} {...getLineProps({ className: "docs-code__line", line })}>
                <span className="docs-code__line-number">{lineIndex + 1}</span>
                <span className="docs-code__line-content">
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </section>
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
