import { boot, DATA } from "./site.js";
import { getBusySlots, requestAppointment, trackLead, isConfigured } from "./db.js";
import {
  $, esc, euro, fmtDuration, longDate, parseDate, toISODate, DAYS_SHORT, MONTHS, computeSlots, dayStatus,
  waLink, waMessages, polishBottle, icon, WA_ICON,
} from "./lib.js";

const STEPS = ["Serviço", "Data", "Hora", "Dados", "Confirmação"];
const ERRORS = {
  SLOT_TAKEN: "Este horário acabou de ser reservado. Por favor escolha outro.",
  CLOSED: "O estúdio está encerrado nesse dia.",
  OUTSIDE_HOURS: "Esse horário está fora do horário de funcionamento.",
  PAST_DATE: "Escolha uma data futura.",
  INVALID_SERVICE: "Este serviço já não está disponível.",
  INVALID_DATA: "Verifique o nome e o número de telemóvel.",
};

const st = { step: 0, dir: 1, service: null, date: null, time: null, busy: null, form: { name: "", phone: "", email: "", notes: "" }, touched: false, error: null, submitting: false, month: null };
let root;

boot("marcacao", (main) => {
  main.innerHTML = `<section class="booking-page">
    <header class="booking-head"><p class="eyebrow center">Marcação</p><h1 class="display">Marcar sessão</h1>
      <p>Escolha o serviço, a data e a hora. Confirmaremos consigo a disponibilidade.</p></header>
    <div class="booking" id="booking"></div></section>`;
  root = $("#booking");
  const id = new URLSearchParams(location.search).get("servico");
  st.service = DATA.services.find((s) => s.id === id) ?? null;
  if (st.service) st.step = 1;
  const now = new Date(); st.month = new Date(now.getFullYear(), now.getMonth(), 1);
  render();
});

const S = () => DATA.settings;
const price = () => st.service ? (st.service.promo_price ?? st.service.price) : 0;
const waMsg = () => st.service && st.date && st.time ? waMessages.booking({ service: st.service.name, date: longDate(st.date), time: st.time, name: st.form.name.trim() }) : undefined;

function go(n, keepError = false) {
  st.dir = n > st.step ? 1 : -1; st.step = n; if (!keepError) st.error = null;
  render(); scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  if (st.done) return renderSuccess();
  const sv = st.service;
  root.innerHTML = `
    <ol class="steps" aria-label="Passos da marcação">${STEPS.map((s, i) => `<li class="${i <= st.step ? "done" : ""} ${i === st.step ? "current" : ""}" ${i === st.step ? 'aria-current="step"' : ""}><span class="bar"></span><span class="lbl">${i + 1}. ${s}</span></li>`).join("")}</ol>
    <p class="step-mobile">Passo ${st.step + 1} de 5 · <b>${STEPS[st.step]}</b></p>
    ${sv && st.step > 0 ? `<div class="summary glass">${polishBottle("#C98F98", 12)}<b>${esc(sv.name)}</b><span>${euro(price())} · ${fmtDuration(sv.duration)}</span>
      ${st.date && st.step > 1 ? `<span>· ${longDate(st.date)}</span>` : ""}${st.time && st.step > 2 ? `<span>· ${st.time}</span>` : ""}</div>` : ""}
    <div class="step-anim" style="--dir:${st.dir}">${[stepService, stepDate, stepTime, stepForm, stepReview][st.step]()}</div>
    ${st.step > 0 ? `<button class="back" data-back>${icon("arrowLeft", 16)} Voltar</button>` : ""}
    ${st.error && st.step !== 4 ? errorBox(st.error) : ""}`;
  bind();
  if (st.step === 2 && st.busy === null) loadBusy();
}

const errorBox = (m) => `<div class="error-box" role="alert"><b>Ups! Algo não correu como esperado.</b><p>${esc(m)}</p>
  <a href="${esc(waLink(S(), waMsg()))}" target="_blank" rel="noopener noreferrer">${WA_ICON(16)}Falar connosco</a></div>`;

/* 1 — Serviço */
function stepService() {
  const groups = DATA.categories.map((c) => ({ c, list: DATA.services.filter((s) => s.category_id === c.id) })).filter((g) => g.list.length);
  const orphans = DATA.services.filter((s) => !DATA.categories.some((c) => c.id === s.category_id));
  if (orphans.length) groups.push({ c: { id: "_", name: "Outros" }, list: orphans });
  return `<h2 class="display" style="font-size:clamp(1.9rem,4vw,2.4rem)">Que serviço deseja?</h2>
    ${groups.map(({ c, list }) => `<div class="svc-group"><p class="eyebrow">${esc(c.name)}</p><div class="svc-pick">
      ${list.map((s) => { const promo = s.promo_price != null && s.promo_price < s.price; return `<button class="pick clay" data-service="${esc(s.id)}" aria-pressed="${st.service?.id === s.id}">
        <span><b>${esc(s.name)}</b><small>${icon("clock", 12)}${fmtDuration(s.duration)}</small></span>
        <span class="p">${euro(promo ? s.promo_price : s.price)}${promo ? `<s>${euro(s.price)}</s>` : ""}</span></button>`; }).join("")}
    </div></div>`).join("")}`;
}

