import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string | number;
  detail?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "green" | "gold" | "red";
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
      {Icon ? <Icon size={22} /> : null}
    </article>
  );
}
