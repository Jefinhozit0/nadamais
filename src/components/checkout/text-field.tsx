"use client";

import type { ComponentProps } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
};

/** Campo de texto com rótulo + erro ligados por aria (atalho para os formulários do checkout). */
export function TextField({ label, error, hint, fieldClassName, ...input }: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} className={fieldClassName}>
      {(field) => <Input {...field} {...input} />}
    </Field>
  );
}
