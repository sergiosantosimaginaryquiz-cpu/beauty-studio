/* ============================================================
   Utilitários partilhados: formatação, horários, WhatsApp, SVG
   ============================================================ */

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const euro = (v) => v == null || v === "" ? "" :
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(Number(v)) ? 0 : 2 }).format(Number(v));
export const fmtDuration = (min) => { if (min < 60) return `${min} min`; const h = Math.floor(min / 60), m = min % 60; return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`; };
export const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

export const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const parseDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
export const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const longDate = (iso) => { const d = parseDate(iso); return `${DAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
export const shortDate = (iso) => { const d = parseDate(iso); return `${d.getDate()} de ${MONTHS[d.getMonth()]}`; };

export const GALLERY_CATEGORIES = [
  { slug: "manicure", label: "Manicure" }, { slug: "verniz-gel", label: "Verniz Gel" },
  { slug: "francesinhas", label: "Francesinhas" }, { slug: "nail-art", label: "Nail Art" },
  { slug: "gel", label: "Gel" }, { slug: "outros", label: "Outros" },
];
export const galleryLabel = (slug) => GALLERY_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
export const STATUS_LABEL = { pending: "Pendente", confirmed: "Confirmada", completed: "Concluída", cancelled: "Cancelada" };

export const extra = (block, key, fallback) => (block?.extra ?? {})[key] ?? fallback;

/* ---------------- WhatsApp ---------------- */
export const cleanPhone = (n) => String(n ?? "").replace(/\D/g, "");
export function waLink(settings, message) {
  const text = message ?? settings.whatsapp_message ?? `Olá! Gostaria de marcar uma sessão no ${settings.business_name}.`;
  return `https://wa.me/${cleanPhone(settings.whatsapp)}?text=${encodeURIComponent(text)}`;
}
export const waMessages = {
  availability: (s) => `Olá! Gostaria de saber a disponibilidade para ${s}.`,
  question: () => "Olá! Tenho uma dúvida sobre os vossos serviços.",
  promo: (t) => `Olá! Gostaria de aproveitar a promoção "${t}".`,
  booking: (p) => `Olá! Acabei de pedir uma marcação no site:\n• Serviço: ${p.service}\n• Data: ${p.date}\n• Hora: ${p.time}\n• Nome: ${p.name}\nAguardo confirmação. Obrigada!`,
};

/* ---------------- Horários / disponibilidade ---------------- */
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function openRanges(iso, availability, blocked) {
  const dow = parseDate(iso).getDay();
  if (blocked.some((b) => b.kind === "closed" && !b.start_time && iso >= b.date && iso <= (b.end_date ?? b.date))) return [];
  const special = blocked.filter((b) => b.kind === "special" && b.date === iso && b.start_time && b.end_time);
  return special.length
    ? special.map((s) => [toMin(s.start_time), toMin(s.end_time)])
    : availability.filter((a) => a.active && a.day_of_week === dow).map((a) => [toMin(a.start_time), toMin(a.end_time)]);
}
export function dayStatus(iso, availability, blocked) {
  const closed = blocked.find((b) => b.kind === "closed" && !b.start_time && iso >= b.date && iso <= (b.end_date ?? b.date));
  if (closed) return { open: false, reason: closed.reason ?? "Encerrado" };
  return { open: openRanges(iso, availability, blocked).length > 0, reason: null };
}
export function computeSlots({ date, duration, interval, minNoticeHours, availability, blocked, busy, now = new Date() }) {
  const partial = blocked.filter((b) => b.kind === "closed" && b.start_time && b.end_time && date >= b.date && date <= (b.end_date ?? b.date)).map((b) => [toMin(b.start_time), toMin(b.end_time)]);
  const taken = busy.map((b) => [toMin(b.start_time), toMin(b.start_time) + b.duration]);
  const earliest = new Date(now.getTime() + minNoticeHours * 3600e3);
  const slots = [];
  for (const [s, e] of openRanges(date, availability, blocked)) {
    for (let t = s; t + duration <= e; t += interval) {
      const end = t + duration;
      if ([...taken, ...partial].some(([a, b]) => t < b && end > a)) continue;
      const when = parseDate(date); when.setHours(0, t, 0, 0);
      if (when < earliest) continue;
      slots.push(fromMin(t));
    }
  }
  return slots;
}
export const hoursByDay = (availability) => [1, 2, 3, 4, 5, 6, 0].map((d) => ({
  day: DAYS[d], dow: d,
  ranges: availability.filter((a) => a.active && a.day_of_week === d).map((a) => `${hhmm(a.start_time)}–${hhmm(a.end_time)}`),
}));

/* ---------------- SVG: frasco de verniz ---------------- */
let uid = 0;
export function polishBottle(color = "#DCCBC0", size = 22, cls = "") {
  const id = `pb${++uid}`;
  return `<svg class="${cls}" width="${size}" height="${size * 1.6}" viewBox="0 0 20 32" aria-hidden="true">
  <defs><linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="#cdb284"/><stop offset=".45" stop-color="#f3e6c8"/><stop offset="1" stop-color="#9c8152"/></linearGradient>
  <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="${color}" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
  <rect x="6.5" y="1" width="7" height="11" rx="1.6" fill="url(#${id}c)"/><rect x="5.5" y="11" width="9" height="2" rx=".8" fill="#b89b68" opacity=".7"/>
  <path d="M3.5 15.5c0-1.4 1.1-2.5 2.5-2.5h8c1.4 0 2.5 1.1 2.5 2.5V28a3 3 0 0 1-3 3H6.5a3 3 0 0 1-3-3V15.5Z" fill="url(#${id}g)" stroke="rgba(255,255,255,.8)" stroke-width=".6"/>
  <path d="M5.6 16.5v9.5" stroke="#fff" stroke-opacity=".75" stroke-linecap="round"/></svg>`;
}

/* ---------------- SVG: composição de unhas (placeholder) ---------------- */
const PALETTES = [
  { bg: ["#F8F5F0", "#EFE2DC"], polish: "#DCB8AE", skin: "#EBD3C4" },
  { bg: ["#F3ECE4", "#E7D3D3"], polish: "#C98F98", skin: "#E8CDBD" },
  { bg: ["#FAF6F1", "#E9DDCD"], polish: "#E3CFC2", skin: "#EDD6C8" },
  { bg: ["#F1E8E0", "#DCCBC0"], polish: "#B97F86", skin: "#E5C8B6" },
  { bg: ["#F7F1EA", "#EADBC8"], polish: "#EDE3DA", skin: "#E9D0C0" },
];
const STYLE_BY_CATEGORY = { francesinhas: "french", "nail-art": "art", "verniz-gel": "gloss", manicure: "sheer", gel: "milky" };
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); };

