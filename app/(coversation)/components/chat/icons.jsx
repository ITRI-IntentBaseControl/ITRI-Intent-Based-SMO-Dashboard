// components/chat/icons.ts
export function PlusIcon() {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
      viewBox="0 0 24 24"
    >
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function PaperclipIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      strokeWidth={2}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M21.44 11.05l-9.6 9.6a5.37 5.37 0 01-7.59 0 5.37 5.37 0 010-7.59l9.89-9.89a3.56 3.56 0 015 5l-9.88 9.89a1.78 1.78 0 01-2.52-2.53l8.6-8.6" />
    </svg>
  );
}

export function StopIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      stroke="none"
      viewBox="0 0 24 24"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function ArrowUpIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      strokeWidth="2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M17 14l-5-5-5 5" />
    </svg>
  );
}

export function VercelIcon({ size = 16 }) {
  return (
    <svg
      height={size}
      viewBox="0 0 283 64"
      fill="currentColor"
      className="mx-1"
    >
      <path d="M141.53 0l70.765 64H70.765l70.765-64z" />
    </svg>
  );
}
