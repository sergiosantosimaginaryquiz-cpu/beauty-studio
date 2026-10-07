/* Painel — Disponibilidade, Galeria, Conteúdo, Definições */
import { $, $$, esc, hhmm, longDate, shortDate, toISODate, DAYS, GALLERY_CATEGORIES, galleryLabel, nailArt, waLink, cleanPhone, WA_ICON } from "./lib.js";
import { sbc, ic, toast, fail, pageHeader, btn, badge, toggle, field, input, textarea, select, empty, skeleton, drawer, readForm, delBtn, bindDelete, imageField, uploadImage, sortable, grip, saveOrder, setBusy } from "./admin-ui.js";

/* ============================================================ Disponibilidade */
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const TYPES = [
  ["day", "Encerrado (dia inteiro)", "Feriado, folga ou fecho excecional."],
  ["vacation", "Férias (vários dias)", "Encerrado entre duas datas."],
  ["partial", "Fecho parcial", "Bloqueia apenas algumas horas."],
  ["special", "Horário especial", "Abre apenas neste horário nesse dia."],
];

export async function disponibilidade(view, alive) {
  const sb = await sbc();
  view.innerHTML = pageHeader("Disponibilidade", "O horário define as horas disponíveis na marcação online.") + skeleton(300);
  const [av, bl] = await Promise.all([sb.from("availability").select("*").order("start_time"), sb.from("blocked_dates").select("*").order("date")]);
  if (!alive()) return;
  if (av.error || bl.error) throw (av.error || bl.error);
  const week = {}; ORDER.forEach((d) => (week[d] = []));
  av.data.filter((a) => a.active).forEach((a) => week[a.day_of_week].push({ start: hhmm(a.start_time), end: hhmm(a.end_time) }));
  let blocked = bl.data;
  let type = "day";

  view.innerHTML = pageHeader("Disponibilidade", "O horário define as horas disponíveis na marcação online.") + `
    <div class="grid2" style="align-items:start">
      <section class="card"><div class="ct"><h2>Horário semanal</h2>${btn("Guardar horário", { variant: "primary", size: "sm", attrs: "data-save-week" })}</div>
        <ul class="week list" id="week"></ul>
        <p style="margin-top:12px;font-size:12px;color:#86868b">Dica: para uma pausa de almoço, use dois intervalos (ex.: 09:00–13:00 e 14:00–18:00).</p></section>
      <div class="stack">
        <section class="card"><div class="ct"><h2>Feriados, folgas e dias especiais</h2></div><div class="stack" id="block-form"></div></section>
        <section class="card"><div class="ct"><h2>Próximos</h2></div><div id="upcoming"></div></section>
        <section class="card" id="past-wrap"><div class="ct"><h2>Anteriores</h2></div><ul id="past" style="display:grid;gap:6px;font-size:14px;color:#86868b"></ul></section>
      </div></div>`;

  const drawWeek = () => {
    $("#week", view).innerHTML = ORDER.map((d) => `<li data-day="${d}"><div class="dname">${toggle(week[d].length > 0, "data-open", DAYS[d])}</div><div class="ranges">
      ${week[d].length ? week[d].map((r, i) => `<div class="range"><input class="inp" type="time" value="${r.start}" data-i="${i}" data-k="start" aria-label="${DAYS[d]} abertura"><span style="color:#86868b">–</span><input class="inp" type="time" value="${r.end}" data-i="${i}" data-k="end" aria-label="${DAYS[d]} fecho">${btn("", { variant: "ghost", size: "sm", icon: "trash", attrs: `data-rm="${i}" aria-label="Remover intervalo"` })}</div>`).join("")
        + `<div style="display:flex;gap:8px">${btn("Intervalo", { variant: "ghost", size: "sm", icon: "plus", attrs: "data-add-range" })}${d === 1 ? btn("Copiar para ter–sex", { variant: "ghost", size: "sm", icon: "copy", attrs: "data-copy" }) : ""}</div>`
        : `<p style="padding-top:6px;font-size:14px;color:#86868b">Encerrado</p>`}</div></li>`).join("");
  };
  const describe = (b) => b.kind === "special" ? `Aberto ${hhmm(b.start_time)}–${hhmm(b.end_time)}` : b.start_time ? `Fechado ${hhmm(b.start_time)}–${hhmm(b.end_time)}` : "Encerrado";
  const drawBlocked = () => {
    const t = toISODate(new Date());
    const up = blocked.filter((b) => (b.end_date ?? b.date) >= t), past = blocked.filter((b) => (b.end_date ?? b.date) < t).reverse().slice(0, 10);
    $("#upcoming", view).innerHTML = up.length ? `<ul class="list">${up.map((b) => `<li style="display:flex;align-items:center;gap:12px;padding:12px 0">
      <div style="flex:1;min-width:0"><p style="font-weight:500">${b.end_date && b.end_date !== b.date ? `${shortDate(b.date)} – ${shortDate(b.end_date)}` : longDate(b.date)}</p><p style="font-size:14px;color:#6e6e73">${esc(b.reason ?? "—")}</p></div>
      ${badge(describe(b), b.kind === "special" ? "blue" : b.start_time ? "amber" : "red")}${delBtn(b.id)}</li>`).join("")}</ul>` : empty("calX", "Nada agendado", "Sem encerramentos ou horários especiais futuros.");
    $("#past-wrap", view).style.display = past.length ? "" : "none";
    $("#past", view).innerHTML = past.map((b) => `<li style="display:flex;justify-content:space-between;gap:12px"><span>${shortDate(b.date)} · ${esc(b.reason ?? "")}</span><span data-del="${b.id}"><button data-yes style="color:#d70015">Remover</button></span></li>`).join("");
  };
  const drawForm = () => {
    const tInfo = TYPES.find((t) => t[0] === type);
    $("#block-form", view).innerHTML = `${field("Tipo", select("type", TYPES.map(([v, l]) => [v, l]), type, "data-type-sel"), tInfo[2])}
      <div class="row c2">${field(type === "vacation" ? "De" : "Data", input("date", toISODate(new Date()), 'type="date"'))}
        ${type === "vacation" ? field("Até", input("end_date", "", 'type="date"')) : ""}
        ${type === "partial" || type === "special" ? field(type === "special" ? "Abre" : "Fecha a partir de", input("start", "10:00", 'type="time"')) + field(type === "special" ? "Fecha" : "Até", input("end", "16:00", 'type="time"')) : ""}</div>
      ${field("Motivo (aparece no site)", input("reason", "", 'placeholder="Ex.: Natal, Férias, Formação"'))}
      ${btn("Adicionar", { variant: "primary", icon: "plus", attrs: "data-add-block" })}`;
  };

  view.addEventListener("change", (e) => {
    if (e.target.matches("[data-type-sel]")) { type = e.target.value; drawForm(); }
    const inp = e.target.closest("[data-k]");
    if (inp) week[inp.closest("[data-day]").dataset.day][inp.dataset.i][inp.dataset.k] = inp.value;
  });
  view.addEventListener("click", async (e) => {
    const day = e.target.closest("[data-day]")?.dataset.day;
    if (e.target.closest("[data-open]")) { week[day] = e.target.closest("[data-open]").getAttribute("aria-checked") === "true" ? [{ start: "09:00", end: "18:00" }] : []; return drawWeek(); }
    if (e.target.closest("[data-add-range]")) { week[day].push({ start: "14:00", end: "18:00" }); return drawWeek(); }
    if (e.target.closest("[data-rm]")) { week[day].splice(Number(e.target.closest("[data-rm]").dataset.rm), 1); return drawWeek(); }
    if (e.target.closest("[data-copy]")) { [2, 3, 4, 5].forEach((d) => (week[d] = week[1].map((r) => ({ ...r })))); return drawWeek(); }
    const sw = e.target.closest("[data-save-week]");
    if (sw) {
      for (const d of ORDER) for (const r of week[d]) if (!r.start || !r.end || r.end <= r.start) return toast("error", `${DAYS[d]}: a hora de fecho tem de ser depois da abertura.`);
      setBusy(sw, true);
      const rows = ORDER.flatMap((d) => week[d].map((r) => ({ day_of_week: d, start_time: r.start, end_time: r.end, active: true })));
      const del = await sb.from("availability").delete().gte("day_of_week", 0);
      const ins = del.error ? del : rows.length ? await sb.from("availability").insert(rows) : { error: null };
      setBusy(sw, false);
      return ins.error ? fail(ins.error) : toast("ok", "Horário guardado");
    }
    if (e.target.closest("[data-add-block]")) {
      const f = readForm($("#block-form", view));
      if (!f.date) return toast("error", "Escolha a data.");
      const row = { date: f.date, reason: f.reason?.trim() || null, kind: type === "special" ? "special" : "closed", end_date: null, start_time: null, end_time: null };
      if (type === "vacation") { if (!f.end_date || f.end_date < f.date) return toast("error", "Indique uma data de fim válida."); row.end_date = f.end_date; }
      if (type === "partial" || type === "special") { if (!f.start || !f.end || f.end <= f.start) return toast("error", "Horas inválidas."); row.start_time = f.start; row.end_time = f.end; }
      const { data, error } = await sb.from("blocked_dates").insert(row).select().single();
      if (error) return fail(error);
      blocked = [...blocked, data].sort((a, b) => a.date.localeCompare(b.date)); drawBlocked(); drawForm(); toast("ok", "Dia adicionado");
    }
  });
  bindDelete(view, async (id) => {
    const { error } = await sb.from("blocked_dates").delete().eq("id", id);
    if (error) return fail(error);
    blocked = blocked.filter((b) => b.id !== id); drawBlocked(); toast("ok", "Removido");
  });
  drawWeek(); drawForm(); drawBlocked();
}

