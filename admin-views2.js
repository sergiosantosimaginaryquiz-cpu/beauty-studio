/* Painel — Serviços, Preços, Promoções */
import { $, $$, esc, euro, fmtDuration, shortDate, toISODate, nailArt } from "./lib.js";
import { sbc, ic, toast, fail, pageHeader, btn, badge, toggle, field, input, textarea, select, empty, skeleton, drawer, readForm, delBtn, bindDelete, imageField, sortable, grip, saveOrder } from "./admin-ui.js";

const strip = (o) => { const r = { ...o }; delete r.created_at; delete r.updated_at; return r; };
const toNum = (rows, keys) => rows.map((r) => { const o = { ...r }; keys.forEach((k) => { if (o[k] != null) o[k] = Number(o[k]); }); return o; });

/* ============================================================ Serviços */
export async function servicos(view, alive) {
  const sb = await sbc();
  let services = [], cats = [], filter = "all";
  view.innerHTML = pageHeader("Serviços", "Arraste para ordenar como aparecem no site.",
    btn("Categorias", { icon: "folder", attrs: "data-cats" }) + btn("Novo serviço", { variant: "primary", icon: "plus", attrs: "data-new" })) +
    `<div class="chips" id="filters" style="margin-bottom:16px"></div><div class="card flush" id="list">${skeleton()}</div>`;

  const [s, c] = await Promise.all([sb.from("services").select("*").order("sort_order"), sb.from("categories").select("*").order("sort_order")]);
  if (!alive()) return;
  if (s.error || c.error) throw (s.error || c.error);
  services = toNum(s.data, ["price", "promo_price"]); cats = c.data;

  const catName = (id) => cats.find((x) => x.id === id)?.name ?? "Sem categoria";
  const list = () => filter === "all" ? services : services.filter((x) => x.category_id === filter);

  function drawFilters() {
    $("#filters", view).innerHTML = [["all", "Todos"], ...cats.map((x) => [x.id, x.name])].map(([id, n]) => `<button data-filter="${id}" aria-pressed="${id === filter}">${esc(n)}</button>`).join("");
  }
  function draw() {
    const l = list(), el = $("#list", view);
    if (!l.length) { el.innerHTML = empty("sparkles", "Sem serviços", "Crie o primeiro serviço para aparecer no menu do site.", btn("Criar serviço", { variant: "primary", attrs: "data-new" })); return; }
    el.innerHTML = `<ul class="list" id="sortable">${l.map((x) => `<li class="li ${x.active ? "" : "off"}" data-id="${x.id}">${grip()}
      <div class="main"><p class="t">${esc(x.name)}${x.featured ? `<span style="color:#B89B68" title="Destaque">${ic("star", 13)}</span>` : ""}</p><p class="s">${esc(catName(x.category_id))} · ${fmtDuration(x.duration)}</p></div>
      <div class="price" style="display:none" data-desktop>${euro(x.promo_price ?? x.price)}${x.promo_price != null ? `<s>${euro(x.price)}</s>` : ""}</div>
      ${x.promo_price != null ? badge(x.promo_label || "Promoção", "gold") : ""}
      ${toggle(x.active, 'data-active aria-label="Ativo no site"')}
      ${btn("", { variant: "ghost", size: "sm", icon: "copy", attrs: 'data-dup aria-label="Duplicar"' })}
      ${btn("", { variant: "ghost", size: "sm", icon: "pencil", attrs: 'data-edit aria-label="Editar"' })}${delBtn(x.id)}</li>`).join("")}</ul>`;
    if (innerWidth >= 640) $$("[data-desktop]", el).forEach((p) => (p.style.display = "block"));
    sortable($("#sortable", el), async (ids) => {
      ids.forEach((id, i) => (services.find((x) => x.id === id).sort_order = i + 1));
      services.sort((a, b) => a.sort_order - b.sort_order);
      await saveOrder("services", ids);
    });
  }

  function edit(x) {
    const isNew = !x?.id;
    x ??= { name: "", description: "", category_id: filter !== "all" ? filter : cats[0]?.id ?? "", price: 0, promo_price: null, promo_label: null, duration: 60, image_url: null, featured: false, active: true };
    drawer({
      title: isNew ? "Novo serviço" : "Editar serviço",
      body: `<div class="card stack">${field("Nome", input("name", x.name, 'placeholder="Manicure com verniz gel"'))}
        ${field("Descrição", textarea("description", x.description, 'data-type="nullable"'), "Uma frase curta e elegante.")}
        ${field("Categoria", select("category_id", [["", "Sem categoria"], ...cats.map((c) => [c.id, c.name])], x.category_id, 'data-type="nullable"'))}</div>
        <div class="card"><div class="row c2">
          ${field("Preço (€)", input("price", x.price, 'type="number" min="0" step="0.5" data-type="number"'))}
          ${field("Duração (min)", input("duration", x.duration, 'type="number" min="5" step="5" data-type="number"'))}
          ${field("Preço promocional (€)", input("promo_price", x.promo_price ?? "", 'type="number" min="0" step="0.5" data-type="number"'), "Vazio = sem promoção")}
          ${field("Etiqueta da promoção", input("promo_label", x.promo_label ?? "", 'placeholder="PROMOÇÃO" data-type="nullable"'))}</div></div>
        <div class="card stack">${field("Imagem (opcional)", imageField("image_url", x.image_url, "services"))}
          <div class="flexrow">${toggle(x.active, 'data-name="active"', "Ativo no site")}${toggle(x.featured, 'data-name="featured"', "Destaque")}</div></div>`,
      onSave: async (body) => {
        const f = readForm(body);
        if (!f.name?.trim()) { toast("error", "O nome é obrigatório."); return false; }
        if (f.price == null) { toast("error", "Indique o preço."); return false; }
        if (f.promo_price != null && f.promo_price >= f.price) { toast("error", "O preço promocional deve ser inferior ao preço."); return false; }
        const row = isNew ? { ...f, sort_order: services.length + 1 } : f;
        const q = isNew ? sb.from("services").insert(row).select().single() : sb.from("services").update(row).eq("id", x.id).select().single();
        const { data, error } = await q;
        if (error) { fail(error); return false; }
        const d = toNum([data], ["price", "promo_price"])[0];
        services = isNew ? [...services, d] : services.map((s) => (s.id === d.id ? d : s));
        toast("ok", isNew ? "Serviço criado" : "Serviço atualizado"); draw();
      },
    });
  }

  function categories() {
    const render = () => `<div style="display:flex;gap:8px">${input("new_cat", "", 'placeholder="Nova categoria" aria-label="Nova categoria"')}${btn("Adicionar", { variant: "primary", attrs: "data-add-cat" })}</div>
      <ul class="stack" id="cat-sort">${cats.map((c) => `<li class="card" style="padding:12px" data-id="${c.id}"><div style="display:flex;gap:8px;align-items:center">${grip()}
        <div style="flex:1;display:grid;gap:8px">${input("cname", c.name, `data-cat="${c.id}" data-field="name" aria-label="Nome da categoria"`)}${input("cdesc", c.description ?? "", `data-cat="${c.id}" data-field="description" placeholder="Descrição (opcional)" aria-label="Descrição"`)}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">${toggle(c.active, `data-cat-active="${c.id}"`)}${delBtn(c.id)}</div></div></li>`).join("")}</ul>`;
    const { el } = drawer({ title: "Categorias", body: render() });
    const body = $(".dbody", el);
    const rebind = () => sortable($("#cat-sort", body), async (ids) => { ids.forEach((id, i) => (cats.find((c) => c.id === id).sort_order = i + 1)); cats.sort((a, b) => a.sort_order - b.sort_order); await saveOrder("categories", ids); drawFilters(); });
    rebind();
    const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    body.addEventListener("click", async (e) => {
      if (e.target.closest("[data-add-cat]")) {
        const name = $("[name=new_cat]", body).value.trim(); if (!name) return;
        const { data, error } = await sb.from("categories").insert({ name, slug: `${slug(name)}-${Date.now().toString(36).slice(-3)}`, sort_order: cats.length + 1, active: true }).select().single();
        if (error) return fail(error);
        cats.push(data); body.innerHTML = render(); rebind(); drawFilters(); toast("ok", "Categoria criada");
      }
      const a = e.target.closest("[data-cat-active]");
      if (a) { const v = a.getAttribute("aria-checked") === "true"; const { error } = await sb.from("categories").update({ active: v }).eq("id", a.dataset.catActive); if (error) fail(error); else toast("ok", "Atualizado"); }
    });
    body.addEventListener("change", async (e) => {
      const inp = e.target.closest("[data-cat]"); if (!inp) return;
      const val = inp.value.trim() || null;
      if (inp.dataset.field === "name" && !val) return toast("error", "O nome não pode ficar vazio.");
      const { error } = await sb.from("categories").update({ [inp.dataset.field]: val }).eq("id", inp.dataset.cat);
      if (error) return fail(error);
      Object.assign(cats.find((c) => c.id === inp.dataset.cat), { [inp.dataset.field]: val }); drawFilters(); draw(); toast("ok", "Guardado");
    });
    bindDelete(body, async (id) => {
      const { error } = await sb.from("categories").delete().eq("id", id);
      if (error) return fail(error);
      cats = cats.filter((c) => c.id !== id); services.forEach((s) => s.category_id === id && (s.category_id = null));
      body.innerHTML = render(); rebind(); drawFilters(); draw(); toast("ok", "Eliminada");
    });
  }

  view.addEventListener("click", async (e) => {
    const f = e.target.closest("[data-filter]");
    if (f) { filter = f.dataset.filter; drawFilters(); return draw(); }
    if (e.target.closest("[data-new]")) return edit(null);
    if (e.target.closest("[data-cats]")) return categories();
    const li = e.target.closest("[data-id]"); if (!li || !$("#list", view).contains(li)) return;
    const x = services.find((s) => s.id === li.dataset.id);
    if (e.target.closest("[data-edit]")) return edit(x);
    if (e.target.closest("[data-active]")) {
      const v = e.target.closest("[data-active]").getAttribute("aria-checked") === "true";
      const { error } = await sb.from("services").update({ active: v }).eq("id", x.id);
      if (error) return fail(error);
      x.active = v; li.classList.toggle("off", !v); toast("ok", v ? "Visível no site" : "Oculto do site");
    }
    if (e.target.closest("[data-dup]")) {
      const { id, ...rest } = strip(x);
      const { data, error } = await sb.from("services").insert({ ...rest, name: `${x.name} (cópia)`, active: false, sort_order: services.length + 1 }).select().single();
      if (error) return fail(error);
      services.push(toNum([data], ["price", "promo_price"])[0]); draw(); toast("ok", "Serviço duplicado");
    }
  });
  bindDelete(view, async (id) => {
    const { error } = await sb.from("services").delete().eq("id", id);
    if (error) return fail(error);
    services = services.filter((s) => s.id !== id); draw(); toast("ok", "Eliminado");
  });
  drawFilters(); draw();
}

