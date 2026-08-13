import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Highlight, themes } from "prism-react-renderer";
import { PanelLeft, Search } from "lucide-react";

import { createDocsContent, createDocsNavGroups, searchDocs } from "./content";
import type { ApiFeatureSection, DocsCodeSample, DocsNavGroup, DocsPage, DocsSearchItem, DocsSearchKind, PlaygroundExampleId } from "./types";
import { defineLocalizedText, usePlaygroundLocale } from "../i18n/playground-locale";
import { playgroundMessages } from "../i18n/messages";
import { AdvancedPlayground } from "../playground/AdvancedPlayground";
import { AdvancedEventsPlayground } from "../playground/AdvancedEventsPlayground";
import { AdvancedExternalDropPlayground } from "../playground/AdvancedExternalDropPlayground";
import { AdvancedHandlePlayground } from "../playground/AdvancedHandlePlayground";
import { AdvancedStatePlayground } from "../playground/AdvancedStatePlayground";
import { LayoutColumnsPlayground } from "../playground/LayoutColumnsPlayground";
import { LayoutLockPlayground } from "../playground/LayoutLockPlayground";
import { LayoutPlayground } from "../playground/LayoutPlayground";
import { WidgetPlayground } from "../playground/WidgetPlayground";

const docsMessages = {
  documentation: defineLocalizedText("문서", "Documentation"),
  exampleCode: defineLocalizedText("예제 코드", "Example code"),
  events: defineLocalizedText("Events", "Events"),
  methods: defineLocalizedText("Methods", "Methods"),
  parameters: defineLocalizedText("파라미터:", "Parameters:"),
  payload: defineLocalizedText("페이로드:", "Payload:"),
  props: defineLocalizedText("Props", "Props"),
  returns: defineLocalizedText("리턴값:", "Returns:"),
  sidebar: defineLocalizedText("GridStack 문서", "GridStack documentation"),
  when: defineLocalizedText("발생 시점:", "When:"),
  searchResults: defineLocalizedText("전체 문서 검색 결과", "All docs search results"),
  searchKinds: {
    api: defineLocalizedText("API", "API"),
    code: defineLocalizedText("코드", "Code"),
    document: defineLocalizedText("문서", "Document"),
    example: defineLocalizedText("예제", "Example"),
  } satisfies Record<DocsSearchKind, ReturnType<typeof defineLocalizedText>>,
} as const;