/* ============================================================ Galeria + Instagram */
const thumb = (src, seed, category) => src ? `<img src="${esc(src)}" alt="" loading="lazy">` : nailArt({ seed, category, aspect: "square" });
const ASPECT = { square: "Quadrada", portrait: "Vertical", landscape: "Horizontal" };
const aspectOf = (file) => new Promise((res) => { const img = new Image(); img.onload = () => { const r = img.width / img.height; URL.revokeObjectURL(img.src); res(r > 1.15 ? "landscape" : r < .87 ? "portrait" : "square"); }; img.onerror = () => res("portrait"); img.src = URL.createObjectURL(file); });

const dropzone = () => `<div class="drop" data-drop>${ic("upload", 24)}<p style="font-weight:500" data-drop-label>Arraste fotografias para aqui</p>
  <small>JPG, PNG ou WebP até 8 MB.</small>${btn("Escolher ficheiros", { attrs: "data-choose" })}<input type="file" accept="image/*" multiple hidden data-files></div>`;

function bindDrop(view, onFiles) {
  const dz = () => $("[data-drop]", view);
  view.addEventListener("click", (e) => { if (e.target.closest("[data-choose]")) $("[data-files]", view).click(); });
  view.addEventListener("change", (e) => { if (e.target.matches("[data-files]")) { onFiles([...e.target.files]); e.target.value = ""; } });
  view.addEventListener("dragover", (e) => { if (e.target.closest("[data-drop]")) { e.preventDefault(); dz().classList.add("over"); } });
  view.addEventListener("dragleave", (e) => { if (e.target.closest("[data-drop]")) dz().classList.remove("over"); });
  view.addEventListener("drop", (e) => { if (e.target.closest("[data-drop]")) { e.preventDefault(); dz().classList.remove("over"); onFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"))); } });
}

export async function galeria(view, alive) {
  const sb = await sbc();
  let tab = new URLSearchParams(location.hash.split("?")[1]).get("tab") === "instagram" ? "instagram" : "gallery";
  view.innerHTML = pageHeader("Galeria", "Arraste as imagens para mudar a ordem.") + `
    <div class="seg" style="margin-bottom:20px"><button data-tab="gallery" aria-pressed="${tab === "gallery"}">${ic("images", 15)}Trabalhos</button><button data-tab="instagram" aria-pressed="${tab === "instagram"}">${ic("external", 15)}Instagram</button></div>
    <div id="pane"></div>`;
  const show = () => (tab === "gallery" ? galleryPane : instagramPane)(sb, alive);
  view.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (!t) return;
    tab = t.dataset.tab; $$("[data-tab]", view).forEach((b) => b.setAttribute("aria-pressed", String(b === t)));
    const old = $("#pane", view), fresh = old.cloneNode(false); old.replaceWith(fresh); // limpa os listeners do separador anterior
    show();
  });
  await show();
}

async function galleryPane(sb, alive) {
  const pane = $("#pane");
  let filter = "todos";
  pane.innerHTML = dropzone() + `<div class="chips" id="gfilters" style="margin-bottom:16px"></div><div id="tiles">${skeleton(200)}</div>`;
  const { data, error } = await sb.from("gallery").select("*").order("sort_order");
  if (!alive()) return;
  if (error) throw error;
  let items = data;

  const drawFilters = () => ($("#gfilters", pane).innerHTML = [["todos", "Todas"], ...GALLERY_CATEGORIES.map((c) => [c.slug, c.label])].map(([s, l]) => `<button data-gf="${s}" aria-pressed="${s === filter}">${l}</button>`).join(""));
  const list = () => filter === "todos" ? items : items.filter((g) => g.category === filter);
  const draw = () => {
    const l = list();
    $("#tiles", pane).innerHTML = !l.length ? `<div class="card">${empty("images", "Sem imagens", "Carregue as primeiras fotografias dos trabalhos.")}</div>`
      : `<ul class="tiles grid" id="gsort">${l.map((g) => `<li class="tile ${g.active ? "" : "off"}" data-id="${g.id}"><div class="th">${thumb(g.image_url, g.id, g.category)}${grip()}${g.featured ? `<span class="star">${ic("star", 16)}</span>` : ""}</div>
        <div class="tb"><p class="t">${esc(g.title || "Sem título")}</p><p class="s">${galleryLabel(g.category)} · ${ASPECT[g.aspect]}</p>
        <div class="acts">${btn("", { variant: "ghost", size: "sm", icon: "star", attrs: `data-feat aria-label="${g.featured ? "Remover destaque" : "Destacar"}"` })}${btn("", { variant: "ghost", size: "sm", icon: g.active ? "eye" : "eyeOff", attrs: `data-vis aria-label="${g.active ? "Ocultar" : "Mostrar"}"` })}${btn("", { variant: "ghost", size: "sm", icon: "pencil", attrs: 'data-edit aria-label="Editar"' })}<span style="margin-left:auto">${delBtn(g.id)}</span></div></div></li>`).join("")}</ul>`;
    const s = $("#gsort", pane);
    if (s) sortable(s, (ids) => {
      // reordena dentro do filtro atual, mantendo a posição relativa das restantes
      const moved = ids.map((id) => items.find((g) => g.id === id)), slots = items.map((g, i) => (ids.includes(g.id) ? i : -1)).filter((i) => i >= 0);
      slots.forEach((pos, k) => (items[pos] = moved[k]));
      return saveOrder("gallery", items.map((g) => g.id));
    });
  };

  bindDrop(pane, async (files) => {
    if (!files.length) return;
    $("[data-drop-label]", pane).textContent = "A carregar imagens…";
    for (const f of files) {
      try {
        const [url, aspect] = await Promise.all([uploadImage(f, "gallery"), aspectOf(f)]);
        const { data: row, error: e } = await sb.from("gallery").insert({ image_url: url, title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), category: filter === "todos" ? "outros" : filter, aspect, featured: false, active: true, sort_order: items.length + 1 }).select().single();
        if (e) throw e;
        items.push(row); draw();
      } catch (err) { fail(err); }
    }
    $("[data-drop-label]", pane).textContent = "Arraste fotografias para aqui"; toast("ok", "Imagens adicionadas");
  });
  pane.addEventListener("click", async (e) => {
    const gf = e.target.closest("[data-gf]");
    if (gf) { filter = gf.dataset.gf; drawFilters(); return draw(); }
    const li = e.target.closest("[data-id]"); if (!li) return;
    const g = items.find((x) => x.id === li.dataset.id);
    const patch = async (vals) => { const { error: er } = await sb.from("gallery").update(vals).eq("id", g.id); if (er) return fail(er); Object.assign(g, vals); draw(); toast("ok", "Atualizado"); };
    if (e.target.closest("[data-feat]")) return patch({ featured: !g.featured });
    if (e.target.closest("[data-vis]")) return patch({ active: !g.active });
    if (e.target.closest("[data-edit]")) drawer({
      title: "Editar imagem",
      body: `<div class="card stack">${imageField("image_url", g.image_url, "gallery", "1/1")}
        ${field("Legenda", input("title", g.title ?? "", 'data-type="nullable"'))}
        ${field("Descrição / texto alternativo", textarea("description", g.description ?? "", 'data-type="nullable"'), "Ajuda o SEO e a acessibilidade.")}
        <div class="row c2">${field("Categoria", select("category", GALLERY_CATEGORIES.map((c) => [c.slug, c.label]), g.category))}${field("Formato na galeria", select("aspect", Object.entries(ASPECT), g.aspect))}</div>
        <div class="flexrow">${toggle(g.featured, 'data-name="featured"', "Destaque (maior)")}${toggle(g.active, 'data-name="active"', "Visível")}</div></div>`,
      onSave: async (body) => { const f = readForm(body); const { error: er } = await sb.from("gallery").update(f).eq("id", g.id); if (er) { fail(er); return false; } Object.assign(g, f); draw(); toast("ok", "Guardado"); },
    });
  });
  bindDelete(pane, async (id) => {
    const { error: er } = await sb.from("gallery").delete().eq("id", id);
    if (er) return fail(er);
    items = items.filter((x) => x.id !== id); draw(); toast("ok", "Eliminada");
  });
  drawFilters(); draw();
}