/* 2 — Data */
function stepDate() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = new Date(today); last.setDate(last.getDate() + S().booking_window_days);
  const m = st.month, first = (m.getDay() + 6) % 7, days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const canPrev = m > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(m.getFullYear(), m.getMonth() + 1, 1) <= last;
  let cells = Array(first).fill(`<div></div>`).join("");
  for (let i = 1; i <= days; i++) {
    const iso = toISODate(new Date(m.getFullYear(), m.getMonth(), i)), d = parseDate(iso);
    const ds = dayStatus(iso, DATA.availability, DATA.blocked);
    const disabled = d < today || d > last || !ds.open ||
      computeSlots({ date: iso, duration: st.service.duration, interval: S().slot_interval, minNoticeHours: S().min_notice_hours, availability: DATA.availability, blocked: DATA.blocked, busy: [] }).length === 0;
    const on = iso === st.date;
    cells += `<button class="day ${on ? "btn-primary" : ""}" data-date="${iso}" ${disabled ? "disabled" : ""} aria-pressed="${on}" aria-label="${longDate(iso)}${!ds.open ? ` — ${esc(ds.reason ?? "encerrado")}` : ""}" ${ds.reason ? `title="${esc(ds.reason)}"` : ""}>${i}${ds.reason && d >= today ? '<span class="mark"></span>' : ""}</button>`;
  }
  return `<div class="panel clay"><div class="cal-head"><h2>${MONTHS[m.getMonth()]} <span>${m.getFullYear()}</span></h2>
    <div class="cal-nav"><button class="glass" data-month="-1" ${canPrev ? "" : "disabled"} aria-label="Mês anterior">${icon("chevronLeft")}</button><button class="glass" data-month="1" ${canNext ? "" : "disabled"} aria-label="Mês seguinte">${icon("chevronRight")}</button></div></div>
    <div class="cal">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="dow">${DAYS_SHORT[d]}</div>`).join("")}${cells}</div>
    <p class="legend">Encerrado / dia especial</p></div>`;
}

/* 3 — Hora */
async function loadBusy() {
  try { st.busy = await getBusySlots(st.date); }
  catch { st.busy = []; st.error = "Não foi possível carregar os horários. Tente novamente."; }
  if (st.step === 2) render();
}
function stepTime() {
  if (st.busy === null) return `<div class="panel clay"><h2>Escolha a hora</h2><div class="slots" style="margin-top:24px">${'<div class="skeleton"></div>'.repeat(8)}</div></div>`;
  const slots = computeSlots({ date: st.date, duration: st.service.duration, interval: S().slot_interval, minNoticeHours: S().min_notice_hours, availability: DATA.availability, blocked: DATA.blocked, busy: st.busy });
  const parts = [["Manhã", slots.filter((s) => s < "12:00")], ["Tarde", slots.filter((s) => s >= "12:00" && s < "18:00")], ["Fim do dia", slots.filter((s) => s >= "18:00")]].filter(([, l]) => l.length);
  const msg = waMessages.availability(st.service.name);
  return `<div class="panel clay"><h2>Escolha a hora</h2>
    ${parts.length ? parts.map(([label, l]) => `<div class="slots-part"><p class="eyebrow">${label}</p><div class="slots">${l.map((t) => `<button class="slot ${t === st.time ? "btn-primary" : ""}" data-time="${t}" aria-pressed="${t === st.time}">${t}</button>`).join("")}</div></div>`).join("")
      : `<div class="no-slots"><h3>Sem horários livres neste dia</h3><p>Volte atrás e escolha outra data, ou peça disponibilidade pelo WhatsApp.</p>
         <a href="${esc(waLink(S(), msg))}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" data-wa="Sem horários: ${esc(st.service.name)}" data-wa-msg="${esc(msg)}"><span class="wa">${WA_ICON(18)}</span>Pedir disponibilidade</a></div>`}</div>`;
}

/* 4 — Dados */
const valid = () => ({
  name: st.form.name.trim().length >= 2,
  phone: st.form.phone.replace(/\D/g, "").length >= 9,
  email: !st.form.email || /^\S+@\S+\.\S+$/.test(st.form.email),
});
function field(id, label, input, err, req) {
  return `<div class="field-wrap"><label for="${id}">${label}${req ? '<span class="req"> *</span>' : ""}</label>${input}${err ? `<p class="field-err" role="alert">${err}</p>` : ""}</div>`;
}
function stepForm() {
  const v = valid(), t = st.touched, f = st.form;
  return `<form class="panel clay form" novalidate id="details"><h2>Os seus dados</h2>
    ${field("name", "Nome", `<input id="name" class="field" autocomplete="name" value="${esc(f.name)}" ${t && !v.name ? 'aria-invalid="true"' : ""}>`, t && !v.name ? "Indique o seu nome." : "", true)}
    ${field("phone", "Telemóvel", `<input id="phone" class="field" type="tel" inputmode="tel" autocomplete="tel" placeholder="9XX XXX XXX" value="${esc(f.phone)}" ${t && !v.phone ? 'aria-invalid="true"' : ""}>`, t && !v.phone ? "Indique um número de telemóvel válido." : "", true)}
    ${field("email", "Email (opcional)", `<input id="email" class="field" type="email" inputmode="email" autocomplete="email" value="${esc(f.email)}">`, t && !v.email ? "Este email não parece válido." : "")}
    ${field("notes", "Observações (opcional)", `<textarea id="notes" class="field" placeholder="Ex.: cor que gostaria, inspiração, alergias…">${esc(f.notes)}</textarea>`, "")}
    <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px">Continuar ${icon("arrowRight", 17)}</button></form>`;
}

