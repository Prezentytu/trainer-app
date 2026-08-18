import { splitExerciseName } from "@/lib/exerciseName";

export function ExerciseName({
  name,
  variant = "trainer",
  className,
}: {
  name: string;
  variant?: "trainer" | "client";
  className?: string;
}) {
  const { primary, secondary } = splitExerciseName(name);
  return (
    <span className={className}>
      <span className="break-words">{primary}</span>
      {variant === "trainer" && secondary ? (
        <span className="mt-0.5 block break-words text-[13px] font-normal text-muted">{secondary}</span>
      ) : null}
    </span>
  );
}
