import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS } from "../../../../src";
import { Dialog } from "../../components/ui/dialog";
import { Select } from "../../components/ui/select";
import type { SelectOption } from "../../components/ui/select";
import { createWidget } from "../fixtures";
import type { DashboardRuntime } from "../types";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const heightOptions: SelectOption[] = [1, 2, 3, 4].map((height) => ({
  label: String(height),
  value: String(height),
}));

type WidgetCrudControlsProps = {
  dashboard: DashboardRuntime;
  mode: string;
  onAfterAdd?: (id: string) => void;
};

export function WidgetCrudControls({ dashboard, mode, onAfterAdd }: WidgetCrudControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("새 위젯");
  const [draftValue, setDraftValue] = useState("신규");
  const [newWidgetHeight, setNewWidgetHeight] = useState(2);
  const [newWidgetWidth, setNewWidgetWidth] = useState(2);
  const [selectedId, setSelectedId] = useState("sales");
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedId) ?? dashboard.widgets[0];
  const widgetOptions = dashboard.widgets.map((widget) => ({
    label: widget.title ?? widget.id,
    value: widget.id,
  }));
  const selectedValue = selectedWidget?.id ?? "";

  const addWidget = () => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    const id = `widget-${number}`;
    dashboard.commands.addWidget(
      createWidget(id, draftTitle || `위젯 ${number}`, 0, 0, newWidgetWidth, newWidgetHeight, {
        description: "새 대시보드 위젯",
        value: draftValue || String(number),
      }),
    );
    setSelectedId(id);
    onAfterAdd?.(id);
    setDialogOpen(false);
  };

  const removeSelectedWidget = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.removeWidget(selectedWidget.id);
    const nextWidget = dashboard.widgets.find((widget) => widget.id !== selectedWidget.id);
    if (nextWidget) {
      setSelectedId(nextWidget.id);
    }
  };

  const openAddDialog = () => {
    const number = nextWidgetNumber.current;
    setDraftTitle(`위젯 ${number}`);
    setDraftValue(String(number));
    setDialogOpen(true);
  };

  return (
    <>
      <div className="example-actions example-crud-actions" aria-label={`${mode} widget actions`}>
        <button className="example-action-button example-action-button--add" type="button" onClick={openAddDialog}>
          <Plus aria-hidden="true" size={14} />
          위젯 추가
        </button>
        <Select id={`${mode}-delete-widget`} label="삭제 대상" options={widgetOptions} value={selectedValue} onChange={setSelectedId} />
        <button className="example-action-button example-action-button--danger" type="button" onClick={removeSelectedWidget}>
          <Trash2 aria-hidden="true" size={14} />
          위젯 삭제
        </button>
      </div>

      <Dialog description="추가할 위젯의 너비와 높이를 선택합니다." open={dialogOpen} title="위젯 추가" onOpenChange={setDialogOpen}>
        <div className="example-dialog-form">
          <label className="example-input" htmlFor={`${mode}-new-widget-title`}>
            <span>위젯명</span>
            <input id={`${mode}-new-widget-title`} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
          </label>
          <label className="example-input" htmlFor={`${mode}-new-widget-value`}>
            <span>값</span>
            <input id={`${mode}-new-widget-value`} value={draftValue} onChange={(event) => setDraftValue(event.target.value)} />
          </label>
          <Select
            id={`${mode}-new-widget-width`}
            label="새 위젯 너비"
            options={columnOptions}
            value={String(newWidgetWidth)}
            onChange={(value) => setNewWidgetWidth(Number(value))}
          />
          <Select
            id={`${mode}-new-widget-height`}
            label="새 위젯 높이"
            options={heightOptions}
            value={String(newWidgetHeight)}
            onChange={(value) => setNewWidgetHeight(Number(value))}
          />
          <div className="example-dialog__footer">
            <button type="button" onClick={() => setDialogOpen(false)}>
              취소
            </button>
            <button className="example-action-button example-action-button--add" type="button" onClick={addWidget}>
              위젯 저장
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
