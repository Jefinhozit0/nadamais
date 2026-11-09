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
    // Desabilitado não deve parecer uma variante cinza: some o preenchimento, fica só o contorno suave
    "disabled:pointer-events-none disabled:border-line-soft disabled:bg-transparent disabled:text-mute-strong",
    "aria-busy:pointer-events-none aria-busy:cursor-progress",
    // Área de toque mínima de 44px mesmo nos tamanhos compactos
    "relative before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
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
        sm: "h-9 px-3.5 text-xs before:-inset-y-1",
        md: "h-10 px-5 text-[0.8125rem]",
        lg: "h-12 px-7 text-sm",
        icon: "size-11",
        "icon-sm": "size-9 before:-inset-1",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Mostra um indicador e bloqueia cliques repetidos (ex.: "processando pagamento"). */
    loading?: boolean;
  };

function Button({ className, variant, size, loading = false, children, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent"
        />
      )}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants, type ButtonProps };
