import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
  interval?: number; // ms
}

interface UseTimerResult {
  elapsed: number; // ms since start
  running: boolean;
  start: (force?: boolean) => void; // force=true 时忽略当前 running 状态重新启动
  stop: () => void;
  reset: () => void;
}

export const useTimer = (options: UseTimerOptions = {}): UseTimerResult => {
  const { interval = 250 } = options;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!running || startedAtRef.current == null) return;
    const now = performance.now();
    if (!lastTickRef.current || now - lastTickRef.current >= interval) {
      setElapsed(now - startedAtRef.current);
      lastTickRef.current = now;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [running, interval]);

  const start = useCallback((force: boolean = false) => {
    if (running && !force) return;
    startedAtRef.current = performance.now() - (force ? 0 : elapsed); // force 时从 0 重新计
    if (force) {
      setElapsed(0);
    }
    setRunning(true);
  }, [elapsed, running]);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setElapsed(0);
    startedAtRef.current = null;
    lastTickRef.current = null;
  }, []);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tick]);

  return { elapsed, running, start, stop, reset };
};
