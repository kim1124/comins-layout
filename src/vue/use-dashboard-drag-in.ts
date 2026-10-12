import { getCurrentInstance, getCurrentScope, onActivated, onDeactivated, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from "vue";
import { createDashboardDragInConnection } from "../browser/drag-in-connection";
import type { UseDashboardDragInOptions } from "../browser/types";

export function useDashboardDragIn<TData>(
  options: MaybeRefOrGetter<UseDashboardDragInOptions<TData>>,
): ShallowRef<HTMLElement | null> {
  if (!getCurrentScope()) throw new Error("useDashboardDragIn requires an active effect scope.");
  const element = shallowRef<HTMLElement | null>(null);
  const active = shallowRef(true);
  const connection = createDashboardDragInConnection();
  watch(() => {
    const value = toValue(options);
    return {
      element: element.value, active: active.value, sourceId: value.sourceId, disabled: value.disabled,
      previewLayout: { ...value.previewLayout },
      dragOptions: value.dragOptions ? { ...value.dragOptions } : undefined,
    };
  }, value => {
    if (!element.value || !active.value || value.disabled) { connection.disconnect(); return; }
    connection.connect(element.value, {
      sourceId: value.sourceId, previewLayout: value.previewLayout, dragOptions: value.dragOptions,
      createWidget: () => toValue(options).createWidget(),
    });
  }, { flush: "post" });
  if (getCurrentInstance()) {
    onActivated(() => { active.value = true; });
    onDeactivated(() => { active.value = false; connection.disconnect(); });
  }
  onScopeDispose(() => { active.value = false; connection.disconnect(); });
  return element;
}
