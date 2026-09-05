import type { ErrorMessage } from "./type";

export function ErrorMessage({ message }: ErrorMessage) {
  return (
    <p className="text-red-500 font-medium text-[10px]" role="alert">
      {message}
    </p>
  );
}
