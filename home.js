import { boot, DATA, rv, ctaSection as cta, waButton, serviceCard, movePill, galleryHTML, bindLightbox, promoCard, hoursList, fullAddress, initReveal } from "./site.js";
import { $, $$, esc, extra, media, polishBottle, nailArt, icon, hhmm, shortDate, toISODate } from "./lib.js";

boot("home", (main, d) => {
  const c = d.content;
  main.innerHTML = [hero(c.hero), statement(), services(), featured(), about(c.about), promotions(c.promotions), studio(c.studio), instagram(c.instagram), cta(c.booking)].join("");
  initHero();
  initServices();
  const g = $("#featured-gallery");
  if (g) bindLightbox(g, () => featuredItems());
});

/* ---------------- Hero ---------------- */
function hero(b) {
  const title = b?.title ?? "A beleza está nos detalhes.";
  const words = title.split(" ");
  const tagline = extra(b, "tagline", "Manicure • Nail Art • Cuidados");
  const name = DATA.settings.business_name.replace(/^Beauty Studio\s*/i, "");
  return `<section class="hero" aria-labelledby="hero-title">
    <div class="hero-bg" aria-hidden="true"><span></span><span></span></div>
    <div class="hero-grid">
      <div class="hero-text" data-par-text>
        <p class="eyebrow fade-up" style="--d:.1s">${esc(tagline)}</p>
        <h1 id="hero-title" class="display">${words.map((w, i) => `<span class="w"><span class="${i === words.length - 1 ? "accent" : ""}" style="--d:${.2 + i * .08}s">${esc(w)}&nbsp;</span></span>`).join("")}</h1>
        <p class="sub fade-up" style="--d:.65s">${esc(b?.subtitle ?? "Manicure, nail art e cuidados personalizados para realçar a sua beleza.")}</p>
        <div class="btn-row fade-up" style="--d:.8s">
          <a href="marcacao.html" class="btn btn-primary btn-lg">${esc(b?.cta_text ?? "Marcar sessão")} ${icon("arrowRight")}</a>
          <a href="trabalhos.html" class="btn btn-secondary btn-lg">${esc(extra(b, "secondary_cta", "Ver trabalhos"))}</a>
        </div>
        <div class="assure fade-up" style="--d:1.2s"><div class="bottles">${["#DCB8AE", "#C98F98", "#EDE3DA", "#B89B68"].map((c) => polishBottle(c, 16)).join("")}</div>Material esterilizado · Produtos profissionais · Atendimento personalizado</div>
      </div>
      <div class="hero-visual">
        <div class="hero-photo" data-cursor="view">
          <div class="layer" data-par-img><div class="kenburns">${media(b?.image_url, { alt: "Unhas cuidadas em tons nude no Beauty Studio Cátia Gonçalves", seed: "hero", category: "francesinhas", eager: true })}</div></div>
        </div>
        <div class="float float-brand" data-depth="14"><div class="glass" style="--d:1s"><small>✦ Beauty Studio</small><strong>${esc(name)}</strong></div></div>
        <div class="float float-tag" data-depth="-22"><div class="glass" style="--d:1.2s"><span class="clay">${polishBottle("#C98F98", 12)}</span>${esc(tagline)}</div></div>
        <div class="float float-sphere" data-depth="30" aria-hidden="true"></div>
        <div class="float float-bottle" data-depth="-10" aria-hidden="true"><div style="--d:1.45s">${polishBottle("#DCB8AE", 46)}</div></div>
        <div class="float float-pearl" data-depth="-22" aria-hidden="true"></div>
        <svg class="float float-line" viewBox="0 0 400 120" fill="none" aria-hidden="true"><path d="M0 100 C 120 10, 260 140, 400 20" stroke="#B89B68" stroke-linecap="round"/></svg>
      </div>
    </div></section>`;
}

