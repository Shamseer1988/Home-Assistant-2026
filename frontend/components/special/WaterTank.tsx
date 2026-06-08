"use client";

import type { HAEntity } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { RadialGauge } from "@/components/ui/RadialGauge";

export function WaterTank({ sensors }: { sensors: HAEntity[] }) {
  const pct = sensors.find((s) => s.attributes?.unit_of_measurement === "%");
  const liters = sensors.find((s) =>
    /^l$|liter|litre/i.test(s.attributes?.unit_of_measurement || "")
  );
  const value = pct ? parseFloat(pct.state) : NaN;

  return (
    <Card className="flex flex-col items-center p-6">
      <h3 className="mb-2 self-start font-semibold text-fg">Water Tank</h3>
      {Number.isNaN(value) ? (
        <p className="py-6 text-sm text-muted">No tank level sensor found.</p>
      ) : (
        <RadialGauge value={value} min={0} max={100} unit="%" sub="Tank level" accent="#38bdf8" />
      )}
      {liters && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-fg">{liters.state}</span>{" "}
          {liters.attributes?.unit_of_measurement}
        </p>
      )}
    </Card>
  );
}
