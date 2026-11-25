import { useEffect, useRef, useState } from "react";
import type { SimulationSnapshot } from "@uav/simulation-core";
const URL = "http://127.0.0.1:3000/api/devices/uav-01/flight";
interface SyncedFlight {
  flight: SimulationSnapshot;
  speed: number;
  fault: string | null;
  syncStatus: string;
  deviceMode: string | null;
  openedForHandover: boolean;
}
export function useSyncedFlight() {
  const [data, setData] = useState<SyncedFlight | null>(null);
  const [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("UAV-01: chờ Backend và ESP32 v2.");
  const inFlight = useRef(false);
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    let controller: AbortController | undefined;
    async function poll() {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 2500);
      try {
        const r = await fetch(URL, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!r.ok) throw Error();
        const next: SyncedFlight = await r.json();
        if (alive) {
          setData(next);
          setConnected(true);
        }
      } catch {
        if (alive) setConnected(false);
      } finally {
        clearTimeout(timeout);
        if (alive) timer = window.setTimeout(poll, 300);
      }
    }
    void poll();
    return () => {
      alive = false;
      controller?.abort();
      clearTimeout(timer);
    };
  }, []);
  async function send(command: string, extra: Record<string, unknown> = {}) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const r = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, ...extra }),
        signal: AbortSignal.timeout(5000),
      });
      const result = await r.json();
      setNotice(
        r.ok
          ? `${command}: Backend đã nhận; kiểm tra SYNC và ACK.`
          : `${command}: ${result.error}`,
      );
    } catch {
      setNotice(
        "Không rõ kết quả HTTP; xem trạng thái trước khi thao tác lại.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { data, connected, busy, notice, send };
}
