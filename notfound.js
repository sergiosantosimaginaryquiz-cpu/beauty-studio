import { boot } from "./site.js";
import { nailArt } from "./lib.js";
boot("404", (main) => {
  main.innerHTML = `<section class="state"><div style="text-align:center">
    <div style="width:176px;height:224px;margin:0 auto;border-radius:999px;overflow:hidden;box-shadow:0 30px 60px rgba(80,60,50,.15)">${nailArt({ seed: "404", category: "francesinhas" })}</div>
    <p class="eyebrow center" style="margin-top:40px">Erro 404</p>
    <h1 class="display" style="font-size:clamp(2.6rem,6vw,3.75rem);margin-top:12px">Esta página não existe.</h1>
    <p class="muted" style="margin-top:16px">Mas há muitos detalhes bonitos à sua espera.</p>
    <a href="index.html" class="btn btn-primary" style="margin-top:32px">Voltar ao início</a></div></section>`;
});