/** Paralaxe: rato (desktop) + scroll; desativado com movimento reduzido. */
function initHero() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const floats = $$("[data-depth]"), img = $("[data-par-img]"), text = $("[data-par-text]"), heroEl = $(".hero");
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", (e) => { mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  (function loop() {
    tx += (mx - tx) * .06; ty += (my - ty) * .06;
    const p = Math.min(1, Math.max(0, scrollY / heroEl.offsetHeight));
    floats.forEach((f) => { const k = Number(f.dataset.depth); f.style.translate = `${tx * k}px ${ty * k}px`; });
    if (p < 1) {
      img.style.transform = `translateY(${p * 80}px) scale(${1.04 + p * .12})`;
      if (innerWidth >= 1024) { text.style.transform = `translateY(${-p * 60}px)`; text.style.opacity = String(1 - p * 1.25); }
    }
    requestAnimationFrame(loop);
  })();
}

const statement = () => `<section class="statement" aria-label="A nossa promessa"><div ${rv("blur")}>
  <div class="gold-line"></div><p class="display">Cuidado profissional, técnicas personalizadas e um espaço <em>pensado para si.</em></p></div></section>`;

/* ---------------- Serviços ---------------- */
let activeTab = null;
function services() {
  return `<section id="servicos" class="section" aria-labelledby="services-title"><div class="container services-grid">
    <div class="services-aside">
      <p ${rv()}><span class="eyebrow">Serviços</span></p>
      <h2 id="services-title" class="display h-section" ${rv("", .08)}>O menu do estúdio</h2>
      <p class="lead" data-reveal="" style="margin-top:20px;--d:.16s">Cada serviço inclui preparação cuidada, material esterilizado e produtos profissionais.</p>
      ${waButton("Tenho uma dúvida", { message: "Olá! Tenho uma dúvida sobre os vossos serviços.", context: "Serviços: dúvida" })}
    </div>
    <div style="min-width:0" id="svc-root"></div></div></section>`;
}
function initServices() {
  const root = $("#svc-root");
  const { services: list, categories } = DATA;
  if (!list.length) { root.innerHTML = `<div class="empty-card glass"><h3>Menu em atualização</h3><p>Fale connosco pelo WhatsApp para saber todos os serviços disponíveis.</p></div>`; return; }
  const cats = categories.filter((c) => list.some((s) => s.category_id === c.id));
  const featured = list.filter((s) => s.featured);
  const tabs = [...(featured.length ? [{ id: "destaques", name: "Destaques" }] : []), ...cats.map((c) => ({ id: c.id, name: c.name }))];
  activeTab = tabs[0].id;
  root.innerHTML = `<div class="tabs-scroll"><div class="tabs glass-soft" role="tablist" aria-label="Categorias de serviços"><span class="tab-pill clay"></span>
    ${tabs.map((t) => `<button class="tab" role="tab" data-tab="${t.id}" aria-selected="${t.id === activeTab}">${esc(t.name)}</button>`).join("")}</div></div>
    <p class="cat-desc" aria-live="polite"></p><div class="cards"></div>`;
  const tabsEl = $(".tabs", root);
  const draw = () => {
    $$(".tab", root).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === activeTab)));
    movePill(tabsEl);
    $(".cat-desc", root).textContent = cats.find((c) => c.id === activeTab)?.description ?? "";
    const items = activeTab === "destaques" ? featured : list.filter((s) => s.category_id === activeTab);
    $(".cards", root).innerHTML = items.map(serviceCard).join("");
  };
  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { activeTab = b.dataset.tab; draw(); } });
  addEventListener("resize", () => movePill(tabsEl));
  document.fonts?.ready.then(() => movePill(tabsEl));
  draw();
}

/* ---------------- Trabalhos em destaque ---------------- */
const featuredItems = () => [...DATA.gallery.filter((g) => g.featured), ...DATA.gallery.filter((g) => !g.featured)].slice(0, 8);
function featured() {
  const items = featuredItems();
  if (!items.length) return "";
  return `<section class="section" aria-labelledby="work-title"><div class="container container-wide">
    <div class="studio-head" style="margin-bottom:40px">
      <div><p ${rv()}><span class="eyebrow">Trabalhos</span></p><h2 id="work-title" class="display h-section" ${rv("", .08)}>Detalhes que falam por si</h2></div>
      <div ${rv("", .1)}><a href="trabalhos.html" class="btn btn-secondary">Ver todos os trabalhos ${icon("arrowRight", 17)}</a></div>
    </div>
    <ul class="gallery" id="featured-gallery">${galleryHTML(items)}</ul></div></section>`;
}

