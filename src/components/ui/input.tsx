import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "cn";

/**
 * Campo do design system: 44px de altura, borda suave em repouso,
 * contorno de 2px em ink no foco, borda drop quando aria-invalid.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-line-soft bg-transparent px-4 text-base text-ink transition-colors outline-none md:text-sm",
        "placeholder:text-mute-strong hover:border-ink-soft",
        "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        "aria-invalid:border-drop aria-invalid:focus-visible:outline-drop",
        "disabled:pointer-events-none disabled:bg-haze/50 disabled:text-mute-strong",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