/* ============================================================ Preços */
export async function precos(view, alive) {
  const sb = await sbc();
  view.innerHTML = pageHeader("Preços", "Altere e saia do campo para gravar. O site atualiza de imediato.") + skeleton();
  const [s, c] = await Promise.all([sb.from("services").select("*").order("sort_order"), sb.from("categories").select("*").order("sort_order")]);
  if (!alive()) return;
  if (s.error || c.error) throw (s.error || c.error);
  let services = toNum(s.data, ["price", "promo_price"]);
  const groups = () => [...c.data.map((x) => ({ id: x.id, name: x.name })), { id: null, name: "Sem categoria" }].map((g) => ({ ...g, list: services.filter((x) => x.category_id === g.id) })).filter((g) => g.list.length);

  const draw = () => {
    view.innerHTML = pageHeader("Preços", "Altere e saia do campo para gravar. O site atualiza de imediato.") + `
    <div class="card" style="margin-bottom:16px"><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
      <div style="flex:1;min-width:220px"><p style="font-size:14px;font-weight:600">Ajuste global</p><p style="font-size:14px;color:#6e6e73">Aumentar ou reduzir todos os preços numa percentagem (ex.: 5 ou -10).</p></div>
      <input class="inp" style="width:120px" inputmode="decimal" placeholder="5 %" aria-label="Percentagem" data-pct>${btn("Aplicar", { variant: "primary", attrs: "data-bulk" })}</div></div>
    ${groups().map((g) => `<div class="card tbl-wrap" style="margin-bottom:16px"><div class="ct"><h2>${esc(g.name)}</h2></div><table class="tbl">
      <thead><tr><th>Serviço</th><th style="width:110px">Preço €</th><th style="width:110px">Promo €</th><th style="width:140px">Etiqueta</th><th style="width:90px">Min</th><th class="num" style="width:80px">Site</th></tr></thead>
      <tbody>${g.list.map((x) => `<tr data-id="${x.id}" style="${x.active ? "" : "opacity:.5"}"><td style="font-weight:500">${esc(x.name)}</td>
        <td><input class="inp compact" data-f="price" inputmode="decimal" value="${x.price}" aria-label="Preço de ${esc(x.name)}"></td>
        <td><input class="inp compact" data-f="promo_price" inputmode="decimal" value="${x.promo_price ?? ""}" placeholder="—" aria-label="Preço promocional de ${esc(x.name)}"></td>
        <td><input class="inp compact" data-f="promo_label" value="${esc(x.promo_label ?? "")}" placeholder="Promoção" aria-label="Etiqueta de ${esc(x.name)}"></td>
        <td><input class="inp compact" data-f="duration" inputmode="numeric" value="${x.duration}" aria-label="Duração de ${esc(x.name)}"></td>
        <td class="num" style="font-weight:600" data-final>${euro(x.promo_price ?? x.price)}</td></tr>`).join("")}</tbody></table></div>`).join("")}`;
  };

  view.addEventListener("change", async (e) => {
    const inp = e.target.closest("[data-f]"); if (!inp) return;
    const tr = inp.closest("[data-id]"), x = services.find((s) => s.id === tr.dataset.id), f = inp.dataset.f;
    let v = inp.value.trim();
    v = f === "promo_label" ? (v || null) : v === "" ? null : Math.max(0, Number(v.replace(",", ".")));
    if (f !== "promo_label" && v != null && Number.isNaN(v)) { inp.value = x[f] ?? ""; return toast("error", "Valor inválido."); }
    if ((f === "price" || f === "duration") && v == null) { inp.value = x[f]; return toast("error", "Este campo não pode ficar vazio."); }
    if (f === "promo_price" && v != null && v >= x.price) { inp.value = x.promo_price ?? ""; return toast("error", "O preço promocional deve ser inferior ao preço."); }
    const { error } = await sb.from("services").update({ [f]: v }).eq("id", x.id);
    if (error) { inp.value = x[f] ?? ""; return fail(error); }
    x[f] = v; $("[data-final]", tr).textContent = euro(x.promo_price ?? x.price); toast("ok", "Guardado");
  });
  view.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-bulk]"); if (!b) return;
    const p = Number(String($("[data-pct]", view).value).replace(",", ".").replace("%", ""));
    if (!p) return toast("error", "Indique uma percentagem.");
    b.disabled = true;
    const updated = services.map((x) => ({ ...x, price: Math.round(x.price * (1 + p / 100) * 2) / 2 }));
    const res = await Promise.all(updated.map((x) => sb.from("services").update({ price: x.price }).eq("id", x.id)));
    const err = res.find((r) => r.error)?.error;
    if (err) { b.disabled = false; return fail(err); }
    services = updated; draw(); toast("ok", `Preços ajustados ${p > 0 ? "+" : ""}${p}% (arredondados a 0,50 €)`);
  });
  draw();
}

