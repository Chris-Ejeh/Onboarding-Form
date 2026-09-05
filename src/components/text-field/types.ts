import type { ComponentPropsWithoutRef } from "react";

export type InputProps = ComponentPropsWithoutRef<"input">;

export interface TextFieldProps extends InputProps {
  label?: string;
  errorMessage?: string;
}
