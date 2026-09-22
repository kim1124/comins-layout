import type { ReactNode } from "react";

import { usePlaygroundLocale } from "../locale";

export function PlaygroundFeatureGuide({
  code,
  items,
  referenceCaption,
  referenceNameLabel,
  references,
}: {
  code?: string;
  items: ReadonlyArray<string>;
  referenceCaption?: string;
  referenceNameLabel?: string;
  references?: ReadonlyArray<{ description: string; name: string }>;
}) {
  const { text } = usePlaygroundLocale();

  return (
    <section
      aria-label={text("기능 설명", "Feature description")}
      className="playground-feature-guide"
    >
      <h2>{text("기능 구성", "Feature details")}</h2>
      <ul className="playground-feature-guide__list">
        {items.map((item) => (
          <li className="playground-feature-guide__item" key={item}>{item}</li>
        ))}
      </ul>
      {references?.length && referenceCaption && referenceNameLabel ? (
        <PlaygroundReferenceTable
          caption={referenceCaption}
          nameLabel={referenceNameLabel}
          rows={references}
        />
      ) : null}
      {code ? (
        <section className="playground-feature-guide__code">
          <h3>{text("관련 API 코드", "Relevant API code")}</h3>
          <p>{text("핵심 설정을 발췌한 코드입니다. 전체 연결은 시작 가이드와 API 문서를 참고하세요.", "This excerpt highlights the relevant settings. See the getting-started guide and API reference for the complete setup.")}</p>
          <pre><code>{code}</code></pre>
        </section>
      ) : null}
    </section>
  );
}

export function PlaygroundReferenceTable({
  caption,
  nameLabel,
  rows,
}: {
  caption: string;
  nameLabel: string;
  rows: ReadonlyArray<{ description: string; name: string }>;
}) {
  const { text } = usePlaygroundLocale();

  return (
    <div className="playground-reference-table-wrap">
      <table aria-label={caption} className="playground-reference-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{nameLabel}</th>
            <th scope="col">{text("기능 설명", "Description")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row"><code>{row.name}</code></th>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlaygroundStage({
  actions,
  children,
  description,
  kind,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  kind: "controls" | "grid";
}) {
  const { text } = usePlaygroundLocale();
  const copy = kind === "controls"
    ? {
        title: text("예제 컨트롤", "Example controls"),
        description: description ?? text(
          "설정을 변경하고 결과 상태를 확인하는 컨트롤 영역입니다.",
          "Use these controls to change settings and inspect resulting state.",
        ),
      }
    : {
        title: text("실행 예제", "Live example"),
        description: description ?? text(
          "위젯을 조작하며 설명한 설정과 결과를 확인합니다.",
          "Interact with widgets to observe the documented settings and results.",
        ),
      };

  return (
    <section className={`playground-example-stage playground-example-stage--${kind}`}>
      <header className="playground-example-stage__header">
        {actions ? (
          <div className="playground-example-stage__heading">
            <h2>{copy.title}</h2>
            {actions}
          </div>
        ) : <h2>{copy.title}</h2>}
        <p>{copy.description}</p>
      </header>
      {children}
    </section>
  );
}
