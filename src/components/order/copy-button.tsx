"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={copied ? "solid" : "outline"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2400);
        } catch {
          // sem permissão de clipboard: o código continua visível para copiar à mão
        }
      }}
    >
      {copied ? <Check strokeWidth={1.5} aria-hidden="true" /> : <Copy strokeWidth={1.5} aria-hidden="true" />}
      {copied ? "copiado" : label}
      <span role="status" className="sr-only">
        {copied ? "Código copiado." : ""}
      </span>
    </Button>
  );
}
