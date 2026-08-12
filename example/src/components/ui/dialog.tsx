import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { playgroundMessages } from "../../i18n/messages";
import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { sharedPlaygroundCopy } from "../../playground/copy";

type DialogProps = {
  children: ReactNode;
  description?: string;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  title: string;
  onOpenChange: (open: boolean) => void;
};

export function Dialog({ children, description, open, returnFocusRef, title, onOpenChange }: DialogProps) {
  const { locale, setLocale, text } = usePlaygroundLocale();
  const panelRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!open) {
      return;
    }

    openerRef.current = returnFocusRef?.current ?? (
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    );
    const panel = panelRef.current;
    const focusableSelector = [
      "button:not([disabled]):not([tabindex='-1'])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[href]",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const getFocusableElements = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
        .filter((element) => element.getClientRects().length > 0);
    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (!first || !last) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (openerRef.current?.isConnected) {
        openerRef.current.focus();
      }
      openerRef.current = null;
    };
  }, [open, returnFocusRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="example-dialog" role="presentation">
      <button
        aria-label={text(sharedPlaygroundCopy.closeDialog)}
        className="example-dialog__backdrop"
        tabIndex={-1}
        type="button"
        onClick={() => onOpenChange(false)}
      />
      <section ref={panelRef} aria-describedby={description ? "example-dialog-description" : undefined} aria-modal="true" className="example-dialog__panel" role="dialog" aria-label={title} tabIndex={-1}>
        <header className="example-dialog__header">
          <div>
            <h2>{title}</h2>
            {description ? <p id="example-dialog-description">{description}</p> : null}
          </div>
          <div className="example-dialog__header-actions">
            <div aria-label={text(playgroundMessages.localeToggle)} data-testid="dialog-locale-toggle" role="group">
              <button aria-pressed={locale === "ko"} type="button" onClick={() => setLocale("ko")}>
                KO
              </button>
              <button aria-pressed={locale === "en"} type="button" onClick={() => setLocale("en")}>
                EN
              </button>
            </div>
            <button aria-label={text(sharedPlaygroundCopy.closeDialog)} className="example-dialog__close" type="button" onClick={() => onOpenChange(false)}>
              ×
            </button>
          </div>
        </header>
        <div className="example-dialog__body">{children}</div>
      </section>
    </div>
  );
}
