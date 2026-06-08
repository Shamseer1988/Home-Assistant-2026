import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";
import { useEntityStore } from "@/store/entities";
import type { HAEntity } from "./types";

let socket: Socket | null = null;
let initialized = false;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
  }
  return socket;
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
  s.on("state_changed", (p: { entity_id: string; state: HAEntity }) =>
    store().upsert(p.state)
  );
  s.on("state_removed", (p: { entity_id: string }) =>
    store().remove(p.entity_id)
  );

  return s;
}
