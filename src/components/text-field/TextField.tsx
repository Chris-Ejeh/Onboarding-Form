import { ErrorMessage } from "@/components/error-message/ErrorMessage";
import type { TextFieldProps } from "./types";

export function TextField({ label, errorMessage, ...props }: TextFieldProps) {
  const errorId = `${props.name}-error`;

  return (
    <div>
      <label className="text-sm block mb-1" htmlFor={props.name}>
        {label}
      </label>

      <input
        className="border border-neutral-200 rounded-lg p-2 w-full aria-invalid:border-red-500 aria-invalid:bg-red-50"
        id={props.name}
        data-test="InputText"
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : undefined}
        {...props}
      ></input>

      {!!errorMessage && <ErrorMessage id={errorId} message={errorMessage} />}
    </div>
  );
}