function ApiReference({ apiFeatures }: { apiFeatures: ApiFeatureSection[] }) {
  const { text } = usePlaygroundLocale();

  return (
    <div className="docs-reference-list">
      {apiFeatures.map((section, index) => (
        <section className="docs-reference-list__group" id={section.id} key={section.id}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          <p>{section.summary}</p>
          {section.props.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} ${text(docsMessages.props)}`}>
              <h3>{text(docsMessages.props)}</h3>
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
            <section className="docs-reference-list__subsection" aria-label={`${section.title} ${text(docsMessages.methods)}`}>
              <h3>{text(docsMessages.methods)}</h3>
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
                        <strong>{text(docsMessages.parameters)}</strong> {method.params}
                      </small>
                      <small>
                        <strong>{text(docsMessages.returns)}</strong> {method.returns}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
              {section.methods.map((method) =>
                method.sample ? (
                  <div className="docs-reference-list__sample" key={method.sample.title}>
                    <h4>{text(docsMessages.exampleCode)}</h4>
                    <CodeExample sample={method.sample} />
                  </div>
                ) : null,
              )}
            </section>
          ) : null}
          {section.events?.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} ${text(docsMessages.events)}`}>
              <h3>{text(docsMessages.events)}</h3>
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
                        <strong>{text(docsMessages.when)}</strong> {event.when}
                      </small>
                      <small>
                        <strong>{text(docsMessages.payload)}</strong> {event.payload}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <section className="docs-reference-list__subsection" aria-label={`${section.title} ${text(docsMessages.exampleCode)}`}>
            <h3>{text(docsMessages.exampleCode)}</h3>
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
  const { locale } = usePlaygroundLocale();
  const location = useLocation();
  const content = useMemo(() => createDocsContent(locale), [locale]);
  const navGroups = useMemo(() => createDocsNavGroups(content.pages), [content.pages]);
  const page = content.pages.find((candidate) => candidate.path === location.pathname) ?? content.pages[0]!;

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
      <DocsTopNav pages={content.pages} />
      <div className="docs-shell__body">
        <DocsSidebar navGroups={navGroups} />
        <main className="docs-shell__content">
          <RouteLifecycleBoundary key={location.pathname} routePath={location.pathname}>
            <DocsArticle apiFeatures={content.apiFeatures} page={page} />
          </RouteLifecycleBoundary>
        </main>
      </div>
    </div>
  );
}

function DocsTopNav({ pages }: { pages: DocsPage[] }) {
  const { text } = usePlaygroundLocale();

  return (
    <header className="docs-topnav">
      <div className="docs-topnav__brand">
        <p className="docs-topnav__eyebrow">Comins Playground</p>
        <h1>comins-grid-layout</h1>
      </div>
      <div className="docs-topnav__controls">
        <div aria-label={text(playgroundMessages.localeToggle)} data-testid="playground-locale-toggle" role="group">
          <LocaleToggle />
        </div>
        <GlobalDocsSearch pages={pages} />
      </div>
    </header>
  );
}

function LocaleToggle() {
  const { locale, setLocale } = usePlaygroundLocale();

  return (
    <>
      <button aria-pressed={locale === "ko"} type="button" onClick={() => setLocale("ko")}>
        한
      </button>
      <button aria-pressed={locale === "en"} type="button" onClick={() => setLocale("en")}>
        EN
      </button>
    </>
  );
}

function GlobalDocsSearch({ pages }: { pages: DocsPage[] }) {
  const { locale, text } = usePlaygroundLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDocs(query, pages), [pages, query]);

  useEffect(() => {
    setQuery("");
  }, [locale, location.key]);

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
          aria-label={text(playgroundMessages.search)}
          placeholder={text(playgroundMessages.search)}
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
        <div aria-label={text(docsMessages.searchResults)} className="global-search-popup" id="global-docs-search-results" role="listbox">
          {results.length ? (
            results.map((item) => {
              const kind = text(docsMessages.searchKinds[item.kind]);
              return (
                <button
                  aria-label={`${kind} ${item.title} ${item.description}`}
                  className="global-search-popup__item"
                  key={item.id}
                  role="option"
                  type="button"
                  onClick={() => selectResult(item)}
                >
                  <span className="global-search-popup__badge">{kind}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="global-search-popup__empty">{text(playgroundMessages.noSearchResults)}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DocsSidebar({ navGroups }: { navGroups: DocsNavGroup[] }) {
  const { text } = usePlaygroundLocale();

  return (
    <aside aria-label={text(docsMessages.sidebar)} className="docs-sidebar">
      <div className="docs-sidebar__heading">
        <PanelLeft aria-hidden="true" size={16} />
        <strong>{text(docsMessages.documentation)}</strong>
      </div>
      <nav aria-label={text(playgroundMessages.docsNavigation)}>
        {navGroups.map((group) => (
          <section className="docs-sidebar__group" key={group.category}>
            <h2>{group.category}</h2>
            {group.sections.map((section, index) => (
              <div className="docs-sidebar__section" key={`${section.label ?? "root"}-${index}`}>
                {section.label ? <h3>{section.label}</h3> : null}
                <div className="docs-sidebar__links">
                  {section.pages.map((page) => (
                    <NavLink className="docs-sidebar__link" end key={page.path} to={page.path}>
                      {page.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

function DocsArticle({ apiFeatures, page }: { apiFeatures: ApiFeatureSection[]; page: DocsPage }) {
  return (
    <article className="docs-article">
      <header className="docs-article__header">
        <p className="docs-article__eyebrow">{page.category}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </header>

      {page.path === "/api" ? (
        <section className="docs-article__body">
          <ApiReference apiFeatures={apiFeatures} />
        </section>
      ) : page.body ? (
        <section className="docs-article__body">
          {page.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ) : null}

      {page.examples.map((example, index) => (
        <section className="docs-example-case" id={`${page.path}-example-${index + 1}`} key={`${page.path}-${example.liveExampleId ?? index}`}>
          <header className="docs-example-case__header">
            <h2>
              {index + 1}. {example.title}
            </h2>
            <p>{example.description}</p>
          </header>

          {example.codeSamples.map((sample) => (
            <CodeExample key={`${page.path}-${example.title}-${sample.title}`} sample={sample} />
          ))}

          {example.liveExampleId ? (
            <section className="docs-live" data-live-example={example.liveExampleId}>
              <LivePlayground id={example.liveExampleId} />
            </section>
          ) : null}
        </section>
      ))}
    </article>
  );
}

function LivePlayground({ id }: { id: PlaygroundExampleId }) {
  switch (id) {
    case "advanced":
      return <AdvancedPlayground />;
    case "advanced-events":
      return <AdvancedEventsPlayground />;
    case "advanced-external-drop":
      return <AdvancedExternalDropPlayground />;
    case "advanced-handle":
      return <AdvancedHandlePlayground />;
    case "advanced-state":
      return <AdvancedStatePlayground />;
    case "layout":
      return <LayoutPlayground />;
    case "layout-columns":
      return <LayoutColumnsPlayground />;
    case "layout-lock":
      return <LayoutLockPlayground />;
    case "widget":
      return <WidgetPlayground />;
  }
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
