import { useCallback, useEffect, useRef, useState } from "react";

export function useWidgetRefresh(onComplete: (id: string) => void, delayMs = 500) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const completeRef = useRef(onComplete);
  const [refreshingIds, setRefreshingIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const cancel = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
    }
    timers.current.delete(id);
    setRefreshingIds((current) => new Set([...current].filter((candidate) => candidate !== id)));
  }, []);

  const refresh = useCallback((id: string) => {
    cancel(id);
    setRefreshingIds((current) => new Set(current).add(id));
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id);
      setRefreshingIds((current) => new Set([...current].filter((candidate) => candidate !== id)));
      completeRef.current(id);
    }, delayMs));
  }, [cancel, delayMs]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  return {
    cancel,
    isRefreshing: (id: string) => refreshingIds.has(id),
    refresh,
  };
}
