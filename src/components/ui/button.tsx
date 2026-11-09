import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * Botões do design system: sempre em pill, rótulo minúsculo, borda de 1px.
 * - solid:   ação principal (adicionar à sacola, finalizar)
 * - outline: chamada secundária, inverte no hover (assinatura da referência)
 * - accent:  uso raro — drops e urgência
 * - ghost:   ícones e ações terciárias
 * - link:    texto sublinhado no hover
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border font-sans lowercase whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,transform] duration-200 ease-out-expo",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
    "active:not-aria-[haspopup]:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        solid: "border-ink bg-ink text-canvas hover:bg-ink-soft hover:border-ink-soft",
        outline: "border-ink bg-transparent text-ink hover:bg-ink hover:text-canvas",
        accent: "border-drop bg-drop text-canvas hover:bg-transparent hover:text-drop",
        ghost: "border-transparent bg-transparent text-ink hover:bg-haze",
        link: "h-auto border-transparent bg-transparent px-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5 text-[0.8125rem]",
        lg: "h-12 px-7 text-sm",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
