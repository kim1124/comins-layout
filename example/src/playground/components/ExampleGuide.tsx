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
          <h3>{text("적용 코드", "Example code")}</h3>
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
  children,
  description,
  kind,
}: {
  children: ReactNode;
  description?: string;
  kind: "controls" | "grid";
}) {
  const { text } = usePlaygroundLocale();
  const copy = kind === "controls"
    ? {
        title: text("GridStack 예제 컨트롤", "GridStack example controls"),
        description: description ?? text(
          "설정을 변경하고 결과 상태를 확인하는 컨트롤 영역입니다.",
          "Use these controls to change settings and inspect resulting state.",
        ),
      }
    : {
        title: text("GridStack 예제", "GridStack example"),
        description: description ?? text(
          "설명한 설정과 상호작용을 실제 GridStack 위젯에서 확인합니다.",
          "Inspect the documented settings and interactions in live GridStack widgets.",
        ),
      };

  return (
    <section className={`playground-example-stage playground-example-stage--${kind}`}>
      <header className="playground-example-stage__header">
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </header>
      {children}
    </section>
  );
}
