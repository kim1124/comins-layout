import type { ReactNode } from "react";

import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { sharedPlaygroundCopy } from "../../playground/copy";

type DialogProps = {
  children: ReactNode;
  description?: string;
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
};

export function Dialog({ children, description, open, title, onOpenChange }: DialogProps) {
  const { text } = usePlaygroundLocale();

  if (!open) {
    return null;
  }

  return (
    <div className="example-dialog" role="presentation">
      <button
        aria-label={text(sharedPlaygroundCopy.closeDialog)}
        className="example-dialog__backdrop"
        type="button"
        onClick={() => onOpenChange(false)}
      />
      <section aria-describedby={description ? "example-dialog-description" : undefined} aria-modal="true" className="example-dialog__panel" role="dialog" aria-label={title}>
        <header className="example-dialog__header">
          <div>
            <h2>{title}</h2>
            {description ? <p id="example-dialog-description">{description}</p> : null}
          </div>
          <button aria-label={text(sharedPlaygroundCopy.closeDialog)} className="example-dialog__close" type="button" onClick={() => onOpenChange(false)}>
            ×
          </button>
        </header>
        <div className="example-dialog__body">{children}</div>
      </section>
    </div>
  );
}
