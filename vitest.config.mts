import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: path.join(root, "src/$1") },
      // "server-only" lança fora do runtime do React Server; nos testes vira um módulo vazio
      { find: /^server-only$/, replacement: path.join(root, "tests/stubs/empty.ts") },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
