import { teamInitials } from "../lib/format";

export function Flag({
  code,
  label,
  size = "md"
}: {
  code?: string | null;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!code) {
    return (
      <span className={`flag-fallback flag-${size}`} aria-label={label}>
        {teamInitials(label)}
      </span>
    );
  }

  return (
    <span className={`flag-wrap flag-${size}`} aria-label={label} title={label}>
      <img src={`/flags/${code}.svg`} alt="" aria-hidden="true" />
    </span>
  );
}

export function CountryLabel({
  code,
  label,
  size = "sm"
}: {
  code?: string | null;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span className="country-label">
      <Flag code={code} label={label} size={size} />
      <span>{label}</span>
    </span>
  );
}
