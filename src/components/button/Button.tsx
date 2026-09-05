import { twMerge } from "tailwind-merge";
import type { ButtonProps } from "./types";

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(
        "bg-black p-3 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1 rounded-lg mt-2 cursor-pointer text-sm font-light text-white",
        className,
      )}
      {...props}
    >
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </button>
  );
}