async function instagramPane(sb, alive) {
  const pane = $("#pane");
  pane.innerHTML = `<p style="max-width:42rem;margin-bottom:16px;font-size:14px;color:#6e6e73">O site mostra as primeiras 6 publicações. Carregue imagens do Instagram e, opcionalmente, cole o link de cada publicação — não dependemos de APIs nem de scraping.</p>` + dropzone() + `<div id="tiles">${skeleton(200)}</div>`;
  const { data, error } = await sb.from("instagram_posts").select("*").order("sort_order");
  if (!alive()) return;
  if (error) throw error;
  let posts = data;
  const draw = () => {
    $("#tiles", pane).innerHTML = !posts.length ? `<div class="card">${empty("images", "Sem publicações", "Carregue as imagens que quer mostrar na secção Instagram.")}</div>`
      : `<ul class="tiles six grid" id="isort">${posts.map((p) => `<li class="tile ${p.active ? "" : "off"}" data-id="${p.id}"><div class="th">${thumb(p.image_url, `ig-${p.id}`)}${grip()}</div>
        <div class="tb" style="display:grid;gap:8px">${input("caption", p.caption ?? "", 'class="inp compact" placeholder="Legenda" aria-label="Legenda" data-pf="caption"').replace('class="inp"', "")}
        ${input("permalink", p.permalink ?? "", 'class="inp compact" placeholder="Link da publicação" aria-label="Link" data-pf="permalink"').replace('class="inp"', "")}
        <div style="display:flex;justify-content:space-between;align-items:center">${toggle(p.active, "data-pactive")}${delBtn(p.id)}</div></div></li>`).join("")}</ul>`;
    const s = $("#isort", pane);
    if (s) sortable(s, (ids) => { posts = ids.map((id) => posts.find((p) => p.id === id)); return saveOrder("instagram_posts", ids); });
  };
  bindDrop(pane, async (files) => {
    $("[data-drop-label]", pane).textContent = "A carregar imagens…";
    for (const f of files) {
      try {
        const url = await uploadImage(f, "instagram");
        const { data: row, error: e } = await sb.from("instagram_posts").insert({ image_url: url, caption: "", active: true, sort_order: posts.length + 1 }).select().single();
        if (e) throw e;
        posts.push(row); draw();
      } catch (err) { fail(err); }
    }
    $("[data-drop-label]", pane).textContent = "Arraste fotografias para aqui"; toast("ok", "Publicações adicionadas");
  });
  pane.addEventListener("change", async (e) => {
    const inp = e.target.closest("[data-pf]"); if (!inp) return;
    const id = inp.closest("[data-id]").dataset.id;
    const { error: er } = await sb.from("instagram_posts").update({ [inp.dataset.pf]: inp.value.trim() || null }).eq("id", id);
    er ? fail(er) : toast("ok", "Guardado");
  });
  pane.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-pactive]"); if (!t) return;
    const li = t.closest("[data-id]"), v = t.getAttribute("aria-checked") === "true";
    const { error: er } = await sb.from("instagram_posts").update({ active: v }).eq("id", li.dataset.id);
    if (er) return fail(er);
    li.classList.toggle("off", !v); posts.find((p) => p.id === li.dataset.id).active = v;
  });
  bindDelete(pane, async (id) => {
    const { error: er } = await sb.from("instagram_posts").delete().eq("id", id);
    if (er) return fail(er);
    posts = posts.filter((p) => p.id !== id); draw(); toast("ok", "Eliminada");
  });
  draw();
}

