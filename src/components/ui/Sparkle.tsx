import { cn } from "@/lib/cn";

/** آیکون درخشش چهارپر — امضای بصری برند PsyG */
export function Sparkle({
  className,
  strokeWidth = 0,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      strokeWidth={strokeWidth}
      className={cn("size-5", className)}
      aria-hidden
    >
      <path d="M12 0.5c.5 5.2 2.6 8.4 7.1 9.4l1.4.3-1.4.3c-4.5 1-6.6 4.2-7.1 9.4-.5-5.2-2.6-8.4-7.1-9.4L3.5 10.2l1.4-.3C9.4 8.9 11.5 5.7 12 .5Z" />
      <path
        d="M19.5 15.5c.25 2.1 1.2 3.4 3.1 3.8-1.9.4-2.85 1.7-3.1 3.8-.25-2.1-1.2-3.4-3.1-3.8 1.9-.4 2.85-1.7 3.1-3.8Z"
        opacity=".65"
      />
    </svg>
  );
}
