"use client";

import { create } from "zustand";

type WishlistState = {
  status: "idle" | "loading" | "ready";
  authenticated: boolean;
  ids: Set<string>;
  load: () => Promise<void>;
  set: (productId: string, saved: boolean) => void;
};

/** Favoritos do usuário (carregados uma vez por sessão de navegação). */
export const useWishlist = create<WishlistState>()((set, get) => ({
  status: "idle",
  authenticated: false,
  ids: new Set(),
  load: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const res = await fetch("/api/conta/favoritos", { cache: "no-store" });
      const data = (await res.json()) as { authenticated: boolean; ids: string[] };
      set({ status: "ready", authenticated: data.authenticated, ids: new Set(data.ids) });
    } catch {
      set({ status: "ready" });
    }
  },
  set: (productId, saved) =>
    set((state) => {
      const ids = new Set(state.ids);
      if (saved) ids.add(productId);
      else ids.delete(productId);
      return { ids };
    }),
}));
