/**
 * Dados estruturados (schema.org) para o Google.
 * O `<` é escapado para impedir que um texto de produto feche o <script> (XSS).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