/* ---------------- Sobre ---------------- */
function about(b) {
  if (!b) return "";
  const stats = extra(b, "stats", []), philo = extra(b, "philosophy", "");
  const [l1, ...rest] = (b.title ?? "").split(". ");
  return `<section id="sobre" class="section" aria-labelledby="about-title"><div class="container about-grid">
    <div class="about-visual reveal scale">
      <div class="frame" data-cursor="view">${media(b.image_url, { alt: "Cátia Gonçalves no estúdio", seed: "about-catia", category: "nail-art" })}</div>
      <div class="ring" aria-hidden="true"></div>
      ${philo ? `<div class="philo glass"><p class="eyebrow center">A nossa filosofia</p><p>“${esc(philo)}”</p></div>` : ""}
    </div>
    <div class="about-text" style="margin-top:24px">
      <p ${rv()}><span class="eyebrow">Sobre</span></p>
      <h2 id="about-title" class="display" ${rv("", .08)}>${esc(l1)}${rest.length ? "." : ""}<br><em>${esc(rest.join(". "))}</em></h2>
      ${b.subtitle ? `<p class="intro" ${rv("", .14)}>${esc(b.subtitle)}</p>` : ""}
      ${b.body ? `<p class="bio" ${rv("", .18)}>${esc(b.body)}</p>` : ""}
      ${stats.length ? `<dl class="stats" ${rv("", .24)}>${stats.map((s) => `<div class="clay"><dt class="sr-only">${esc(s.label)}</dt><dd class="v">${esc(s.value)}</dd><dd class="l">${esc(s.label)}</dd></div>`).join("")}</dl>` : ""}
      ${b.cta_text ? `<div ${rv("", .3)}><a href="#estudio" class="btn btn-secondary">${esc(b.cta_text)}</a></div>` : ""}
    </div></div></section>`;
}

/* ---------------- Promoções ---------------- */
function promotions(b) {
  const list = DATA.promotions;
  return `<section id="promocoes" class="section" aria-labelledby="promo-title"><div class="container">
    <p ${rv()}><span class="eyebrow">Promoções</span></p>
    <h2 id="promo-title" class="display h-section" ${rv("", .06)}>${esc(b?.title ?? "Momentos especiais")}</h2>
    <div class="promos">${list.length ? list.map((p, i) => `<div ${rv("scale", i * .08)}>${promoCard(p, i === 0)}</div>`).join("") : `
      <div class="empty-card glass reveal scale"><div class="gold-line"></div>${icon("sparkles", 30)}
        <h3>${esc(b?.subtitle ?? "Sem promoções neste momento")}</h3><p>${esc(b?.body ?? "Mas temos sempre algo especial preparado para si.")}</p>
        ${waButton("Avisem-me das novidades", { message: "Olá! Gostaria de saber se há novidades ou promoções em breve.", context: "Promoções: sem promoções" })}</div>`}
    </div></div></section>`;
}

