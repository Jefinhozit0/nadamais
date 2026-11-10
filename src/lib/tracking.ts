/** Link público de rastreio dos Correios para um código (ex.: AA123456789BR). */
export function trackingUrl(code: string): string {
  return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(code)}`;
}
