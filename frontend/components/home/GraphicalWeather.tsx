"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Wind } from "lucide-react";
import { fetchForecast } from "@/lib/api";
import { selectWeather } from "@/lib/selectors";
import { weatherIcon } from "@/lib/weatherIcon";
import { useEntityStore } from "@/store/entities";

function WeatherArt({ condition }: { condition: string }) {
  const c = (condition || "").toLowerCase();
  const rainy = /rain|pour|drizzle|storm|lightning/.test(c);
  const cloudy = /cloud|overcast|fog/.test(c);
  return (
    <svg viewBox="0 0 130 96" className="h-24 w-28 shrink-0">
      {!cloudy && (
        <g className="weather-sun" style={{ transformOrigin: "44px 40px" }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = ((i * 45) * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={44 + Math.cos(a) * 20}
                y1={40 + Math.sin(a) * 20}
                x2={44 + Math.cos(a) * 28}
                y2={40 + Math.sin(a) * 28}
                stroke="#fbbf24"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}
      <circle cx="44" cy="40" r="15" fill="#fcd34d" />
      <g className="weather-cloud">
        <ellipse cx="74" cy="56" rx="27" ry="17" fill="#eef2f7" />
        <ellipse cx="56" cy="58" rx="17" ry="13" fill="#f8fafc" />
        <ellipse cx="90" cy="60" rx="15" ry="12" fill="#dbe3ee" />
      </g>
      {rainy && (
        <g className="weather-rain" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
          <line x1="60" y1="74" x2="58" y2="84" />
          <line x1="74" y1="74" x2="72" y2="84" style={{ animationDelay: ".3s" }} />
          <line x1="88" y1="74" x2="86" y2="84" style={{ animationDelay: ".6s" }} />
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
  const forecast = data?.forecast || [];
  const today = forecast[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-sky-200 to-blue-400 p-5 text-slate-900 shadow-glass dark:border-white/10 dark:from-[#1e3a96] dark:to-[#10204d] dark:text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-5xl font-bold leading-none">
            {a.temperature != null ? Math.round(a.temperature) : "--"}°
          </p>
          <p className="mt-1 text-sm capitalize text-blue-900/70 dark:text-blue-100">
            {(weather.state || "").replace(/_/g, " ")}
          </p>
          {today && (
            <p className="mt-0.5 text-xs text-blue-900/60 dark:text-blue-200/80">
              H {today.temperature != null ? Math.round(today.temperature) : "--"}°
              {today.templow != null && ` · L ${Math.round(today.templow)}°`}
            </p>
          )}
        </div>
        <WeatherArt condition={weather.state} />
      </div>

      <div className="mt-3 flex gap-2">
        {a.humidity != null && (
          <span className="flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs dark:bg-white/10">
            <Droplets className="h-3.5 w-3.5 text-sky-700 dark:text-blue-200" /> {a.humidity}%
          </span>
        )}
        {a.wind_speed != null && (
          <span className="flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs dark:bg-white/10">
            <Wind className="h-3.5 w-3.5 text-sky-700 dark:text-blue-200" /> {a.wind_speed}{" "}
            {a.wind_speed_unit || "km/h"}
          </span>
        )}
      </div>

      {forecast.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-black/10 pt-3 dark:border-white/10">
          {forecast.slice(1, 5).map((f, i) => {
            const Icon = weatherIcon(f.condition);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[11px] text-blue-900/60 dark:text-blue-200">
                  {new Date(f.datetime).toLocaleDateString([], { weekday: "short" })}
                </span>
                <Icon className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                <span className="text-sm font-semibold">
                  {f.temperature != null ? Math.round(f.temperature) : "--"}°
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/weather"
        className="mt-3 block text-center text-xs text-sky-700 hover:underline dark:text-blue-200"
      >
        Full forecast →
      </Link>
    </div>
  );
}