/* ============================================================ Conteúdo */
const SECTIONS = [
  { id: "hero", name: "Página inicial — Topo", anchor: "index.html", fields: { title: "Título principal", subtitle: "Subtítulo", cta_text: "Botão principal", image_url: "Fotografia principal" }, extras: [["secondary_cta", "Botão secundário"], ["tagline", "Frase do cartão flutuante"]] },
  { id: "about", name: "Sobre a Cátia", anchor: "index.html#sobre", fields: { title: "Título (use “. ” para partir em duas linhas)", subtitle: "Introdução", body: "Biografia", cta_text: "Botão", image_url: "Fotografia" }, extras: [["philosophy", "Filosofia (citação)", true]], stats: true },
  { id: "studio", name: "O estúdio", anchor: "index.html#estudio", fields: { title: "Título", subtitle: "Descrição", cta_text: "Botão do mapa", image_url: "Fotografia principal do interior" }, images: true },
  { id: "promotions", name: "Promoções (estado vazio)", anchor: "index.html#promocoes", fields: { title: "Título da secção", subtitle: "Título quando não há promoções", body: "Texto quando não há promoções" } },
  { id: "instagram", name: "Instagram", anchor: "index.html", fields: { title: "Título", subtitle: "Descrição", cta_text: "@utilizador" } },
  { id: "booking", name: "Chamada final para marcação", anchor: "index.html", fields: { title: "Título", subtitle: "Texto", cta_text: "Botão" } },
];

