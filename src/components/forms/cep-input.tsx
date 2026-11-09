"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { maskCep } from "@/lib/format";

type CepInputProps = Omit<ComponentProps<typeof Input>, "type" | "inputMode" | "maxLength" | "value" | "onChange"> & {
  defaultValue?: string;
  onValueChange?: (digits: string) => void;
};

/** CEP com máscara 00000-000. Entrega só os dígitos em `onValueChange`. */
export function CepInput({ defaultValue = "", onValueChange, ...props }: CepInputProps) {
  const [value, setValue] = useState(() => maskCep(defaultValue));

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="postal-code"
      maxLength={9}
      placeholder={props.placeholder ?? "00000-000"}
      value={value}
      onChange={(event) => {
        const masked = maskCep(event.target.value);
        setValue(masked);
        onValueChange?.(masked.replace("-", ""));
      }}
      className={props.className}
    />
  );
}
