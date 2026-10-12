import { useEffect, useState } from "react";
import type { Framework } from "../shared/example-catalog";
import type { Locale } from "../shared/locale";

export function FrameworkSource({ exampleId, framework, locale }: { exampleId: string; framework: Framework; locale: Locale }) {
  const [files, setFiles] = useState<{ path: string; code: string }[]>([]);
  const [path, setPath] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setFiles([]);
    setError(false);
    void import("../shared/example-sources").then(module => module.getExampleSources(exampleId, framework)).then(result => {
      if (cancelled) return;
      setFiles(result); setPath(result[0]?.path ?? "");
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [exampleId, framework]);
  return <section className="framework-source docs-code" aria-label={locale === "ko" ? "예제 소스" : "Example source"}>
    <header className="framework-panel-heading"><span>{path || (locale === 'ko' ? '소스 코드' : 'Source code')}</span><span>READ ONLY</span></header>
    <p>{locale === "ko" ? "현재 실행하는 예제와 보조 파일입니다. 패키지 import로 표시하며, 여러 파일로 구성된 Vite 예제입니다." : "The running example and its supporting files use public package imports. This is a multi-file Vite example."}</p>
    <label>{locale === "ko" ? "예제 파일" : "Example file"}<select value={path} onChange={event => setPath(event.target.value)}>{files.map(file => <option key={file.path}>{file.path}</option>)}</select></label>
    {error ? <p role="alert">{locale === 'ko' ? '예제 소스를 불러올 수 없습니다.' : 'Unable to load example source.'}</p> : <pre><code>{files.find(file => file.path === path)?.code ?? (locale === "ko" ? "소스를 불러오는 중입니다." : "Loading source.")}</code></pre>}
  </section>;
}