/* ---------------- Estúdio ---------------- */
function studio(b) {
  const s = DATA.settings, addr = fullAddress(s);
  const embed = s.google_maps_embed || (addr ? `https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed` : "");
  const imgs = [b?.image_url ?? null, ...extra(b, "images", [])].slice(0, 3); while (imgs.length < 3) imgs.push(null);
  const today = toISODate(new Date());
  const upcoming = DATA.blocked.filter((x) => (x.end_date ?? x.date) >= today).slice(0, 3);
  return `<section id="estudio" class="section" aria-labelledby="studio-title"><div class="container">
    <div class="studio-head"><div><p ${rv()}><span class="eyebrow">O estúdio</span></p><h2 id="studio-title" class="display h-section" ${rv("", .06)}>${esc(b?.title ?? "Um espaço pensado para si.")}</h2></div>
      ${b?.subtitle ? `<p class="lead" ${rv("", .1)}>${esc(b.subtitle)}</p>` : ""}</div>
    <div class="studio-photos">${imgs.map((src, i) => `<div ${rv("scale", i * .08)}><div class="frame" data-cursor="view">${media(src, { alt: `Interior do estúdio ${i + 1}`, seed: `studio-${i}`, category: ["gel", "manicure", "verniz-gel"][i], aspect: i === 0 ? "landscape" : "portrait" })}</div></div>`).join("")}</div>
    <div class="map-box reveal">
      ${embed ? `<iframe title="Mapa com a localização do estúdio" src="${esc(embed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ""}
      <div class="map-card-wrap"><div class="map-card glass">
        <div><p class="eyebrow plain">Visite-nos</p><h3>${esc(s.business_name)}</h3></div>
        ${addr ? `<p class="info-line">${icon("mapPin")}<span>${esc(s.address ?? "")}<br>${esc(s.address_line2 ?? "")}${s.city ? `, ${esc(s.city)}` : ""}</span></p>` : ""}
        ${s.parking_info ? `<p class="info-line" style="font-size:.875rem">${icon("car")}<span>${esc(s.parking_info)}</span></p>` : ""}
        <div><p style="font-size:.875rem;font-weight:600;margin-bottom:12px">Horário</p>${hoursList(DATA.availability)}</div>
        ${upcoming.length ? `<div class="specials"><p>Dias especiais</p>${upcoming.map((x) => `<p><span>${shortDate(x.date)}${x.end_date && x.end_date !== x.date ? ` – ${shortDate(x.end_date)}` : ""}</span><span>${x.kind === "special" ? `${hhmm(x.start_time)}–${hhmm(x.end_time)}` : esc(x.reason || "Encerrado")}</span></p>`).join("")}</div>` : ""}
        <div class="btn-row" style="gap:8px">
          ${s.google_maps_url ? `<a href="${esc(s.google_maps_url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">${icon("navigation", 15)}${esc(b?.cta_text ?? "Como chegar")}</a>` : ""}
          ${s.phone ? `<a href="tel:${esc(s.phone.replace(/\s/g, ""))}" class="btn btn-secondary btn-sm">${icon("phone", 15)}Ligar</a>` : ""}
          ${waButton("Tenho uma dúvida", { message: "Olá! Tenho uma dúvida.", context: "Estúdio: dúvida", cls: "btn btn-secondary btn-sm" })}
        </div></div></div>
    </div></div></section>`;
}

/* ---------------- Instagram ---------------- */
function instagram(b) {
  const s = DATA.settings, posts = DATA.instagram.slice(0, 6);
  if (!posts.length && !s.instagram) return "";
  const link = s.instagram ?? "#";
  return `<section class="section" aria-labelledby="ig-title"><div class="container" style="text-align:center">
    <p ${rv()}><span class="eyebrow center">Instagram</span></p>
    <h2 id="ig-title" class="display h-section" ${rv("", .06)}>${esc(b?.title ?? "Siga o nosso trabalho")}</h2>
    ${b?.subtitle ? `<p class="lead" data-reveal="" style="margin:16px auto 0;--d:.1s">${esc(b.subtitle)}</p>` : ""}
    <ul class="ig-grid">${posts.map((p, i) => `<li ${rv("scale", i * .05)}><a href="${esc(p.permalink || link)}" target="_blank" rel="noopener noreferrer" data-cursor="view" aria-label="${esc(p.caption ?? "Publicação no Instagram")}">
      <span class="zoom">${media(p.image_url, { alt: p.caption ?? "Publicação no Instagram", seed: `ig-${p.id}`, aspect: "square" })}</span></a></li>`).join("")}</ul>
    <div style="margin-top:64px"><a href="${esc(link)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">${icon("instagram")}${esc(b?.cta_text ?? "@beautystudiocatia")}</a></div>
  </div></section>`;
}

