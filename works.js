import { boot, rv, galleryHTML, bindLightbox, movePill, ctaSection, initReveal } from "./site.js";
import { $, $$, esc, GALLERY_CATEGORIES, icon } from "./lib.js";

boot("trabalhos", (main, d) => {
  const filters = [{ slug: "todos", label: "Todos" }, ...GALLERY_CATEGORIES];
  const count = (slug) => slug === "todos" ? d.gallery.length : d.gallery.filter((g) => g.category === slug).length;
  let filter = "todos";
  const list = () => filter === "todos" ? d.gallery : d.gallery.filter((g) => g.category === filter);

  main.innerHTML = `<section class="page-head"><div class="container container-wide">
      <p ${rv()}><span class="eyebrow">Portefólio</span></p>
      <h1 class="display" ${rv("", .06)}>Os nossos <em>trabalhos</em></h1>
      <p class="lead" ${rv("", .12)}>Cada conjunto é pensado ao pormenor — da forma à cor, até ao último brilho.</p>
      <div class="filters" role="toolbar" aria-label="Filtrar trabalhos"><div class="tabs dark glass"><span class="tab-pill btn-primary"></span>
        ${filters.map((f) => `<button class="tab" data-f="${f.slug}" aria-pressed="${f.slug === filter}">${esc(f.label)}<span>${count(f.slug)}</span></button>`).join("")}</div></div>
      <div id="works"></div></div></section>${ctaSection(d.content.booking)}`;

  const tabs = $(".tabs", main), works = $("#works");
  const draw = () => {
    $$(".tab", tabs).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
    movePill(tabs);
    const items = list();
    works.innerHTML = items.length ? `<ul class="gallery">${galleryHTML(items)}</ul>` : `<div class="empty-card glass" style="max-width:28rem;margin:0 auto">${icon("imageOff", 34)}<h3>Em breve, novos trabalhos</h3><p>Ainda não há imagens nesta categoria. Veja as outras ou siga-nos no Instagram.</p></div>`;
  };
  tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { filter = b.dataset.f; draw(); } });
  addEventListener("resize", () => movePill(tabs));
  document.fonts?.ready.then(() => movePill(tabs));
  bindLightbox(works, list);
  draw();
});
