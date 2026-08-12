export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="tm-bg" x1="8" y1="4" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12263f" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#tm-bg)" />
      <circle cx="24" cy="24" r="12.5" stroke="#99f6e4" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="2.1" fill="#5eead4" />
      <path d="M24 14.5V24L30 28" stroke="#5eead4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 9.5V12" stroke="#99f6e4" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