export function nailArt({ seed = "x", category = "", aspect = "portrait", label = "Ilustração de unhas" } = {}) {
  const h = hash(seed + category);
  const p = PALETTES[h % PALETTES.length];
  const styles = ["french", "art", "gloss", "sheer", "milky", "reverse"];
  const style = STYLE_BY_CATEGORY[category] || styles[h % styles.length];
  const [W, H] = { square: [400, 400], portrait: [400, 520], landscape: [560, 400], wide: [800, 520] }[aspect];
  const id = `na${h}${++uid}`;
  const wide = aspect === "landscape" || aspect === "wide";
  const tilt = ((h >> 3) % 20) - 10, cx = W / 2, baseY = H * 1.12, spread = wide ? 15 : 11, len = H * .86;
  let fingers = "";
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * spread, l = len * (1 - Math.abs(i - 1.3) * .08);
    const fw = W * (wide ? .105 : .135), nw = fw * .74, nh = nw * 1.7, top = baseY - l;
    const nail = `M${nw / 2} 0 C${nw * .92} 0 ${nw} ${nh * .28} ${nw} ${nh * .5} L${nw} ${nh} Q${nw / 2} ${nh * 1.08} 0 ${nh} L0 ${nh * .5} C0 ${nh * .28} ${nw * .08} 0 ${nw / 2} 0Z`;
    let deco = "";
    if (style === "french") deco = `<path d="M${nw / 2} 0 C${nw * .92} 0 ${nw} ${nh * .28} ${nw} ${nh * .42} Q${nw / 2} ${nh * .26} 0 ${nh * .42} C0 ${nh * .28} ${nw * .08} 0 ${nw / 2} 0Z" fill="#fffdfa"/>`;
    if (style === "reverse") deco = `<path d="M0 ${nh * .82} Q${nw / 2} ${nh * .62} ${nw} ${nh * .82} L${nw} ${nh} Q${nw / 2} ${nh * 1.08} 0 ${nh}Z" fill="${p.polish}"/>`;
    if (style === "art" && i % 2 === 0) deco = `<path d="M${nw * .1} ${nh * .75} Q${nw * .5} ${nh * .35} ${nw * .92} ${nh * .15}" stroke="url(#${id}gold)" stroke-width="${nw * .07}" fill="none" stroke-linecap="round"/>`;
    if (style === "art" && i % 2 === 1) deco = `<circle cx="${nw / 2}" cy="${nh * .72}" r="${nw * .15}" fill="url(#${id}pearl)"/>`;
    fingers += `<g transform="rotate(${a} ${cx} ${baseY})"><rect x="${cx - fw / 2}" y="${top}" width="${fw}" height="${l + 40}" rx="${fw / 2}" fill="url(#${id}skin)"/>
      <g transform="translate(${cx - nw / 2} ${top + fw * .12})"><path d="${nail}" fill="${style === "reverse" ? "#f4ece4" : `url(#${id}polish)`}"/>${deco}
      <path d="M${nw * .24} ${nh * .22} Q${nw * .2} ${nh * .55} ${nw * .26} ${nh * .82}" stroke="#fff" stroke-opacity=".75" stroke-width="${nw * .08}" stroke-linecap="round" fill="none"/></g></g>`;
  }
  return `<svg class="nail-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(label)}">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>
    <radialGradient id="${id}glow" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}skin" x1="0" x2="1"><stop offset="0" stop-color="${p.skin}"/><stop offset=".5" stop-color="#f6e6dc"/><stop offset="1" stop-color="${p.skin}"/></linearGradient>
    <linearGradient id="${id}polish" x1="0" x2="1"><stop offset="0" stop-color="${p.polish}"/><stop offset=".38" stop-color="${style === "milky" ? "#fbf7f2" : p.polish}" stop-opacity="${style === "sheer" ? .55 : 1}"/><stop offset="1" stop-color="${p.polish}"/></linearGradient>
    <linearGradient id="${id}gold" x1="0" x2="1"><stop offset="0" stop-color="#a88a55"/><stop offset=".5" stop-color="#efdcae"/><stop offset="1" stop-color="#9c8152"/></linearGradient>
    <radialGradient id="${id}pearl" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#f2e8e1"/><stop offset="1" stop-color="#d6c6bb"/></radialGradient>
    <filter id="${id}sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#503c32" flood-opacity=".16"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${id}bg)"/>
  <circle cx="${W * .82}" cy="${H * .18}" r="${H * .32}" fill="#fff" opacity=".35"/>
  <path d="M0 ${H * .72} Q ${W * .4} ${H * .55} ${W} ${H * .78}" stroke="url(#${id}gold)" fill="none" opacity=".7"/>
  <g transform="rotate(${tilt} ${cx} ${baseY})" filter="url(#${id}sh)">${fingers}</g>
  ${style !== "art" ? `<circle cx="${W * .16}" cy="${H * .2}" r="${Math.min(W, H) * .028}" fill="url(#${id}pearl)"/>` : ""}
  <rect width="${W}" height="${H}" fill="url(#${id}glow)"/></svg>`;
}

/** Imagem real (lazy, async) ou ilustração. */
export function media(src, { alt = "", seed, category, aspect = "portrait", eager = false, sizes } = {}) {
  if (src) return `<img src="${esc(src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${sizes ? `sizes="${sizes}"` : ""} class="media-img">`;
  return nailArt({ seed: seed ?? alt, category, aspect, label: alt });
}

export const WA_ICON = (size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>`;

/** Ícones de linha (estilo Lucide), inline para zero dependências. */
const I = {
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>', arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>', arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>', chevronRight: '<path d="m9 18 6-6-6-6"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  car: '<path d="M19 17h2v-4l-2-5H5L3 13v4h2"/><circle cx="7.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/><path d="M9.5 17.5h5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', navigation: '<path d="m3 11 19-9-9 19-2-8-8-2Z"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>', images: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>', imageOff: '<path d="m2 2 20 20M10.4 5H19a2 2 0 0 1 2 2v8.6M21 21H5a2 2 0 0 1-2-2V5"/><path d="m3 16 5-5 3 3"/>',
};
export const icon = (name, size = 18, cls = "") => `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] ?? ""}</svg>`;
