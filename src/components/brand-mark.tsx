export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="20" cy="20" rx="17" ry="9.5" fill="none" stroke="#686865" strokeWidth="1.25" transform="rotate(-28 20 20)" />
      <ellipse cx="20" cy="20" rx="12.5" ry="7" fill="none" stroke="#555552" strokeWidth="1.1" transform="rotate(26 20 20)" />
      <circle cx="20" cy="20" r="6.2" fill="#4f6f8f" />
      <circle cx="33.2" cy="10.4" r="3.1" fill="#b48745" stroke="#151515" strokeWidth="1.8" />
      <circle cx="7.3" cy="30" r="2.6" fill="#9a554b" stroke="#151515" strokeWidth="1.8" />
    </svg>
  );
}
