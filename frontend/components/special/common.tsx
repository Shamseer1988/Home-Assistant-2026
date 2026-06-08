import { Card } from "@/components/ui/Card";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function Empty({ msg }: { msg: string }) {
  return (
    <Card className="p-10 text-center text-sm text-slate-400">{msg}</Card>
  );
}