/* ============================================================ Promoções */
const today = () => toISODate(new Date());
function promoStatus(p) {
  if (!p.active) return badge("Inativa", "gray");
  if (p.end_date && p.end_date < today()) return badge("Expirada", "red");
  if (p.start_date && p.start_date > today()) return badge("Agendada", "blue");
  return badge("Ativa no site", "green");
}

/** Pré-visualização fiel ao cartão do site (cores e tipografia da marca). */
function promoPreview(p) {
  const pct = p.original_price && p.promo_price ? Math.round((1 - p.promo_price / p.original_price) * 100) : null;
  return `<article style="display:grid;overflow:hidden;border-radius:28px;background:#3B3430;color:#F8F5F0;font-family:Manrope,sans-serif">
    <div style="position:relative;height:200px;background:#EFE9E1">${p.image_url ? `<img src="${esc(p.image_url)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : nailArt({ seed: "promo-preview", category: "nail-art", aspect: "landscape" }).replace('class="nail-art"', 'class="nail-art" style="position:absolute;inset:0;width:100%;height:100%"')}
      ${pct > 0 ? `<div style="position:absolute;left:16px;top:16px;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.7);color:#3B3430;font-family:'Cormorant Garamond',Georgia,serif;font-size:24px">-${pct}%</div>` : ""}</div>
    <div style="padding:24px;display:grid;gap:12px">
      <p style="font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:#D7C2A3">${esc(p.label || "Promoção")}</p>
      <h3 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:400;font-size:34px;line-height:1">${esc(p.title || "Título da promoção")}</h3>
      ${p.description ? `<p style="color:rgba(248,245,240,.75);font-size:14px">${esc(p.description)}</p>` : ""}
      <div style="display:flex;align-items:baseline;gap:12px">${p.promo_price != null ? `<span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;line-height:1;color:#D7C2A3">${euro(p.promo_price)}</span>` : ""}${p.original_price != null ? `<s style="color:rgba(248,245,240,.5);font-size:18px">${euro(p.original_price)}</s>` : ""}</div>
      ${p.end_date ? `<p style="font-size:13px;color:rgba(248,245,240,.6)">Disponível até ${shortDate(p.end_date)}</p>` : ""}
      <span style="justify-self:start;padding:12px 22px;border-radius:999px;background:linear-gradient(170deg,#cdb284,#B89B68 50%,#9c8152);font-weight:600;font-size:14px">${esc(p.cta_text || "Aproveitar promoção")}</span>
    </div></article>`;
}

export async function promocoes(view, alive) {
  const sb = await sbc();
  view.innerHTML = pageHeader("Promoções", "As promoções expiradas desaparecem automaticamente do site.", btn("Nova promoção", { variant: "primary", icon: "plus", attrs: "data-new" })) + `<div class="card flush" id="list">${skeleton()}</div>`;
  const [p, s] = await Promise.all([sb.from("promotions").select("*").order("sort_order"), sb.from("services").select("id,name").order("sort_order")]);
  if (!alive()) return;
  if (p.error) throw p.error;
  let promos = toNum(p.data, ["original_price", "promo_price"]);
  const services = s.data ?? [];

  const draw = () => {
    const el = $("#list", view);
    if (!promos.length) { el.innerHTML = empty("tag", "Sem promoções", "No site aparece: “Sem promoções neste momento — mas temos sempre algo especial preparado para si.”", btn("Criar promoção", { variant: "primary", attrs: "data-new" })); return; }
    el.innerHTML = `<ul class="list" id="sortable">${promos.map((x) => `<li class="li" data-id="${x.id}">${grip()}
      <div class="main"><p class="t">${esc(x.title)}</p><p class="s">${x.promo_price != null ? euro(x.promo_price) : ""}${x.original_price != null ? ` (antes ${euro(x.original_price)})` : ""} · ${x.start_date ? shortDate(x.start_date) : "já"} → ${x.end_date ? shortDate(x.end_date) : "sem fim"}</p></div>
      ${promoStatus(x)}${toggle(x.active, 'data-active aria-label="Ativa"')}${btn("", { variant: "ghost", size: "sm", icon: "pencil", attrs: 'data-edit aria-label="Editar"' })}${delBtn(x.id)}</li>`).join("")}</ul>`;
    sortable($("#sortable", el), (ids) => { ids.forEach((id, i) => (promos.find((x) => x.id === id).sort_order = i + 1)); promos.sort((a, b) => a.sort_order - b.sort_order); return saveOrder("promotions", ids); });
  };

  function edit(x) {
    const isNew = !x;
    x ??= { title: "", description: "", label: "Esta semana", original_price: null, promo_price: null, image_url: null, service_id: null, start_date: today(), end_date: null, active: true, cta_text: "Aproveitar promoção" };
    drawer({
      title: isNew ? "Nova promoção" : "Editar promoção", wide: true, saveLabel: isNew ? "Publicar" : "Guardar",
      body: `<div class="grid2 promo-editor" style="align-items:start"><div class="stack">
        <div class="card stack">${field("Título", input("title", x.title, 'placeholder="Francesinha + Nail Art"'))}${field("Etiqueta", input("label", x.label, 'placeholder="Esta semana" data-type="nullable"'))}${field("Descrição", textarea("description", x.description, 'data-type="nullable"'))}</div>
        <div class="card"><div class="row c2">
          ${field("Preço original (€)", input("original_price", x.original_price ?? "", 'type="number" min="0" step="0.5" data-type="number"'))}
          ${field("Preço promocional (€)", input("promo_price", x.promo_price ?? "", 'type="number" min="0" step="0.5" data-type="number"'), '<span data-pct-hint></span>')}
          ${field("Data de início", input("start_date", x.start_date ?? "", 'type="date" data-type="nullable"'))}
          ${field("Data de fim", input("end_date", x.end_date ?? "", 'type="date" data-type="nullable"'))}</div></div>
        <div class="card stack">${field("Texto do botão (CTA)", input("cta_text", x.cta_text, 'data-type="nullable"'))}
          ${field("Ligar a um serviço", select("service_id", [["", "WhatsApp"], ...services.map((s) => [s.id, s.name])], x.service_id ?? "", 'data-type="nullable"'), "Com serviço: o botão abre a marcação. Sem serviço: abre o WhatsApp.")}
          ${field("Imagem", imageField("image_url", x.image_url, "promotions"))}${toggle(x.active, 'data-name="active"', "Ativa")}</div></div>
        <div style="position:sticky;top:0"><p class="preview-label">Pré-visualização</p><div class="preview" data-preview>${promoPreview(x)}</div></div></div>`,
      onMount: (body) => {
        const upd = () => {
          const f = readForm(body);
          $("[data-preview]", body).innerHTML = promoPreview(f);
          const pct = f.original_price && f.promo_price ? Math.round((1 - f.promo_price / f.original_price) * 100) : 0;
          $("[data-pct-hint]", body).textContent = pct > 0 ? `Desconto de ${pct}%` : "";
        };
        body.addEventListener("input", upd); body.addEventListener("imagechange", upd); upd();
      },
      onSave: async (body) => {
        const f = readForm(body);
        if (!f.title?.trim()) { toast("error", "O título é obrigatório."); return false; }
        if (f.start_date && f.end_date && f.end_date < f.start_date) { toast("error", "A data de fim é anterior à de início."); return false; }
        const row = isNew ? { ...f, sort_order: promos.length + 1 } : f;
        const { data, error } = isNew ? await sb.from("promotions").insert(row).select().single() : await sb.from("promotions").update(row).eq("id", x.id).select().single();
        if (error) { fail(error); return false; }
        const d = toNum([data], ["original_price", "promo_price"])[0];
        promos = isNew ? [...promos, d] : promos.map((y) => (y.id === d.id ? d : y));
        toast("ok", isNew ? "Promoção publicada" : "Promoção atualizada"); draw();
      },
    });
  }

  view.addEventListener("click", async (e) => {
    if (e.target.closest("[data-new]")) return edit(null);
    const li = e.target.closest("[data-id]"); if (!li) return;
    const x = promos.find((y) => y.id === li.dataset.id);
    if (e.target.closest("[data-edit]")) return edit(x);
    if (e.target.closest("[data-active]")) {
      const v = e.target.closest("[data-active]").getAttribute("aria-checked") === "true";
      const { error } = await sb.from("promotions").update({ active: v }).eq("id", x.id);
      if (error) return fail(error);
      x.active = v; draw(); toast("ok", "Atualizado");
    }
  });
  bindDelete(view, async (id) => {
    const { error } = await sb.from("promotions").delete().eq("id", id);
    if (error) return fail(error);
    promos = promos.filter((y) => y.id !== id); draw(); toast("ok", "Eliminada");
  });
  draw();
}
