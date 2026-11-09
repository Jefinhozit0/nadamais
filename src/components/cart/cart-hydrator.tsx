"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

/** Carrega a sacola salva no navegador depois da hidratação (montado uma vez no layout). */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return null;
}
