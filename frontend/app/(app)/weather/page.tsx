"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "@/lib/api";
import { selectWeather } from "@/lib/selectors";
import { weatherIcon } from "@/lib/weatherIcon";
import { useEntityStore } from "@/store/entities";
import { Card } from "@/components/ui/Card";
import { Empty, PageHeader } from "@/components/special/common";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-fg">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export default function WeatherPage() {
  const entities = useEntityStore((s) => s.entities);
  const weather = selectWeather(entities);
  const { data } = useQuery({
    queryKey: ["forecast", weather?.entity_id],
    queryFn: () => fetchForecast(weather!.entity_id, "daily"),
    enabled: !!weather,
  });

  if (!weather) {
    return (
      <div>
        <PageHeader title="Weather" />
        <Empty msg="No weather entity found." />
      </div>
    );
  }

  const a = weather.attributes || {};
  const Icon = weatherIcon(weather.state);
  const forecast = data?.forecast || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Weather" />

      <Card className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <Icon className="h-16 w-16 text-sidra-sky" />
          <div>
            <p className="text-5xl font-bold text-fg">
              {a.temperature != null ? Math.round(a.temperature) : "--"}°
            </p>
            <p className="capitalize text-muted">
              {(weather.state || "").replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <Metric label="Humidity" value={a.humidity != null ? `${a.humidity}%` : "--"} />
          <Metric
            label="Wind"
            value={a.wind_speed != null ? `${a.wind_speed} ${a.wind_speed_unit || "km/h"}` : "--"}
          />
          <Metric
            label="Pressure"
            value={a.pressure != null ? `${a.pressure} ${a.pressure_unit || "hPa"}` : "--"}
          />
        </div>
      </Card>

      {forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {forecast.slice(0, 7).map((f, i) => {
            const FIcon = weatherIcon(f.condition);
            return (
              <Card key={i} className="flex flex-col items-center gap-1 p-4">
                <p className="text-xs text-muted">
                  {new Date(f.datetime).toLocaleDateString([], { weekday: "short" })}
                </p>
                <FIcon className="my-1 h-7 w-7 text-sidra-sky" />
                <p className="text-sm font-semibold text-fg">
                  {f.temperature != null ? Math.round(f.temperature) : "--"}°
                </p>
                {f.templow != null && (
                  <p className="text-xs text-muted">{Math.round(f.templow)}°</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
