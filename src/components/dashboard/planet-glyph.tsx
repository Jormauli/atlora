export function PlanetGlyph({ size = "sm" }: { size?: "sm" | "lg" }) {
  const dimension = size === "lg" ? 52 : 40;

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ height: dimension, width: dimension }}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full overflow-visible"
        fill="none"
      >
        <circle cx="32" cy="32" r="23" className="fill-[#d9e7c6] stroke-[#78906b]" strokeWidth="3" />
        <path
          d="M43 12c9 10 8 26-2 36-9 9-24 10-34 1 6 9 18 15 31 11 14-4 23-18 20-32-2-8-7-14-15-16Z"
          className="fill-[#7f986f]"
          opacity="0.26"
        />
        <circle cx="24" cy="23" r="8" className="fill-[#f2f8df]" opacity="0.65" />
        <circle cx="40" cy="27" r="4" className="fill-[#8fa47e]" opacity="0.5" />
        <circle cx="27" cy="42" r="5" className="fill-[#8fa47e]" opacity="0.36" />
        <circle cx="19" cy="33" r="2.5" className="fill-[#4d6b45]" opacity="0.68" />
        <path
          d="M19 19c5-4 12-6 19-4"
          className="stroke-[#f0f6df]"
          strokeLinecap="round"
          strokeWidth="3"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}
