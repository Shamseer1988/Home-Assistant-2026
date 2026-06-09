import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";
import { domainOf, friendlyName, isOn, stateLabel } from "./ha";
import { useEntityStore } from "@/store/entities";
import { useToastStore } from "@/store/toast";
import type { HAEntity } from "./types";

let socket: Socket | null = null;
let initialized = false;

// Domains worth a toast (controllables) — sensors are far too noisy.
const TOAST_DOMAINS = new Set([
  "light",
  "switch",
  "fan",
  "cover",
  "lock",
  "climate",
  "media_player",
  "input_boolean",
]);

export function getSocket(): Socket {
  if (!socket) {
    // Empty API_URL => connect same-origin (behind the reverse proxy).
    const opts = { transports: ["websocket", "polling"], reconnection: true };
    socket = API_URL ? io(API_URL, opts) : io(opts);
  }
  return socket;
}

function maybeToast(prev: HAEntity | undefined, next: HAEntity) {
  if (!prev) return; // initial value, not a change
  if (!TOAST_DOMAINS.has(domainOf(next.entity_id))) return;
  if (prev.state === next.state) return;
  if (["unavailable", "unknown"].includes(next.state)) return;
  if (["unavailable", "unknown"].includes(prev.state)) return;
  const tone = isOn(next)
    ? "on"
    : ["off", "closed", "idle", "standby"].includes(next.state)
      ? "off"
      : "info";
  useToastStore.getState().push({
    title: friendlyName(next),
    subtitle: stateLabel(next),
    tone,
  });
}

/** Idempotently wire Socket.IO events into the entity store. */
export function initRealtime(): Socket {
  const s = getSocket();
  if (initialized) return s;
  initialized = true;

  const store = useEntityStore.getState;

  s.on("connect", () => store().setConnected(true));
  s.on("disconnect", () => store().setConnected(false));
  s.on("snapshot", (states: HAEntity[]) => store().setSnapshot(states));
  s.on("state_changed", (p: { entity_id: string; state: HAEntity }) => {
    const st = store();
    maybeToast(st.entities[p.entity_id], p.state);
    st.upsert(p.state);
  });
  s.on("state_removed", (p: { entity_id: string }) => store().remove(p.entity_id));

  return s;
}
