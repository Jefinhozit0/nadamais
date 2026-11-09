/**
 * Script inline (roda antes do primeiro paint e antes do React hidratar):
 * 1. aplica o tema salvo, ou o do sistema, sem flash;
 * 2. escuta cliques em qualquer [data-theme-toggle] por delegação no document —
 *    o botão funciona mesmo antes da hidratação (ex.: primeira compilação lenta no dev);
 * 3. segue o tema do sistema ao vivo enquanto o usuário não escolheu um manualmente.
 */
const script = `(function(){
var d=document.documentElement,k="theme",mq=window.matchMedia("(prefers-color-scheme: dark)");
function saved(){try{return localStorage.getItem(k)}catch(e){return null}}
function apply(dark){d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light"}
var s=saved();apply(s?s==="dark":mq.matches);
mq.addEventListener("change",function(e){if(!saved())apply(e.matches)});
document.addEventListener("click",function(e){
  var t=e.target&&e.target.closest&&e.target.closest("[data-theme-toggle]");if(!t)return;
  var dark=!d.classList.contains("dark");apply(dark);
  try{localStorage.setItem(k,dark?"dark":"light")}catch(e){}
});
})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
