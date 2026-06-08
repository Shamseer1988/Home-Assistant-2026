import type { HAEntity } from "./types";
import { domainOf } from "./ha";

type EntityMap = Record<string, HAEntity>;

const all = (e: EntityMap) => Object.values(e);
const nameOf = (s: HAEntity) =>
  `${s.entity_id} ${(s.attributes?.friendly_name || "").toLowerCase()}`;
const byName = (a: HAEntity, b: HAEntity) =>
  (a.attributes?.friendly_name || a.entity_id).localeCompare(
    b.attributes?.friendly_name || b.entity_id
  );

export const selectCameras = (e: EntityMap) =>
  all(e)
    .filter((x) => domainOf(x.entity_id) === "camera")
    .sort(byName);

export const selectByDeviceClass = (
  e: EntityMap,
  deviceClass: string,
  domain = "sensor"
) =>
  all(e)
    .filter(
      (x) =>
        domainOf(x.entity_id) === domain &&
        x.attributes?.device_class === deviceClass
    )
    .sort(byName);

export const selectAlarmPanels = (e: EntityMap) =>
  all(e).filter((x) => domainOf(x.entity_id) === "alarm_control_panel");

const SECURITY_CLASSES = ["door", "window", "motion", "occupancy", "garage_door", "opening"];
export const selectSecuritySensors = (e: EntityMap) =>
  all(e)
    .filter(
      (x) =>
        domainOf(x.entity_id) === "binary_sensor" &&
        SECURITY_CLASSES.includes(x.attributes?.device_class)
    )
    .sort(byName);

export const selectWeather = (e: EntityMap) =>
  all(e).find((x) => domainOf(x.entity_id) === "weather");

export const selectWaterTank = (e: EntityMap) =>
  all(e).filter(
    (x) =>
      domainOf(x.entity_id) === "sensor" &&
      /water[_ ]?tank|tank[_ ]?level|water[_ ]?level/.test(nameOf(x))
  );

export const selectPrayerTimes = (e: EntityMap) =>
  all(e)
    .filter(
      (x) =>
        domainOf(x.entity_id) === "sensor" &&
        x.attributes?.device_class === "timestamp" &&
        /prayer|namaz|salah/.test(nameOf(x))
    )
    .sort((a, b) => new Date(a.state).getTime() - new Date(b.state).getTime());

export const selectSystem = (e: EntityMap) =>
  all(e)
    .filter(
      (x) =>
        domainOf(x.entity_id) === "sensor" &&
        /speedtest|adguard|\bmyip\b|uptime|download|upload/.test(nameOf(x))
    )
    .sort(byName);

export const selectPersons = (e: EntityMap) =>
  all(e).filter((x) => domainOf(x.entity_id) === "person").sort(byName);

export const selectHomeMode = (e: EntityMap) =>
  all(e).find(
    (x) => domainOf(x.entity_id) === "input_select" && /\bmode\b/.test(nameOf(x))
  );

export const selectAlarmClock = (e: EntityMap) =>
  all(e).find(
    (x) => domainOf(x.entity_id) === "input_datetime" && /alarm|wake/.test(nameOf(x))
  );

export const selectMainCamera = (e: EntityMap) => selectCameras(e)[0];

export const selectMedia = (e: EntityMap) => {
  const players = all(e).filter((x) => domainOf(x.entity_id) === "media_player");
  return (
    players.find((p) => ["playing", "paused"].includes(p.state)) ||
    players.find((p) => !["unavailable", "off", "idle"].includes(p.state)) ||
    players[0]
  );
};

export const selectClimate = (e: EntityMap) =>
  all(e).find((x) => domainOf(x.entity_id) === "climate" && x.state !== "unavailable");

export const firstByDeviceClass = (e: EntityMap, dc: string) =>
  all(e).find(
    (x) => domainOf(x.entity_id) === "sensor" && x.attributes?.device_class === dc
  );
