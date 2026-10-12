import { useEffect, useRef, useState } from "react";
import type { Locale } from "../shared/locale";
import { usePlaygroundLocale } from "./locale";

export function VuePreview({ exampleId }: { exampleId: string }) {
  const { locale } = usePlaygroundLocale();
  const latestLocale = useRef(locale);
  latestLocale.current = locale;
  const container = useRef<HTMLDivElement>(null);
  const propsRef = useRef<{ exampleId: string; locale: Locale } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | undefined;
    setError(false);
    void Promise.all([import("vue"), import("../vue/examples/registry")]).then(async ([vue, registry]) => {
      const entry = registry.getVueExample(exampleId);
      if (!entry) throw new Error("Unsupported Vue example");
      const { default: Component } = await entry.component();
      if (cancelled || !container.current) return;
      const input = vue.reactive({ exampleId, locale: latestLocale.current });
      propsRef.current = input;
      const app = vue.createApp({ render: () => vue.h(Component, input) });
      app.config.errorHandler = () => { if (!cancelled) setError(true); };
      app.mount(container.current);
      release = () => app.unmount();
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; release?.(); propsRef.current = null; };
    // Locale changes update native Vue props without resetting its state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleId]);
  useEffect(() => { if (propsRef.current) propsRef.current.locale = locale; }, [locale]);
  return <section className="framework-vue-preview" data-framework="vue">
    {error ? <p role="alert">{locale === "ko" ? "Vue 예제를 실행할 수 없습니다." : "Unable to run the Vue example."}</p> : null}
    <div ref={container} />
  </section>;
}
