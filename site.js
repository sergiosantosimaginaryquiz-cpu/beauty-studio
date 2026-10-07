/* ============================================================
   Estrutura comum do site público + componentes reutilizáveis
   ============================================================ */
import { getSiteData, isConfigured, trackLead } from "./db.js";
import {
  $, $$, esc, euro, fmtDuration, hhmm, shortDate, toISODate, galleryLabel, hoursByDay,
  media, polishBottle, nailArt, icon, WA_ICON, waLink, waMessages,
} from "./lib.js";

export let DATA = null;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Navegação ---------------- */
const NAV = [
  { href: "index.html", label: "Início", icon: "home", key: "home" },
  { href: "index.html#servicos", label: "Serviços", icon: "sparkles", key: "servicos" },
  { href: "trabalhos.html", label: "Trabalhos", icon: "images", key: "trabalhos" },
  { href: "index.html#sobre", label: "Sobre", icon: "heart", key: "sobre" },
  { href: "marcacao.html", label: "Marcação", icon: "calendar", key: "marcacao" },
];

const logo = () => `<a href="index.html" class="logo" aria-label="Beauty Studio Cátia Gonçalves — início" data-cursor="hover">
  <small><span>✦</span> Beauty Studio</small><strong>Cátia Gonçalves</strong></a>`;

function renderNav(page) {
  const header = document.createElement("header");
  header.className = "nav-wrap";
  header.innerHTML = `<nav class="nav" aria-label="Principal">${logo()}
    <div class="nav-links">
      <a href="index.html#servicos">Serviços</a>
      <a href="trabalhos.html" ${page === "trabalhos" ? 'aria-current="page"' : ""}>Trabalhos</a>
      <a href="index.html#sobre">Sobre</a>
      <a href="index.html#estudio">Estúdio</a>
    </div>
    <a href="marcacao.html" class="btn btn-primary btn-sm nav-cta">Marcar sessão</a></nav>`;
  document.body.prepend(header);
  const nav = $(".nav", header);
  const on = () => nav.classList.toggle("scrolled", scrollY > 24);
  on(); addEventListener("scroll", on, { passive: true });

  if (page !== "marcacao") {
    const dock = document.createElement("nav");
    dock.className = "dock"; dock.setAttribute("aria-label", "Navegação móvel");
    dock.innerHTML = `<ul class="glass">${NAV.map((n) => n.key === "marcacao"
      ? `<li class="book"><a href="${n.href}" class="btn-primary">${icon(n.icon, 17)}Marcar</a></li>`
      : `<li><a href="${n.href}" ${n.key === page ? 'aria-current="page"' : ""}>${icon(n.icon, 19)}${n.label}</a></li>`).join("")}</ul>`;
    document.body.append(dock);
  }
  const skip = document.createElement("a");
  skip.className = "skip"; skip.href = "#main"; skip.textContent = "Saltar para o conteúdo";
  document.body.prepend(skip);
}

/* ---------------- WhatsApp ---------------- */
/** Botão/link de WhatsApp com mensagem contextual (o clique fica registado no painel). */
export function waButton(label, { message, context, cls = "btn btn-secondary", plain = false } = {}) {
  if (!DATA.settings.whatsapp) return "";
  return `<a href="${esc(waLink(DATA.settings, message))}" target="_blank" rel="noopener noreferrer" class="${cls}"
    data-wa="${esc(context)}" data-wa-msg="${esc(message ?? "")}" data-cursor="hover">${plain ? "" : `<span class="wa">${WA_ICON(18)}</span>`}<span>${esc(label)}</span></a>`;
}

function renderWaFloat(page) {
  if (!DATA.settings.whatsapp) return;
  const a = document.createElement("a");
  a.className = `wa-float${page === "marcacao" ? " no-dock" : ""}`;
  a.href = waLink(DATA.settings); a.target = "_blank"; a.rel = "noopener noreferrer";
  a.dataset.wa = "Botão flutuante"; a.dataset.cursor = "hover";
  a.setAttribute("aria-label", "Contactar o Beauty Studio através do WhatsApp");
  a.innerHTML = `<div class="pill glass"><span class="label"><span><b>Fale connosco no WhatsApp</b><i>Resposta rápida</i></span></span><span class="orb">${WA_ICON(26)}</span></div>`;
  document.body.append(a);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-wa]");
  if (a) trackLead(a.dataset.wa, a.dataset.waMsg || undefined);
});

