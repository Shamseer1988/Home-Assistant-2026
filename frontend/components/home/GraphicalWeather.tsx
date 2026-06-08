"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "@/lib/api";
import { selectWeather } from "@/lib/selectors";
import { weatherIcon } from "@/lib/weatherIcon";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";

function WeatherArt({ condition }: { condition: string }) {
  const c = (condition || "").toLowerCase();
  const rainy = /rain|pour|drizzle|storm|lightning/.test(c);
  const cloudy = /cloud|overcast|fog/.test(c);
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-28 shrink-0">
      {!cloudy && (
        <g className="weather-sun" style={{ transformOrigin: "42px 38px" }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = ((i * 45) * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={42 + Math.cos(a) * 20}
                y1={38 + Math.sin(a) * 20}
                x2={42 + Math.cos(a) * 27}
                y2={38 + Math.sin(a) * 27}
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}
      <circle cx="42" cy="38" r="15" fill="#fcd34d" />
      <g className="weather-cloud">
        <ellipse cx="72" cy="52" rx="26" ry="16" fill="#e2e8f0" />
        <ellipse cx="56" cy="54" rx="16" ry="12" fill="#eef2f7" />
        <ellipse cx="86" cy="56" rx="14" ry="11" fill="#dbe3ee" />
      </g>
      {rainy && (
        <g className="weather-rain" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round">
          <line x1="58" y1="70" x2="56" y2="78" />
          <line x1="72" y1="70" x2="70" y2="78" style={{ animationDelay: ".3s" }} />
          <line x1="86" y1="70" x2="84" y2="78" style={{ animationDelay: ".6s" }} />
        </g>
      )}
    </svg>
  );
}

export function GraphicalWeather() {
  const entities = useEntityStore((s) => s.entities);
  const weather = selectWeather(entities);
  const { data } = useQuery({
    queryKey: ["forecast", weather?.entity_id],
    queryFn: () => fetchForecast(weather!.entity_id, "daily"),
    enabled: !!weather,
  });
  if (!weather) return null;

  const a = weather.attributes || {};
  const forecast = (data?.forecast || []).slice(0, 3);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-bold text-fg">
            {a.temperature != null ? Math.round(a.temperature) : "--"}°
          </p>
          <p className="mt-0.5 text-sm capitalize text-muted">
            {(weather.state || "").replace(/_/g, " ")}
          </p>
        </div>
        <WeatherArt condition={weather.state} />
      </div>

      {forecast.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line/10 pt-4">
          {forecast.map((f, i) => {
            const Icon = weatherIcon(f.condition);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted">
                  {new Date(f.datetime).toLocaleDateString([], { weekday: "short" })}
                </span>
                <Icon className="h-5 w-5 text-sidra-sky" />
                <span className="text-sm font-semibold text-fg">
                  {f.temperature != null ? Math.round(f.temperature) : "--"}°
                </span>
              </div>
            );
          })}
        </div>
      )}
      <Link href="/weather" className="mt-3 block text-center text-xs text-sidra-sky hover:underline">
        Full forecast →
      </Link>
    </Card>
  );
}
