/**
 * Registra na Paymento o endereço que recebe as confirmações de pagamento (IPN).
 *   pnpm paymento:setup                          → usa NEXT_PUBLIC_SITE_URL
 *   pnpm paymento:setup https://sualoja.com.br   → domínio explícito
 * Rode de novo sempre que o domínio mudar. Lê PAYMENTO_API_KEY do .env.local.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const apiKey = process.env.PAYMENTO_API_KEY;
const apiUrl = (process.env.PAYMENTO_API_URL ?? "https://api.paymento.io").replace(/\/$/, "");
const site = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

if (!apiKey) {
  console.error("Defina PAYMENTO_API_KEY no .env.local (painel da Paymento › API keys).");
  process.exit(1);
}
if (!site.startsWith("https://")) {
  console.error(`A Paymento precisa de um endereço https público. Recebido: "${site || "(vazio)"}".`);
  console.error("Use: pnpm paymento:setup https://seu-dominio");
  process.exit(1);
}

const ipnUrl = `${site}/api/webhooks/paymento`;
const headers = { "Api-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" };

const res = await fetch(`${apiUrl}/v1/payment/settings`, {
  method: "POST",
  headers,
  body: JSON.stringify({ ipN_URL: ipnUrl, ipN_Method: 1 }),
});
const data = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;

if (!res.ok || !data?.success) {
  console.error(`Falhou (HTTP ${res.status}): ${data?.message ?? "sem detalhes"}`);
  process.exit(1);
}

const check = await fetch(`${apiUrl}/v1/payment/settings`, { headers });
console.log(`IPN configurado: ${ipnUrl} (POST)`);
console.log("Configuração atual na Paymento:", JSON.stringify(await check.json().catch(() => null)));
