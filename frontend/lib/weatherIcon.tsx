import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

export function weatherIcon(condition?: string): LucideIcon {
  switch ((condition || "").toLowerCase()) {
    case "sunny":
    case "clear":
      return Sun;
    case "clear-night":
      return Moon;
    case "partlycloudy":
      return CloudSun;
    case "cloudy":
    case "overcast":
      return Cloud;
    case "fog":
      return CloudFog;
    case "rainy":
    case "pouring":
      return CloudRain;
    case "lightning":
    case "lightning-rainy":
      return CloudLightning;
    case "snowy":
    case "snowy-rainy":
      return CloudSnow;
    case "windy":
    case "windy-variant":
      return Wind;
    case "hail":
      return CloudDrizzle;
    default:
      return CloudSun;
  }
}
