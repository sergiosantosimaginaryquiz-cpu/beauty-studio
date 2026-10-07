/* Painel — Dashboard, Marcações, Clientes */
import { $, $$, esc, euro, hhmm, longDate, shortDate, parseDate, toISODate, DAYS, DAYS_SHORT, STATUS_LABEL, cleanPhone, WA_ICON } from "./lib.js";
import { sbc, ic, toast, fail, pageHeader, btn, badge, field, input, textarea, select, empty, skeleton, drawer, readForm, delBtn, bindDelete } from "./admin-ui.js";

const TONE = { pending: "amber", confirmed: "green", completed: "blue", cancelled: "red" };
const statusBadge = (s) => badge(STATUS_LABEL[s], TONE[s]);
const waTo = (phone, msg = "") => { let p = cleanPhone(phone); if (p.length === 9) p = `351${p}`; return `https://wa.me/${p}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`; };

/* ============================================================ Dashboard */
export async function dashboard(view) {
  view.innerHTML = pageHeader("Dashboard", `${DAYS[new Date().getDay()]}, ${shortDate(toISODate(new Date()))}`) + skeleton(120);
  const sb = await sbc();
  const now = new Date(), today = toISODate(now);
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const in14 = new Date(now); in14.setDate(now.getDate() + 13);
  const from90 = new Date(now); from90.setDate(now.getDate() - 90);
  const fromD = toISODate(monday) < today ? toISODate(monday) : today;
  const toD = toISODate(in14 > sunday ? in14 : sunday);

  const [win, recent, promos, leads, last90] = await Promise.all([
    sb.from("appointments").select("*").gte("date", fromD).lte("date", toD).neq("status", "cancelled").order("date").order("time"),
    sb.from("appointments").select("*").order("created_at", { ascending: false }).limit(6),
    sb.from("promotions").select("*").eq("active", true).or(`end_date.is.null,end_date.gte.${today}`).order("end_date"),
    sb.from("leads").select("*").order("created_at", { ascending: false }).limit(8),
    sb.from("appointments").select("service_name").gte("date", toISODate(from90)).neq("status", "cancelled"),
  ]);
  const err = [win, recent, promos, leads, last90].find((r) => r.error)?.error; if (err) throw err;
  const appts = win.data;
  const week = appts.filter((a) => a.date >= toISODate(monday) && a.date <= toISODate(sunday));
  const todays = appts.filter((a) => a.date === today);
  const revenue = week.reduce((s, a) => s + Number(a.service_price ?? 0), 0);
  const nowHH = `${String(now.getHours()).padStart(2, "0")}:00`;
  const upcoming = appts.filter((a) => a.date > today || (a.date === today && hhmm(a.time) >= nowHH)).slice(0, 7);
  const counts = {}; last90.data.forEach((a) => a.service_name && (counts[a.service_name] = (counts[a.service_name] ?? 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5), topMax = Math.max(1, ...top.map((t) => t[1]));
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() + i); return toISODate(d); });
  const perDay = days.map((d) => ({ d, n: appts.filter((a) => a.date === d).length })), dayMax = Math.max(1, ...perDay.map((x) => x.n));
  const leadsWeek = leads.data.filter((l) => new Date(l.created_at) >= monday).length;
  const plural = (n, a, b) => (n === 1 ? a : b);

  const stats = [
    ["Hoje", todays.length, plural(todays.length, "marcação", "marcações"), "calCheck"],
    ["Esta semana", week.length, plural(week.length, "marcação", "marcações"), "calendar"],
    ["Receita prevista", euro(revenue) || "0 €", "esta semana", "euro"],
    ["Contactos WhatsApp", leadsWeek, "esta semana", "msg"],
  ];
  view.innerHTML = pageHeader("Dashboard", `${DAYS[now.getDay()]}, ${shortDate(today)}`) + `
    <div class="stats4">${stats.map(([l, v, u, i]) => `<div class="card stat"><div class="top"><span>${l}</span>${ic(i, 17)}</div><p class="v">${v}</p><p class="u">${u}</p></div>`).join("")}</div>
    <div class="grid2 wide-left" style="margin-top:16px">
      <section class="card"><div class="ct"><h2>Próximas marcações</h2><a href="#/marcacoes">Ver todas →</a></div>
        ${upcoming.length ? `<ul class="upc list">${upcoming.map((a) => `<li><div class="dt"><small>${DAYS_SHORT[parseDate(a.date).getDay()]}</small><b>${parseDate(a.date).getDate()}</b></div>
          <div style="flex:1;min-width:0"><p style="font-weight:500">${esc(a.customer_name)}</p><p style="font-size:14px;color:#6e6e73">${hhmm(a.time)} · ${esc(a.service_name ?? "")}</p></div>${statusBadge(a.status)}</li>`).join("")}</ul>`
          : `<p style="padding:32px 0;text-align:center;color:#86868b;font-size:14px">Sem marcações agendadas.</p>`}
      </section>
      <section class="card"><div class="ct"><h2>Próximos 14 dias</h2></div>
        <div class="bars">${perDay.map(({ d, n }) => `<div class="${d === today ? "today" : ""}" title="${shortDate(d)}: ${n}"><span class="n">${n || ""}</span><i style="height:${Math.max(4, (n / dayMax) * 110)}px"></i><span>${parseDate(d).getDate()}</span></div>`).join("")}</div>
        <h3 style="font-size:15px;font-weight:600;margin:24px 0 12px">Serviços mais procurados</h3>
        ${top.length ? `<ul style="display:grid;gap:10px">${top.map(([n, c]) => `<li><div style="display:flex;justify-content:space-between;font-size:14px"><span>${esc(n)}</span><span style="color:#6e6e73">${c}</span></div><div class="meter"><i style="width:${(c / topMax) * 100}%"></i></div></li>`).join("")}</ul>`
          : `<p style="font-size:14px;color:#86868b">Ainda sem dados (últimos 90 dias).</p>`}
      </section>
    </div>
    <div class="grid3" style="margin-top:16px">
      <section class="card"><div class="ct"><h2>Pedidos recentes</h2></div><ul class="mini-list">${recent.data.map((a) => `<li><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-weight:500">${esc(a.customer_name)}</b>${statusBadge(a.status)}</div><p class="s">${esc(a.service_name ?? "")} · ${shortDate(a.date)} ${hhmm(a.time)}</p></li>`).join("") || `<p class="s">Sem pedidos.</p>`}</ul></section>
      <section class="card"><div class="ct"><h2>Promoções ativas</h2><a href="#/promocoes">Gerir</a></div><ul class="mini-list">${promos.data.map((p) => `<li><b style="font-weight:500">${esc(p.title)}</b><p class="s">${euro(p.promo_price)}${p.end_date ? ` · até ${shortDate(p.end_date)}` : ""}</p></li>`).join("") || `<p class="s">Nenhuma promoção ativa.</p>`}</ul></section>
      <section class="card"><div class="ct"><h2>Contactos WhatsApp</h2></div><ul class="mini-list">${leads.data.map((l) => `<li><b style="font-weight:500">${esc(l.context)}</b><p class="s" style="font-size:12px">${new Date(l.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })} · ${esc(l.page ?? "")}</p></li>`).join("") || `<p class="s">Os cliques no WhatsApp aparecem aqui.</p>`}</ul></section>
    </div>`;
}

/* ============================================================ Marcações */
export async function marcacoes(view, alive) {
  const sb = await sbc();
  const today = toISODate(new Date());
  let tab = "upcoming", q = "", rows = [], services = [];
  const settings = (await sb.from("settings").select("business_name").eq("id", 1).maybeSingle()).data ?? { business_name: "Beauty Studio" };

  view.innerHTML = pageHeader("Marcações", "Pedidos do site e marcações manuais", btn("Nova marcação", { variant: "primary", icon: "plus", attrs: "data-new" })) + `
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;margin-bottom:20px">
      <div class="seg" role="group" aria-label="Filtro">${[["upcoming", "Próximas"], ["pending", "Pendentes"], ["past", "Histórico"], ["all", "Todas"]].map(([k, l]) => `<button data-tab="${k}" aria-pressed="${k === tab}">${l}</button>`).join("")}</div>
      <div class="search" style="width:min(100%,288px)">${ic("search")}<input class="inp" placeholder="Pesquisar cliente ou serviço" aria-label="Pesquisar" data-q></div>
    </div><div id="list">${skeleton()}</div>`;
  const listEl = $("#list", view);

  sb.from("services").select("*").order("sort_order").then(({ data }) => (services = data ?? []));

  async function load() {
    listEl.innerHTML = skeleton();
    let qy = sb.from("appointments").select("*");
    if (tab === "upcoming") qy = qy.gte("date", today).neq("status", "cancelled").order("date").order("time");
    else if (tab === "pending") qy = qy.eq("status", "pending").order("date").order("time");
    else if (tab === "past") qy = qy.lt("date", today).order("date", { ascending: false }).order("time", { ascending: false }).limit(300);
    else qy = qy.order("date", { ascending: false }).order("time", { ascending: false }).limit(500);
    const { data, error } = await qy;
    if (!alive()) return;
    if (error) return fail(error);
    rows = data; draw();
  }

  function draw() {
    const t = q.trim().toLowerCase();
    const list = t ? rows.filter((r) => [r.customer_name, r.customer_phone, r.customer_email, r.service_name].some((v) => v?.toLowerCase().includes(t))) : rows;
    if (!list.length) { listEl.innerHTML = `<div class="card">${empty("calX", "Sem marcações", "Quando alguém pedir uma marcação no site, aparece aqui.")}</div>`; return; }
    const groups = {}; list.forEach((a) => (groups[a.date] ??= []).push(a));
    listEl.innerHTML = Object.entries(groups).map(([date, items]) => `<section class="day-group" style="margin-bottom:20px">
      <h2 class="${date === today ? "today" : ""}">${date === today ? "Hoje · " : ""}${longDate(date)}</h2>
      <div class="card nopad"><ul class="list">${items.map((a) => `<li class="appt" data-id="${a.id}">
        <div class="who"><span class="time">${hhmm(a.time)}</span><div style="min-width:0">
          <p style="font-weight:600">${esc(a.customer_name)} <span style="font-weight:400;color:#86868b">· ${esc(a.customer_phone)}</span></p>
          <p style="font-size:14px;color:#6e6e73">${esc(a.service_name ?? "—")} · ${a.duration} min${a.service_price != null ? ` · ${euro(a.service_price)}` : ""}</p>
          ${a.notes ? `<p class="note">“${esc(a.notes)}”</p>` : ""}</div></div>
        <div class="acts">${statusBadge(a.status)}
          ${a.status === "pending" ? btn("Confirmar", { variant: "primary", size: "sm", icon: "check", attrs: `data-status="confirmed"` }) : ""}
          ${a.status === "confirmed" && a.date <= today ? btn("Concluir", { size: "sm", icon: "checks", attrs: `data-status="completed"` }) : ""}
          ${a.status !== "cancelled" && a.status !== "completed" ? btn("", { variant: "ghost", size: "sm", icon: "x", attrs: `data-status="cancelled" aria-label="Cancelar marcação"` }) : ""}
          <a class="wa-ic" target="_blank" rel="noopener noreferrer" aria-label="Enviar confirmação pelo WhatsApp" href="${esc(waTo(a.customer_phone, `Olá ${a.customer_name.split(" ")[0]}! A sua marcação no ${settings.business_name} está confirmada: ${a.service_name ?? ""}, ${longDate(a.date)} às ${hhmm(a.time)}. Até breve!`))}">${WA_ICON(16)}</a>
          ${btn("", { variant: "ghost", size: "sm", icon: "pencil", attrs: 'data-edit aria-label="Editar"' })}${delBtn(a.id)}</div></li>`).join("")}</ul></div></section>`).join("");
  }

  function edit(a) {
    const isNew = !a;
    a ??= { customer_name: "", customer_phone: "", customer_email: "", date: today, time: "10:00", status: "confirmed", notes: "", admin_notes: "", service_id: "" };
    drawer({
      title: isNew ? "Nova marcação" : "Editar marcação",
      body: `<div class="card stack">${field("Cliente", input("customer_name", a.customer_name, "required"))}
        <div class="row c2">${field("Telemóvel", input("customer_phone", a.customer_phone, 'type="tel"'))}${field("Email", input("customer_email", a.customer_email, 'type="email" data-type="nullable"'))}</div></div>
        <div class="card stack">${field("Serviço", select("service_id", [["", "— Selecionar —"], ...services.map((s) => [s.id, `${s.name} (${euro(s.promo_price ?? s.price)} · ${s.duration} min)`])], a.service_id))}
        <div class="row c2">${field("Data", input("date", a.date, 'type="date"'))}${field("Hora", input("time", hhmm(a.time), 'type="time" step="300"'))}</div>
        <div class="row c2">${field("Estado", select("status", Object.entries(STATUS_LABEL), a.status))}${field("Valor (€)", input("service_price", a.service_price ?? "", 'type="number" step="0.5" min="0" data-type="number" placeholder="Preço do serviço"'))}</div></div>
        <div class="card stack">${field("Observações da cliente", textarea("notes", a.notes, 'data-type="nullable"'))}${field("Notas internas", textarea("admin_notes", a.admin_notes, 'data-type="nullable"'), "Apenas visíveis no painel.")}</div>`,
      onSave: async (body) => {
        const f = readForm(body);
        if (!f.customer_name || !f.customer_phone || !f.date || !f.time) { toast("error", "Preencha nome, telemóvel, data e hora."); return false; }
        const svc = services.find((s) => s.id === f.service_id);
        const payload = { ...f, service_id: f.service_id || null, service_name: svc?.name ?? a.service_name ?? null,
          service_price: f.service_price ?? (svc ? (svc.promo_price ?? svc.price) : null), duration: svc?.duration ?? a.duration ?? 60 };
        const { error } = isNew ? await sb.from("appointments").insert(payload) : await sb.from("appointments").update(payload).eq("id", a.id);
        if (error) { fail(error); return false; }
        toast("ok", isNew ? "Marcação criada" : "Marcação atualizada"); load();
      },
    });
  }

  view.addEventListener("click", async (e) => {
    const tb = e.target.closest("[data-tab]");
    if (tb) { tab = tb.dataset.tab; $$("[data-tab]", view).forEach((b) => b.setAttribute("aria-pressed", String(b === tb))); return load(); }
    if (e.target.closest("[data-new]")) return edit(null);
    const li = e.target.closest("[data-id]"); if (!li) return;
    const a = rows.find((r) => r.id === li.dataset.id);
    if (e.target.closest("[data-edit]")) return edit(a);
    const st = e.target.closest("[data-status]");
    if (st) {
      const status = st.dataset.status;
      const { error } = await sb.from("appointments").update({ status }).eq("id", a.id);
      if (error) return fail(error);
      a.status = status; draw(); toast("ok", `Marcação ${STATUS_LABEL[status].toLowerCase()}`);
    }
  });
  bindDelete(view, async (id) => {
    const { error } = await sb.from("appointments").delete().eq("id", id);
    if (error) return fail(error);
    rows = rows.filter((r) => r.id !== id); draw(); toast("ok", "Eliminada");
  });
  view.addEventListener("input", (e) => { if (e.target.matches("[data-q]")) { q = e.target.value; draw(); } });
  load();
}

/* ============================================================ Clientes */
export async function clientes(view, alive) {
  const sb = await sbc();
  view.innerHTML = pageHeader("Clientes", "A partir das marcações", btn("Exportar CSV", { icon: "download", attrs: "data-csv" })) +
    `<div class="search" style="width:min(100%,320px);margin-bottom:16px">${ic("search")}<input class="inp" placeholder="Pesquisar" aria-label="Pesquisar clientes" data-q></div><div id="list">${skeleton()}</div>`;
  const { data, error } = await sb.from("customers").select("*").order("last_visit", { ascending: false, nullsFirst: false });
  if (!alive()) return;
  if (error) throw error;
  let q = "";
  $(".ph p", view).textContent = `${data.length} clientes, a partir das marcações`;
  const list = () => { const t = q.trim().toLowerCase(); return t ? data.filter((c) => [c.name, c.phone, c.email].some((v) => v?.toLowerCase().includes(t))) : data; };
  const draw = () => {
    const l = list();
    $("#list", view).innerHTML = !l.length ? `<div class="card">${empty("users", "Sem clientes", "Os clientes aparecem automaticamente após a primeira marcação.")}</div>`
      : `<div class="card nopad tbl-wrap"><table class="tbl"><thead><tr><th style="padding-left:20px">Cliente</th><th>Contacto</th><th class="num">Marcações</th><th class="num">Valor</th><th>Última</th><th></th></tr></thead><tbody>
        ${l.map((c) => `<tr class="click" data-phone="${esc(c.phone)}"><td style="padding-left:20px;font-weight:500">${esc(c.name)}</td><td style="color:#6e6e73">${esc(c.phone)}${c.email ? `<br><small>${esc(c.email)}</small>` : ""}</td>
          <td class="num">${c.total_bookings}</td><td class="num">${euro(Number(c.total_value)) || "0 €"}</td><td style="color:#6e6e73">${c.last_visit ? shortDate(c.last_visit) : "—"}</td>
          <td><a class="wa-ic" target="_blank" rel="noopener noreferrer" href="${esc(waTo(c.phone))}" aria-label="WhatsApp ${esc(c.name)}" data-stop>${WA_ICON(16)}</a></td></tr>`).join("")}</tbody></table></div>`;
  };
  view.addEventListener("input", (e) => { if (e.target.matches("[data-q]")) { q = e.target.value; draw(); } });
  view.addEventListener("click", async (e) => {
    if (e.target.closest("[data-csv]")) {
      const head = ["Nome", "Telemóvel", "Email", "Marcações", "Concluídas", "Valor", "Última visita"];
      const lines = list().map((c) => [c.name, c.phone, c.email ?? "", c.total_bookings, c.completed, c.total_value, c.last_visit ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
      a.download = "clientes.csv"; a.click(); return;
    }
    if (e.target.closest("[data-stop]")) return;
    const tr = e.target.closest("[data-phone]"); if (!tr) return;
    const c = data.find((x) => x.phone === tr.dataset.phone);
    const { data: hist } = await sb.from("appointments").select("*").ilike("customer_phone", `%${c.phone.slice(-4)}%`).order("date", { ascending: false });
    const mine = (hist ?? []).filter((a) => a.customer_phone.replace(/\s/g, "") === c.phone);
    drawer({ title: c.name, body: `<div class="card"><p style="font-size:14px;color:#6e6e73">${esc(c.phone)}${c.email ? ` · ${esc(c.email)}` : ""}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;text-align:center">
        <div><p style="font-size:24px;font-weight:700">${c.total_bookings}</p><p style="font-size:12px;color:#86868b">marcações</p></div>
        <div><p style="font-size:24px;font-weight:700">${c.completed}</p><p style="font-size:12px;color:#86868b">concluídas</p></div>
        <div><p style="font-size:24px;font-weight:700">${euro(Number(c.total_value)) || "0 €"}</p><p style="font-size:12px;color:#86868b">valor</p></div></div></div>
      <div class="card"><div class="ct"><h2>Histórico</h2></div><ul class="list">${mine.map((a) => `<li style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;font-size:14px"><div><p style="font-weight:500">${esc(a.service_name ?? "")}</p><p style="color:#6e6e73">${shortDate(a.date)} · ${hhmm(a.time)}</p></div>${statusBadge(a.status)}</li>`).join("")}</ul></div>` });
  });
  draw();
}
