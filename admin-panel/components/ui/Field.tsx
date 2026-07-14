import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  const generatedId = useId();
  const control = isValidElement(children) ? (children as ReactElement<{ id?: string }>) : null;
  const controlId = control?.props.id ?? generatedId;
  const wiredControl = control ? cloneElement(control, { id: controlId }) : children;

  return (
    <div className="mb-4">
      <label htmlFor={controlId} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      {wiredControl}
      {hint && !error && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
