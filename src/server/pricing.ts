import "server-only";
import { siteConfig } from "@/config/site";
import { products } from "@/data/products";
import type { CartItemInput, PaymentMethod, ShippingMethod } from "@/lib/checkout-schema";
import { quoteShipping, type ShippingOption } from "@/lib/shipping";

/**
 * Preço autoritativo do pedido. O navegador manda só {produto, tamanho, quantidade};
 * preço, estoque, frete e desconto são sempre recalculados aqui.
 */

export type PricedLine = {
  productId: string;
  slug: string;
  name: string;
  line: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string;
};

export type LineIssue = { productId: string; size: string; reason: "indisponivel" | "estoque"; available: number };

export type PricedCart = {
  lines: PricedLine[];
  issues: LineIssue[];
  subtotal: number;
};

export function priceCart(items: readonly CartItemInput[]): PricedCart {
  const lines: PricedLine[] = [];
  const issues: LineIssue[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    const size = product?.sizes.find((s) => s.label === item.size);
    if (!product || !size || size.stock === 0) {
      issues.push({ productId: item.productId, size: item.size, reason: "indisponivel", available: 0 });
      continue;
    }
    const quantity = Math.min(item.quantity, size.stock);
    if (quantity < item.quantity) {
      issues.push({ productId: item.productId, size: item.size, reason: "estoque", available: size.stock });
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      line: product.line,
      size: item.size,
      quantity,
      unitPrice: product.price,
      total: product.price * quantity,
      image: product.images[0]?.src,
    });
  }

  return { lines, issues, subtotal: lines.reduce((sum, l) => sum + l.total, 0) };
}

export function shippingFor(cep: string, cart: PricedCart): ShippingOption[] {
  const items = cart.lines.map((l) => ({
    category: products.find((p) => p.id === l.productId)!.category,
    quantity: l.quantity,
  }));
  return quoteShipping(cep, items, cart.subtotal);
}

export type OrderTotals = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

/** Desconto Pix incide só sobre os produtos, não sobre o frete. */
export function computeTotals(
  cart: PricedCart,
  shipping: ShippingOption,
  payment: PaymentMethod,
): OrderTotals {
  const discount = payment === "pix" ? Math.round(cart.subtotal * siteConfig.pixDiscount) : 0;
  return {
    subtotal: cart.subtotal,
    shipping: shipping.price,
    discount,
    total: cart.subtotal - discount + shipping.price,
  };
}

export function pickShipping(options: ShippingOption[], method: ShippingMethod): ShippingOption {
  return options.find((o) => o.method === method) ?? options[0]!;
}
