/**
 * Aplica o tema antes do primeiro paint (evita flash claro→escuro).
 * Ordem de prioridade: escolha salva em localStorage → preferência do sistema.
 */
const script = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
