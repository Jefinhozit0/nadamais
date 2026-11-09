import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/checkout";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="px-4 pt-8 pb-8 md:px-8 md:pt-12">
      <h1 className="mb-8 font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.92] font-semibold tracking-[-0.035em]">
        <span className="text-grain">finalizar compra</span>
      </h1>
      <Checkout live={isMercadoPagoConfigured()} publicKey={process.env.NEXT_PUBLIC_MP_PUBLIC_KEY} />
    </div>
  );
}
