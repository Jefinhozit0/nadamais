"use client";

import { create } from "zustand";

/** Estado de interface da sacola (não persiste). */
export const useCartDrawer = create<{ open: boolean; setOpen: (open: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
