import { ErrorMessage } from "@/components/error-message/ErrorMessage";
import type { InputProps } from "./types";

interface TextFieldProps extends InputProps {
  label?: string;
  errorMessage?: string;
}
export function TextField({ label, errorMessage, ...props }: TextFieldProps) {
  return (
    <div>
      <label className="text-sm block mb-1" htmlFor={props.name}>
        {label}
      </label>

      <input
        className="border border-neutral-200 rounded-lg p-2 w-full aria-invalid:border-red-500 aria-invalid:bg-red-50"
        id={props.name}
        aria-invalid={errorMessage ? "true" : "false"}
        {...props}
      ></input>

      {!!errorMessage && <ErrorMessage message={errorMessage} />}
    </div>
  );
}
