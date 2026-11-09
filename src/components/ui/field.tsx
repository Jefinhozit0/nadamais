import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldRenderProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldProps = {
  label: string;
  /** Dica exibida abaixo do campo quando não há erro. */
  hint?: string;
  /** Mensagem de erro: diga o problema e como resolver. */
  error?: string;
  className?: string;
  children: (props: FieldRenderProps) => ReactNode;
};

/** Rótulo + campo + dica/erro, com ids e aria ligados automaticamente. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error ?? hint;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": message ? messageId : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {message && (
        <p id={messageId} className={cn("text-xs", error ? "text-drop" : "text-mute-strong")}>
          {message}
        </p>
      )}
    </div>
  );
}
