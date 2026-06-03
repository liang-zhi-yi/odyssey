"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingOptions<T> {
  /** Initial data value */
  initialData?: T;
  /** Polling interval in ms (default: 3000) */
  interval?: number;
  /** Stop polling when this predicate returns true */
  stopWhen?: (data: T) => boolean;
  /** Maximum polling duration in ms (default: 60000 = 60s) */
  timeout?: number;
  /** Callback when polling times out */
  onTimeout?: () => void;
}

interface UsePollingResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
  elapsed: number;
  /** Manually refetch immediately */
  refetch: () => void;
}

/**
 * Generic polling hook.
 *
 * Used for async assessment status: polls GET /assessments/{id}
 * every 3 seconds until status is COMPLETED or FAILED.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions<T> = {},
): UsePollingResult<T> {
  const {
    initialData,
    interval = 3000,
    stopWhen,
    timeout = 60000,
    onTimeout,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const tickCountRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const executeFetch = useCallback(() => {
    fetcher()
      .then((result) => {
        if (!mountedRef.current) return;
        setData(result);
        setError(null);
        setIsLoading(false);

        // Check if we should stop polling
        if (stopWhen && stopWhen(result)) {
          clearTimer();
        }
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Polling request failed");
        setIsLoading(false);
      });
  }, [fetcher, stopWhen, clearTimer]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    executeFetch();
  }, [executeFetch]);

  useEffect(() => {
    mountedRef.current = true;
    startTimeRef.current = Date.now();

    // Initial fetch
    executeFetch();

    // Start polling
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      setElapsed(elapsedMs);

      // Check timeout
      if (elapsedMs >= timeout) {
        clearTimer();
        if (onTimeout) onTimeout();
        setError("Assessment timed out. Please try again.");
        setIsLoading(false);
        return;
      }

      executeFetch();
      tickCountRef.current++;
    }, interval);

    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isPolling = data !== undefined && stopWhen ? !stopWhen(data) : true;

  return { data, isLoading, error, isPolling, elapsed, refetch };
}