export async function conteudo(view, alive) {
  const sb = await sbc();
  view.innerHTML = pageHeader("Conteúdo", "Textos e imagens do site — sem precisar de programador.") + skeleton(300);
  const { data, error } = await sb.from("content").select("*");
  if (!alive()) return;
  if (error) throw error;
  const blocks = {}; data.forEach((c) => (blocks[c.section] = c));
  let active = "hero";

  view.innerHTML = pageHeader("Conteúdo", "Textos e imagens do site — sem precisar de programador.") + `
    <div class="grid2 side-nav" style="align-items:start"><nav class="card flush sections-nav" aria-label="Secções"><ul>${SECTIONS.map((s) => `<li><button data-sec="${s.id}" aria-pressed="${s.id === active}">${esc(s.name)}</button></li>`).join("")}</ul></nav><div id="editor" class="stack"></div></div>`;

  const draw = () => {
    const sec = SECTIONS.find((s) => s.id === active), b = blocks[active] ?? { section: active, extra: {}, active: true }, ex = b.extra ?? {};
    const stats = ex.stats ?? [], imgs = ex.images ?? [];
    $("#editor", view).innerHTML = `<section class="card stack"><div class="ct" style="margin:0"><h2>${esc(sec.name)}</h2><a href="${sec.anchor}" target="_blank">Ver no site ${ic("external", 13)}</a></div>
      ${["title", "subtitle", "body", "cta_text"].filter((f) => sec.fields[f]).map((f) => field(sec.fields[f], f === "body" ? textarea(f, b[f], 'style="min-height:140px" data-type="nullable"') : input(f, b[f], 'data-type="nullable"'))).join("")}
      ${(sec.extras ?? []).map(([k, l, multi]) => field(l, multi ? textarea(`x_${k}`, ex[k] ?? "") : input(`x_${k}`, ex[k] ?? ""))).join("")}
      ${sec.fields.image_url ? field(sec.fields.image_url, imageField("image_url", b.image_url, `content/${active}`, "16/10")) : ""}</section>
      ${sec.images ? `<section class="card"><div class="ct"><h2>Fotografias adicionais do interior</h2></div><div class="row c2">${[0, 1].map((i) => imageField(`img_${i}`, imgs[i], "content/studio", "4/5")).join("")}</div></section>` : ""}
      ${sec.stats ? `<section class="card"><div class="ct"><h2>Números em destaque</h2></div><div class="stack">${[0, 1, 2].map((i) => `<div class="statrow">${input(`sv_${i}`, stats[i]?.value ?? "", `placeholder="8+" aria-label="Valor ${i + 1}"`)}${input(`sl_${i}`, stats[i]?.label ?? "", `placeholder="anos de experiência" aria-label="Descrição ${i + 1}"`)}</div>`).join("")}</div></section>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">${toggle(b.active ?? true, 'data-name="active"', "Secção visível")}${btn("Publicar alterações", { variant: "primary", attrs: "data-publish" })}</div>`;
  };

  view.addEventListener("click", async (e) => {
    const s = e.target.closest("[data-sec]");
    if (s) { active = s.dataset.sec; $$("[data-sec]", view).forEach((b) => b.setAttribute("aria-pressed", String(b === s))); return draw(); }
    const pub = e.target.closest("[data-publish]"); if (!pub) return;
    const ed = $("#editor", view), f = readForm(ed), sec = SECTIONS.find((x) => x.id === active);
    const prev = blocks[active] ?? {}, extra = { ...(prev.extra ?? {}) };
    (sec.extras ?? []).forEach(([k]) => (extra[k] = f[`x_${k}`] || null));
    if (sec.stats) extra.stats = [0, 1, 2].map((i) => ({ value: f[`sv_${i}`], label: f[`sl_${i}`] })).filter((x) => x.value || x.label);
    if (sec.images) extra.images = [f.img_0, f.img_1].filter(Boolean);
    const row = { section: active, active: f.active, extra };
    ["title", "subtitle", "body", "cta_text"].forEach((k) => { if (sec.fields[k]) row[k] = f[k]; });
    if (sec.fields.image_url) row.image_url = f.image_url;
    setBusy(pub, true);
    const { data: saved, error: er } = await sb.from("content").upsert(row, { onConflict: "section" }).select().single();
    setBusy(pub, false);
    if (er) return fail(er);
    blocks[active] = saved; toast("ok", "Conteúdo publicado");
  });
  draw();
}