/* ---------------- Cursor premium ---------------- */
function initCursor() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || reduceMotion) return;
  const c = document.createElement("div");
  c.className = "cursor"; c.setAttribute("aria-hidden", "true"); c.innerHTML = '<div class="dot">VER</div>';
  document.body.append(c);
  document.documentElement.classList.add("has-cursor");
  let x = -100, y = -100, cx = x, cy = y;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    const el = e.target.closest?.("[data-cursor], a, button, input, textarea, select, label");
    c.classList.toggle("view", el?.dataset.cursor === "view");
    c.classList.toggle("hover", !!el && el.dataset.cursor !== "view");
  }, { passive: true });
  addEventListener("pointerdown", () => c.classList.add("down"));
  addEventListener("pointerup", () => c.classList.remove("down"));
  (function loop() { cx += (x - cx) * .25; cy += (y - cy) * .25; c.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();
}

/* ---------------- Revelação ao scroll ---------------- */
export function initReveal(root = document) {
  $$("[data-reveal]", root).forEach((e) => { e.classList.add("reveal"); if (e.dataset.reveal) e.classList.add(e.dataset.reveal); e.removeAttribute("data-reveal"); });
  const els = $$(".reveal:not(.in)", root);
  if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach((e) => io.observe(e));
}
export const rv = (kind = "", d = 0) => `data-reveal="${kind}" style="--d:${d}s"`;

/* ---------------- Rodapé ---------------- */
export const fullAddress = (s) => [s.address, s.address_line2, [s.postal_code, s.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

export function hoursList(availability) {
  const today = new Date().getDay();
  return `<ul class="hours">${hoursByDay(availability).map((d) => `<li class="${d.dow === today ? "today" : ""}"><span>${d.day}</span><span class="t">${d.ranges.length ? d.ranges.join(" · ") : "Encerrado"}</span></li>`).join("")}</ul>`;
}

const TIKTOK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.6c.27 0 .53.04.77.12V9.77a5.7 5.7 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z"/></svg>';

function renderFooter() {
  const s = DATA.settings;
  const socials = [[s.instagram, "Instagram", icon("instagram")], [s.facebook, "Facebook", icon("facebook")], [s.tiktok, "TikTok", TIKTOK]].filter(([u]) => u);
  const f = document.createElement("footer");
  f.className = "footer";
  f.innerHTML = `<div class="container"><div class="footer-grid">
    <div>${logo()}<p class="about">Manicure, verniz gel, unhas de gel e nail art — com cuidado, precisão e atenção a cada detalhe.</p>
      <div class="socials">${socials.map(([u, l, i]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" aria-label="${l}" class="clay">${i}</a>`).join("")}</div></div>
    <nav aria-label="Rodapé"><h4>Navegação</h4><ul class="links">${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}<li><a href="index.html#estudio">Estúdio</a></li></ul></nav>
    <div><h4>Contactos</h4><ul class="links contact">
      ${fullAddress(s) ? `<li>${icon("mapPin", 16)}<span>${esc(fullAddress(s))}</span></li>` : ""}
      ${s.phone ? `<li><a href="tel:${esc(s.phone.replace(/\s/g, ""))}" style="display:flex;gap:10px">${icon("phone", 16)}${esc(s.phone)}</a></li>` : ""}
      ${s.email ? `<li><a href="mailto:${esc(s.email)}" style="display:flex;gap:10px">${icon("mail", 16)}${esc(s.email)}</a></li>` : ""}
      <li>${waButton("Falar pelo WhatsApp", { context: "Rodapé", cls: "wa-link", plain: true })}</li></ul></div>
    <div><h4>Horário</h4>${hoursList(DATA.availability)}</div>
  </div>
  <div class="footer-bottom"><p>© ${new Date().getFullYear()} ${esc(s.business_name)}</p><p>Feito com cuidado em Portugal.</p></div></div>`;
  document.body.append(f);
}

/* ---------------- SEO: dados estruturados ---------------- */
function injectJsonLd() {
  const s = DATA.settings;
  const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const prices = DATA.services.map((x) => x.promo_price ?? x.price);
  const ld = {
    "@context": "https://schema.org", "@type": ["BeautySalon", "LocalBusiness"], name: s.business_name,
    url: location.origin + location.pathname.replace(/[^/]*$/, ""), telephone: s.phone ?? undefined, email: s.email ?? undefined,
    priceRange: prices.length ? `€${Math.min(...prices)}–€${Math.max(...prices)}` : "€€",
    address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.address_line2 ?? s.city, addressRegion: s.city, postalCode: s.postal_code, addressCountry: "PT" },
    hasMap: s.google_maps_url ?? undefined, sameAs: [s.instagram, s.facebook, s.tiktok].filter(Boolean),
    openingHoursSpecification: DATA.availability.filter((a) => a.active).map((a) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY[a.day_of_week]}`, opens: hhmm(a.start_time), closes: hhmm(a.end_time) })),
    hasOfferCatalog: { "@type": "OfferCatalog", name: "Serviços", itemListElement: DATA.services.map((x) => ({ "@type": "Offer", price: x.promo_price ?? x.price, priceCurrency: "EUR", itemOffered: { "@type": "Service", name: x.name, description: x.description ?? undefined } })) },
  };
  const el = document.createElement("script"); el.type = "application/ld+json"; el.textContent = JSON.stringify(ld);
  document.head.append(el);
}

