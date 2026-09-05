import type { ErrorMessageProps } from "./type";

export function ErrorMessage({ message, id }: ErrorMessageProps) {
  return (
    <p className="text-red-500 font-medium text-[10px]" id={id} role="alert">
      {message}
    </p>
  );
}
