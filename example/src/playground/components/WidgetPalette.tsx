import { Plus } from "lucide-react";

import { useDashboardDragIn } from "../../../../src";
import type {
  DashboardDragInPreviewLayout,
  DashboardWidget,
} from "../../../../src";
import { usePlaygroundLocale } from "../locale";

export type WidgetPaletteDefinition<TData> = {
  id: string;
  label: string;
  description: string;
  previewLayout: DashboardDragInPreviewLayout;
  restricted?: boolean;
  createWidget: () => DashboardWidget<TData>;
};

export type WidgetPaletteProps<TData> = {
  definitions: ReadonlyArray<WidgetPaletteDefinition<TData>>;
  onAdd: (definition: WidgetPaletteDefinition<TData>, targetGridId: string) => void;
};

export function WidgetPalette<TData>({ definitions, onAdd }: WidgetPaletteProps<TData>) {
  const { text } = usePlaygroundLocale();
  return (
    <section aria-label={text("위젯 팔레트", "Widget Palette")} className="transfer-palette">
      <div className="transfer-palette__header">
        <div>
          <p className="example-kicker">{text("외부 Drag-in", "External Drag-in")}</p>
          <h2>{text("위젯 팔레트", "Widget Palette")}</h2>
        </div>
        <p>{text("handle을 Grid로 드래그하거나 추가 버튼을 사용합니다.", "Drag the handle into a grid or use an add button.")}</p>
      </div>
      <div className="transfer-palette__items">
        {definitions.map((definition) => (
          <PaletteItem definition={definition} key={definition.id} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}

function PaletteItem<TData>({
  definition,
  onAdd,
}: {
  definition: WidgetPaletteDefinition<TData>;
  onAdd: WidgetPaletteProps<TData>["onAdd"];
}) {
  const { text } = usePlaygroundLocale();
  const dragRef = useDashboardDragIn({
    sourceId: definition.id,
    previewLayout: definition.previewLayout,
    createWidget: definition.createWidget,
    dragOptions: { handle: ".transfer-palette-item__handle" },
  });

  return (
    <article
      className="transfer-palette-item"
      data-palette-id={definition.id}
      data-restricted={String(definition.restricted ?? false)}
      ref={dragRef}
    >
      <div className="transfer-palette-item__handle" data-testid={`palette-drag-${definition.id}`}>
        <span>{definition.restricted ? text("거부 예제", "Rejected example") : text("허용", "Allowed")}</span>
        <strong>{definition.label}</strong>
        <small>{definition.description}</small>
      </div>
      <div className="transfer-palette-item__actions">
        <button type="button" onClick={() => onAdd(definition, "grid-a")}>
          <Plus aria-hidden="true" size={13} />
          {text("Grid A에 추가", "Add to Grid A")}
        </button>
        <button type="button" onClick={() => onAdd(definition, "grid-b")}>
          <Plus aria-hidden="true" size={13} />
          {text("Grid B에 추가", "Add to Grid B")}
        </button>
      </div>
    </article>
  );
}