/* ============================================================ Definições */
export async function definicoes(view, alive) {
  const sb = await sbc();
  view.innerHTML = pageHeader("Definições", "Informação do negócio usada em todo o site.") + skeleton(300);
  const { data, error } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  if (!alive()) return;
  if (error) throw error;
  const s = data ?? { business_name: "Beauty Studio Cátia Gonçalves", slot_interval: 30, min_notice_hours: 12, booking_window_days: 60 };
  const nf = (n, attrs = "") => input(n, s[n] ?? "", `data-type="nullable" ${attrs}`);

  view.innerHTML = pageHeader("Definições", "Informação do negócio usada em todo o site.", btn("Guardar", { variant: "primary", attrs: "data-save" })) + `
    <form class="grid2" id="settings" onsubmit="return false">
      <section class="card" style="grid-column:1/-1"><div class="ct"><h2>WhatsApp</h2></div>
        <div class="row" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${field("Número de WhatsApp", nf("whatsapp", 'inputmode="tel"'), "Com indicativo, sem espaços nem +. Ex.: 351912345678")}${field("Mensagem predefinida", textarea("whatsapp_message", s.whatsapp_message, 'data-type="nullable" style="min-height:48px"'))}</div>
        <div id="wa-test" style="margin-top:16px"></div></section>
      <section class="card stack"><div class="ct" style="margin:0"><h2>Negócio e contactos</h2></div>${field("Nome do negócio", input("business_name", s.business_name))}<div class="row c2">${field("Telefone", nf("phone", 'type="tel"'))}${field("Email", nf("email", 'type="email"'))}</div></section>
      <section class="card stack"><div class="ct" style="margin:0"><h2>Morada</h2></div>${field("Rua e número", nf("address", 'placeholder="Av. Amália Rodrigues, N.º …"'))}${field("Localidade / bairro", nf("address_line2", 'placeholder="Moinhos da Funcheira"'))}<div class="row c2">${field("Código postal", nf("postal_code"))}${field("Cidade", nf("city"))}</div>${field("Estacionamento", nf("parking_info"))}</section>
      <section class="card stack"><div class="ct" style="margin:0"><h2>Google Maps</h2></div>${field("Link “Como chegar”", nf("google_maps_url"), "Google Maps → Partilhar → Copiar link")}${field("Link de incorporação (opcional)", nf("google_maps_embed"), "Google Maps → Partilhar → Incorporar mapa → copie apenas o endereço dentro de src=\"…\". Vazio = gerado a partir da morada.")}</section>
      <section class="card stack"><div class="ct" style="margin:0"><h2>Redes sociais</h2></div>${field("Instagram", nf("instagram", 'placeholder="https://www.instagram.com/beautystudiocatia"'))}${field("Facebook", nf("facebook"))}${field("TikTok", nf("tiktok"))}</section>
      <section class="card"><div class="ct"><h2>Regras da marcação online</h2></div><div class="row" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        ${field("Intervalo entre horários", select("slot_interval", [15, 20, 30, 45, 60].map((v) => [v, `${v} min`]), s.slot_interval, 'data-type="number"'))}
        ${field("Antecedência mínima", select("min_notice_hours", [0, 2, 4, 12, 24, 48].map((v) => [v, v ? `${v} horas` : "Nenhuma"]), s.min_notice_hours, 'data-type="number"'))}
        ${field("Marcar até", select("booking_window_days", [14, 30, 60, 90, 180].map((v) => [v, `${v} dias`]), s.booking_window_days, 'data-type="number"'))}</div></section>
    </form>
    <section class="card" style="margin-top:16px"><div class="ct"><h2>Conta</h2></div><div class="row c2" id="pw">${field("Nova palavra-passe", '<input class="inp" type="password" autocomplete="new-password" data-pw="a">')}${field("Repetir", '<input class="inp" type="password" autocomplete="new-password" data-pw="b">')}</div>
      <div style="margin-top:16px">${btn("Alterar palavra-passe", { attrs: "data-change-pw" })}</div></section>`;

  const waTest = () => {
    const f = readForm($("#settings", view)), n = cleanPhone(f.whatsapp);
    $("#wa-test", view).innerHTML = n ? `<a href="${esc(waLink({ ...f, whatsapp: n }))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;background:rgba(62,155,110,.1);color:#2f7d57;font-size:14px;font-weight:500">${WA_ICON(16)}Testar link: wa.me/${n}</a>` : "";
  };
  view.addEventListener("input", (e) => { if (e.target.name === "whatsapp" || e.target.name === "whatsapp_message") waTest(); });
  view.addEventListener("click", async (e) => {
    const sv = e.target.closest("[data-save]");
    if (sv) {
      const f = readForm($("#settings", view));
      const digits = cleanPhone(f.whatsapp);
      if (f.whatsapp && digits.length < 11) return toast("error", "WhatsApp: use o indicativo do país, ex. 351912345678.");
      if (!f.business_name?.trim()) return toast("error", "Indique o nome do negócio.");
      setBusy(sv, true);
      const { error: er } = await sb.from("settings").upsert({ ...f, id: 1, whatsapp: digits || null });
      setBusy(sv, false);
      return er ? fail(er) : toast("ok", "Definições guardadas");
    }
    if (e.target.closest("[data-change-pw]")) {
      const a = $('[data-pw="a"]', view).value, b = $('[data-pw="b"]', view).value;
      if (a.length < 8) return toast("error", "A palavra-passe deve ter pelo menos 8 caracteres.");
      if (a !== b) return toast("error", "As palavras-passe não coincidem.");
      const { error: er } = await sb.auth.updateUser({ password: a });
      if (er) return fail(er);
      $$("[data-pw]", view).forEach((i) => (i.value = "")); toast("ok", "Palavra-passe alterada");
    }
  });
  waTest();
}