/* 5 — Confirmação */
function stepReview() {
  const s = st.service, f = st.form;
  const rows = [["Serviço", s.name], ["Data", longDate(st.date)], ["Hora", st.time], ["Duração", fmtDuration(s.duration)], ["Valor", euro(price())], ["Nome", f.name], ["Telemóvel", f.phone], ...(f.email ? [["Email", f.email]] : []), ...(f.notes ? [["Observações", f.notes]] : [])];
  return `<div class="panel clay"><h2>Confirme o seu pedido</h2>
    <dl class="review">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    <p class="note">O pedido fica pendente até confirmarmos a disponibilidade consigo.</p>
    ${st.error ? errorBox(st.error) : ""}
    <button class="btn btn-primary btn-lg btn-block" data-submit ${st.submitting ? "disabled" : ""}>${st.submitting ? `${icon("loader", 18, "spin")}A enviar…` : `Pedir marcação ${icon("check", 18)}`}</button></div>`;
}

async function submit() {
  st.submitting = true; st.error = null; render();
  try {
    await requestAppointment({ service_id: st.service.id, date: st.date, time: st.time, ...st.form });
    st.submitting = false; st.done = true; render(); scrollTo({ top: 0, behavior: "smooth" });
  } catch (e) {
    st.submitting = false;
    const code = Object.keys(ERRORS).find((k) => String(e.message).includes(k));
    st.error = code ? ERRORS[code] : "Tente novamente ou contacte-nos através do WhatsApp.";
    if (code === "SLOT_TAKEN") { st.time = null; st.busy = null; go(2, true); } else render();
  }
}

function renderSuccess() {
  const msg = waMsg();
  root.innerHTML = `<div class="success glass" role="status">
    <div class="tick"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <div class="inner"><p class="eyebrow center">Sessão solicitada</p><h2>Pedido recebido</h2>
      <p class="t">Obrigada pelo seu pedido de marcação.<br>Entraremos em contacto consigo para confirmar a disponibilidade.</p>
      <span class="chip">${esc(st.service.name)} · ${longDate(st.date)} · ${st.time}</span>
      ${!isConfigured ? `<p class="note">Modo de demonstração — o pedido não foi guardado.</p>` : ""}
      <div class="btn-row">
        ${S().whatsapp ? `<a href="${esc(waLink(S(), msg))}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" data-wa="Marcação: enviar pedido" data-wa-msg="${esc(msg)}"><span class="wa">${WA_ICON(18)}</span>Enviar pedido pelo WhatsApp</a>` : ""}
        <a href="index.html" class="btn btn-primary">Voltar ao início</a></div></div></div>`;
}

function bind() {
  root.onclick = (e) => {
    const t = e.target.closest("button, a"); if (!t) return;
    if (t.dataset.back !== undefined) return go(st.step - 1);
    if (t.dataset.service) { st.service = DATA.services.find((s) => s.id === t.dataset.service); st.time = null; st.date = null; return go(1); }
    if (t.dataset.month) { st.month = new Date(st.month.getFullYear(), st.month.getMonth() + Number(t.dataset.month), 1); return render(); }
    if (t.dataset.date) { st.date = t.dataset.date; st.time = null; st.busy = null; return go(2); }
    if (t.dataset.time) { st.time = t.dataset.time; return go(3); }
    if (t.dataset.submit !== undefined) return submit();
  };
  const form = $("#details", root);
  if (form) {
    form.oninput = (e) => { if (e.target.id in st.form) st.form[e.target.id] = e.target.value; };
    form.onsubmit = (e) => {
      e.preventDefault(); st.touched = true;
      const v = valid();
      if (v.name && v.phone && v.email) go(4); else { render(); $('[aria-invalid="true"]', root)?.focus(); }
    };
  }
}

export { trackLead };
