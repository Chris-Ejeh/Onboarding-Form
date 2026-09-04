interface TextFieldProps {
  label: string;
  name: string;
  type: React.HTMLInputTypeAttribute;
  error?: boolean;
}

export function TextField({ name, label, type, error }: TextFieldProps) {
  return (
    <div>
      <label className="text-sm block mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        className="border border-neutral-200 rounded-lg p-2 w-full aria-invalid:border-red-500 aria-invalid:bg-red-50"
        type={type}
        id={name}
        name={name}
        aria-invalid={error}
      ></input>
      {error && (
        <p className="text-red-500 font-medium text-[10px]">Invalid {label}</p>
      )}
    </div>
  );
}