/* ---------------- Arranque de cada página ---------------- */
export async function boot(page, render) {
  const main = $("#main");
  try {
    DATA = await getSiteData();
  } catch (e) {
    console.error(e);
    DATA = (await import("./db.js")).demoData;
    renderNav(page);
    main.innerHTML = errorState();
    renderFooter(); renderWaFloat(page);
    return;
  }
  renderNav(page);
  render(main, DATA);
  renderFooter();
  renderWaFloat(page);
  injectJsonLd();
  initCursor();
  initReveal();
  if (!isConfigured) {
    const b = document.createElement("div");
    b.className = "demo-banner glass"; b.textContent = "Modo de demonstração";
    b.title = "Configure o Supabase em config.js";
    document.body.append(b);
  }
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
}

export const errorState = () => `<section class="state"><div class="state-card glass">
  <p class="eyebrow center">Ups</p><h1>Algo não correu como esperado.</h1>
  <p>Tente novamente ou contacte-nos através do WhatsApp.</p>
  <div class="btn-row"><button class="btn btn-primary" onclick="location.reload()">${icon("rotate", 17)}Tentar novamente</button>${waButton("Falar connosco", { context: "Página de erro" })}</div></div></section>`;

/* ============================================================
   Componentes
   ============================================================ */
const BOTTLES = ["#DCB8AE", "#C98F98", "#E7D3D3", "#D7C2A3", "#B97F86", "#EDE3DA"];

export function serviceCard(s, i) {
  const promo = s.promo_price != null && s.promo_price < s.price;
  const msg = waMessages.availability(s.name);
  return `<article class="svc-card clay card-in" style="--d:${i * .05}s">
    ${promo || s.featured ? `<span class="badge ${promo ? "promo" : ""}">${esc(promo ? (s.promo_label || "Promoção") : "Destaque")}</span>` : ""}
    <div class="svc-title">${polishBottle(BOTTLES[i % BOTTLES.length], 15)}<h3>${esc(s.name)}</h3></div>
    ${s.description ? `<p class="desc">${esc(s.description)}</p>` : ""}
    <div class="svc-foot">
      <div><div><span class="price">${euro(promo ? s.promo_price : s.price)}</span>${promo ? `<span class="price-old">${euro(s.price)}</span>` : ""}</div>
        <p class="dur">${icon("clock", 13)}${fmtDuration(s.duration)}</p></div>
      <div class="svc-actions">
        ${DATA.settings.whatsapp ? `<a href="${esc(waLink(DATA.settings, msg))}" target="_blank" rel="noopener noreferrer" class="wa-mini" data-wa="Disponibilidade: ${esc(s.name)}" data-wa-msg="${esc(msg)}" aria-label="Pedir disponibilidade para ${esc(s.name)} pelo WhatsApp">${WA_ICON(18)}</a>` : ""}
        <a href="marcacao.html?servico=${encodeURIComponent(s.id)}" class="btn btn-primary btn-sm" aria-label="Marcar sessão: ${esc(s.name)}">Marcar ${icon("arrowUpRight", 15)}</a>
      </div>
    </div></article>`;
}

/** Pílula deslizante para os separadores (efeito "layout"). */
export function movePill(tabs) {
  const pill = $(".tab-pill", tabs), active = $('.tab[aria-selected="true"], .tab[aria-pressed="true"]', tabs);
  if (!pill || !active) return;
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

/* Galeria editorial + lightbox */
const spanCls = (g) => g.featured && g.aspect !== "square" ? `feat-${g.aspect}` : g.aspect;

export function galleryHTML(items) {
  return items.map((g, i) => `<li class="${spanCls(g)}" style="--d:${Math.min(i, 8) * .04}s">
    <button class="g-item" data-lb="${i}" data-cursor="view" aria-label="Ver ${esc(g.title ?? "trabalho")} em ecrã inteiro">
      <span class="zoom">${media(g.image_url, { alt: g.title ?? galleryLabel(g.category), seed: g.id, category: g.category, aspect: g.aspect, sizes: "(max-width: 768px) 50vw, 25vw" })}</span>
      <span class="g-cap glass">${g.title ? `${esc(g.title)} • ` : ""}${esc(galleryLabel(g.category))}</span>
    </button></li>`).join("");
}

export function bindLightbox(container, getItems) {
  container.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lb]");
    if (b) openLightbox(getItems(), Number(b.dataset.lb));
  });
}

