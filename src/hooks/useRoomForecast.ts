import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type MetricKey = "temp" | "humidity" | "ph" | "ec" | "co2";

export type MetricForecast = {
  metric: MetricKey;
  history: number[];
  forecast: number[];
  demo?: boolean;
};

export type RoomForecast = {
  data: Record<MetricKey, MetricForecast> | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
};

const METRICS: MetricKey[] = ["temp", "humidity", "ph", "ec", "co2"];

export function useRoomForecast(roomId: string): RoomForecast {
  const [data, setData] = useState<Record<MetricKey, MetricForecast> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(
      METRICS.map((metric) =>
        fetch(`${API_URL}/forecast/${roomId}/${metric}`)
          .then((r) => {
            if (!r.ok) throw new Error(`${metric}: ${r.status}`);
            return r.json() as Promise<MetricForecast>;
          })
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const valid = results.filter(Boolean) as MetricForecast[];
      if (valid.length === 0) {
        setError("Could not reach forecast service — make sure the backend is running.");
        setData(null);
        setIsDemo(false);
      } else {
        const map = Object.fromEntries(valid.map((r) => [r.metric, r])) as Record<
          MetricKey,
          MetricForecast
        >;
        setData(map);
        setError(null);
        setIsDemo(valid.some((r) => r.demo));
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return { data, loading, error, isDemo };
}
