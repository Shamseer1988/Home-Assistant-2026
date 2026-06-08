import {
  Activity,
  BatteryMedium,
  Blinds,
  Camera,
  CircleDot,
  DoorOpen,
  Droplets,
  Fan,
  Gauge,
  Lightbulb,
  Lock,
  Music,
  Plug,
  Power,
  Radar,
  Thermometer,
  User,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { HAEntity } from "./types";
import { domainOf } from "./ha";

export function iconFor(entity: HAEntity): LucideIcon {
  const domain = domainOf(entity.entity_id);
  const dc = entity.attributes?.device_class as string | undefined;

  switch (domain) {
    case "light":
      return Lightbulb;
    case "switch":
      return dc === "outlet" ? Plug : Power;
    case "fan":
      return Fan;
    case "climate":
      return Thermometer;
    case "media_player":
      return Music;
    case "camera":
      return Camera;
    case "cover":
      return Blinds;
    case "lock":
      return Lock;
    case "person":
    case "device_tracker":
      return User;
    case "binary_sensor":
      if (dc === "motion" || dc === "occupancy") return Radar;
      if (dc === "door" || dc === "window") return DoorOpen;
      return CircleDot;
    case "sensor":
      if (dc === "temperature") return Thermometer;
      if (dc === "humidity") return Droplets;
      if (dc === "power" || dc === "energy") return Zap;
      if (dc === "battery") return BatteryMedium;
      if (dc === "pressure") return Gauge;
      if (dc === "wind_speed") return Wind;
      return Activity;
    default:
      return CircleDot;
  }
}