function openLightbox(items, index) {
  let i = index;
  const prevFocus = document.activeElement;
  const lb = document.createElement("div");
  lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
  const draw = () => {
    const g = items[i];
    lb.setAttribute("aria-label", g.title ?? "Imagem");
    lb.innerHTML = `<figure>
      <div class="lb-frame frame ${g.aspect}">${media(g.image_url, { alt: g.title ?? galleryLabel(g.category), seed: g.id, category: g.category, aspect: g.aspect, eager: true })}</div>
      <figcaption class="glass"><b style="font-weight:500">${esc(g.title ?? "")}</b><span style="color:var(--taupe)">•</span><span class="muted">${esc(galleryLabel(g.category))}</span><span class="n">${i + 1}/${items.length}</span></figcaption></figure>
      <button class="lb-btn lb-close glass" aria-label="Fechar">${icon("x", 20)}</button>
      ${items.length > 1 ? `<button class="lb-btn lb-prev glass" aria-label="Imagem anterior">${icon("chevronLeft", 22)}</button><button class="lb-btn lb-next glass" aria-label="Imagem seguinte">${icon("chevronRight", 22)}</button>` : ""}`;
    $(".lb-close", lb).focus();
  };
  const go = (d) => { i = (i + d + items.length) % items.length; draw(); };
  const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; removeEventListener("keydown", key); setTimeout(() => lb.remove(), 350); prevFocus?.focus?.(); };
  const key = (e) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === "Tab") { const f = $$("button", lb); if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } } };
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-close")) return close();
    if (e.target.closest(".lb-prev")) return go(-1);
    if (e.target.closest(".lb-next")) return go(1);
    if (!e.target.closest("figure")) close();
  });
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); sx = null; });
  document.body.append(lb); document.body.style.overflow = "hidden";
  addEventListener("keydown", key);
  draw(); requestAnimationFrame(() => lb.classList.add("open"));
}

export function promoCard(p, large = false) {
  const pct = p.original_price && p.promo_price ? Math.round((1 - p.promo_price / p.original_price) * 100) : null;
  const label = p.cta_text || "Aproveitar promoção";
  const book = p.service_id ? `marcacao.html?servico=${encodeURIComponent(p.service_id)}` : null;
  const msg = waMessages.promo(p.title);
  return `<article class="promo ${large ? "large" : ""}">
    <div class="frame">${media(p.image_url, { alt: p.title, seed: `promo-${p.id}`, category: "nail-art", aspect: "landscape" })}
      ${pct > 0 ? `<div class="pct glass">-${pct}%</div>` : ""}</div>
    <div class="promo-body">
      <p class="eyebrow">${icon("sparkles", 14)}${esc(p.label || "Promoção")}</p>
      <h3>${esc(p.title)}</h3>
      ${p.description ? `<p class="d">${esc(p.description)}</p>` : ""}
      ${p.promo_price != null || p.original_price != null ? `<div class="promo-prices">${p.promo_price != null ? `<span class="now">${euro(p.promo_price)}</span>` : ""}${p.original_price != null ? `<span class="was">${euro(p.original_price)}</span>` : ""}</div>` : ""}
      ${p.end_date ? `<p class="until">Disponível até ${shortDate(p.end_date)}</p>` : ""}
      <div class="btn-row">${book ? `<a href="${book}" class="btn btn-gold">${esc(label)}</a>${waButton("Saber mais", { message: msg, context: `Promoção: ${p.title}`, cls: "btn btn-ghost" })}`
        : waButton(label, { message: msg, context: `Promoção: ${p.title}`, cls: "btn btn-gold" })}</div>
    </div></article>`;
}

export const ctaSection = (b) => `<section class="cta" aria-labelledby="cta-title"><div class="cta-box reveal scale">
  <div class="blob b1" aria-hidden="true">${nailArt({ seed: "cta-a", category: "francesinhas" })}</div>
  <div class="blob b2" aria-hidden="true">${nailArt({ seed: "cta-b", category: "nail-art" })}</div>
  <div class="cta-inner"><p class="eyebrow center">Marcação</p>
    <h2 id="cta-title" class="display">${esc(b?.title ?? "Pronta para o seu momento?")}</h2>
    <p>${esc(b?.subtitle ?? "Escolha o serviço, a data e a hora. Nós tratamos do resto.")}</p>
    <div class="btn-row"><a href="marcacao.html" class="btn btn-primary btn-lg">${esc(b?.cta_text ?? "Marcar sessão")} ${icon("arrowRight")}</a>${waButton("Marcar pelo WhatsApp", { context: "CTA final", cls: "btn btn-secondary btn-lg" })}</div>
  </div></div></section>`;


