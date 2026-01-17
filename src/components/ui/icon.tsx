import { clsx } from "clsx";

type IconName =
  | "sparkles"
  | "shieldCheck"
  | "users"
  | "creditCard"
  | "search"
  | "pin"
  | "leaf"
  | "gamepad"
  | "stars";

export function Icon({
  name,
  className
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    className: clsx("h-5 w-5", className),
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true
  } as const;

  switch (name) {
    case "sparkles":
      return (
        <svg {...common}>
          <path
            d="M12 2l1.2 4.2L17.5 7.5l-4.3 1.3L12 13l-1.2-4.2L6.5 7.5l4.3-1.3L12 2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M5 12l.8 2.7L8.5 15.5l-2.7.8L5 19l-.8-2.7L1.5 15.5l2.7-.8L5 12z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M19 12l.8 2.7 2.7.8-2.7.8L19 19l-.8-2.7-2.7-.8 2.7-.8L19 12z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "shieldCheck":
      return (
        <svg {...common}>
          <path
            d="M12 2l7 4v6c0 5-3.1 9.4-7 10-3.9-.6-7-5-7-10V6l7-4z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 12.2l2.2 2.2 4.8-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path
            d="M16.5 21v-1.4c0-1.6-1.3-2.9-2.9-2.9H10.4c-1.6 0-2.9 1.3-2.9 2.9V21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 12.8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M20 21v-1.2c0-1.3-1-2.3-2.3-2.3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M17.8 11.4a3 3 0 0 0 0-5.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "creditCard":
      return (
        <svg {...common}>
          <path
            d="M3.5 7.5h17v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 9.8h17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.5 15.8h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <path
            d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M16.5 16.5L21 21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path
            d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 11.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path
            d="M20 4c-6.5 1-12.5 5.2-14.4 9.7C3.6 18.7 7.3 21 11 21c7.8 0 11-9.7 9-17z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7 18c2-4.3 7-8.5 13-10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "gamepad":
      return (
        <svg {...common}>
          <path
            d="M8 14h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 10v8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M16.8 16.1h.01"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M18.5 14.3h.01"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M6.3 9.8h11.4c1.7 0 3.2 1.2 3.5 2.9l.5 2.8c.4 2.1-1.2 4-3.3 4-1.1 0-2.1-.5-2.7-1.4l-.6-.9H9.9l-.6.9c-.6.9-1.6 1.4-2.7 1.4-2.1 0-3.7-1.9-3.3-4l.5-2.8c.3-1.7 1.8-2.9 3.5-2.9z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "stars":
      return (
        <svg {...common}>
          <path
            d="M12 3.2l2.1 4.3 4.8.7-3.5 3.4.8 4.8-4.2-2.2-4.2 2.2.8-4.8L5.1 8.2l4.8-.7L12 3.2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

