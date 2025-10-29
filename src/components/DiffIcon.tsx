export function DiffIcon({
  before,
  after,
  isHigherBetter,
}: {
  before: number | undefined;
  after: number;
  isHigherBetter: boolean;
}): JSX.Element | null {
  if (before == null) return null;

  const diff = after - before;
  if (diff === 0) return null;

  const isImproved = isHigherBetter ? diff > 0 : diff < 0;
  const colorClass = isImproved ? "text-green-500" : "text-red-500";
  const arrow = isImproved ? "▲" : "▼";

  return (
    <span class={["pl-1", colorClass].join(" ")}>
      {arrow}
      {Math.abs(diff)}
    </span>
  );
}
