interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export default function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const sizes = {
    sm: "text-sm px-2 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-lg px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold rounded-full ${sizes[size]}`}
    >
      🔥 {streak} {streak === 1 ? "day" : "days"}
    </span>
  );
}
