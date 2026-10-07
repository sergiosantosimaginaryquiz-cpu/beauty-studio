/* ============================================================
   Painel — componentes de interface (vanilla)
   ============================================================ */
import { supabase } from "./db.js";
import { $, $$, esc } from "./lib.js";

export const sbc = () => supabase();

/* ---------------- Ícones (linha) ---------------- */
const P = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  calCheck: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path d="M19 3v4M17 5h4"/>',
  euro: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', images: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  settings: '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>', check: '<path d="M20 6 9 17l-5-5"/>', checks: '<path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  imagePlus: '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M16 5h6M19 2v6"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  calX: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4M14 14l-4 4"/>', msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', arrowUp: '<path d="m18 15-6-6-6 6"/>', arrowDown: '<path d="m6 9 6 6 6-6"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>', loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
};
export const ic = (n, s = 16, cls = "") => `<svg class="${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] ?? ""}</svg>`;

/* ---------------- Toasts ---------------- */
let toastBox;
export function toast(kind, text) {
  toastBox ??= Object.assign(document.body.appendChild(document.createElement("div")), { className: "toasts", ariaLive: "polite" });
  const t = document.createElement("div");
  t.className = `toast ${kind}`; t.innerHTML = `<span class="dot"></span>${esc(text)}`;
  toastBox.append(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3600);
}
export const fail = (e) => toast("error", e?.message ?? String(e));

/* ---------------- HTML helpers ---------------- */
export const pageHeader = (title, subtitle = "", actions = "") => `<div class="ph"><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div>${actions ? `<div class="ph-actions">${actions}</div>` : ""}</div>`;
export const btn = (label, { variant = "secondary", size = "", attrs = "", icon } = {}) => `<button type="button" class="abtn ${variant} ${size}" ${attrs}>${icon ? ic(icon, 15) : ""}${label}</button>`;
export const badge = (text, tone = "gray") => `<span class="badge-a ${tone}">${esc(text)}</span>`;
export const toggle = (checked, attrs = "", label = "") => `<button type="button" role="switch" class="switch" aria-checked="${!!checked}" ${attrs} ${label ? "" : 'aria-label="Ativar/desativar"'}><span class="track"><span class="thumb"></span></span>${label ? `<span>${esc(label)}</span>` : ""}</button>`;
export const field = (label, input, hint = "") => `<label class="lab"><span>${esc(label)}</span>${input}${hint ? `<small>${hint}</small>` : ""}</label>`;
export const input = (name, value = "", attrs = "") => `<input class="inp" name="${name}" value="${esc(value ?? "")}" ${attrs}>`;
export const textarea = (name, value = "", attrs = "") => `<textarea class="inp" name="${name}" ${attrs}>${esc(value ?? "")}</textarea>`;
export const select = (name, options, value, attrs = "") => `<select class="inp" name="${name}" ${attrs}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
export const empty = (iconName, title, text = "", action = "") => `<div class="empty-a"><div class="ei">${ic(iconName, 24)}</div><p class="et">${esc(title)}</p>${text ? `<p class="ex">${esc(text)}</p>` : ""}${action ? `<div style="margin-top:20px">${action}</div>` : ""}</div>`;
export const skeleton = (h = 160) => `<div class="card"><div class="skel" style="height:${h}px"></div></div>`;

/** Lê os campos [name] de um contentor para um objeto. */
export function readForm(root) {
  const o = {};
  $$("[name]", root).forEach((el) => {
    const t = el.dataset.type;
    let v = el.value;
    if (t === "number") v = v === "" ? null : Number(String(v).replace(",", "."));
    else if (t === "nullable") v = v.trim() === "" ? null : v;
    o[el.name] = v;
  });
  $$("[role=switch][data-name]", root).forEach((el) => (o[el.dataset.name] = el.getAttribute("aria-checked") === "true"));
  $$("[data-image]", root).forEach((el) => (o[el.dataset.image] = el.dataset.value || null));
  return o;
}

/* Interruptores: alternam no clique (delegação global) */
document.addEventListener("click", (e) => {
  const s = e.target.closest("[role=switch]");
  if (s && !s.disabled) s.setAttribute("aria-checked", String(s.getAttribute("aria-checked") !== "true"));
}, true);

/* ---------------- Painel lateral (editor) ---------------- */
export function drawer({ title, body, wide = false, onSave, saveLabel = "Guardar", onMount }) {
  const prev = document.activeElement;
  const d = document.createElement("div");
  d.className = "drawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", title);
  d.innerHTML = `<div class="scrim"></div><div class="panel-d ${wide ? "wide" : ""}">
    <header><h2>${esc(title)}</h2><button class="iconbtn" data-close aria-label="Fechar">${ic("x", 18)}</button></header>
    <div class="dbody">${body}</div>
    ${onSave ? `<footer>${btn("Cancelar", { attrs: "data-close" })}${btn(saveLabel, { variant: "primary", attrs: "data-save" })}</footer>` : ""}</div>`;
  document.body.append(d); document.body.style.overflow = "hidden";
  requestAnimationFrame(() => d.classList.add("open"));
  const close = () => { d.classList.remove("open"); document.body.style.overflow = ""; removeEventListener("keydown", key); setTimeout(() => d.remove(), 350); prev?.focus?.(); };
  const key = (e) => e.key === "Escape" && close();
  addEventListener("keydown", key);
  d.addEventListener("click", async (e) => {
    if (e.target.closest("[data-close]") || e.target.classList.contains("scrim")) return close();
    const s = e.target.closest("[data-save]");
    if (s && onSave) { setBusy(s, true); const ok = await onSave($(".dbody", d)); setBusy(s, false); if (ok !== false) close(); }
  });
  onMount?.($(".dbody", d), close);
  setTimeout(() => $("input, select, textarea", d)?.focus(), 350);
  return { el: d, close };
}

export function setBusy(b, on) {
  b.disabled = on;
  if (on) { b.dataset.html = b.innerHTML; b.innerHTML = `${ic("loader", 15, "spin")}${b.textContent}`; }
  else if (b.dataset.html) b.innerHTML = b.dataset.html;
}

/** Botão eliminar com confirmação em linha. */
export const delBtn = (id) => `<span class="del" data-del="${esc(id)}">${btn("", { variant: "danger", size: "sm", icon: "trash", attrs: 'data-ask aria-label="Eliminar"' })}</span>`;
export function bindDelete(root, onConfirm) {
  root.addEventListener("click", async (e) => {
    const wrap = e.target.closest("[data-del]"); if (!wrap) return;
    if (e.target.closest("[data-ask]")) {
      wrap.innerHTML = `${btn("Confirmar", { variant: "danger", size: "sm", attrs: "data-yes" })}${btn("Cancelar", { variant: "ghost", size: "sm", attrs: "data-no" })}`;
    } else if (e.target.closest("[data-no]")) {
      wrap.outerHTML = delBtn(wrap.dataset.del);
    } else if (e.target.closest("[data-yes]")) {
      setBusy(e.target.closest("button"), true); await onConfirm(wrap.dataset.del);
    }
  });
}

/* ---------------- Upload de imagens (Supabase Storage) ---------------- */
export async function uploadImage(file, folder) {
  if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: imagem demasiado grande (máx. 8 MB).`);
  const sb = await sbc();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export const imageField = (name, value, folder, ratio = "4/3") => `<div class="imgf" data-image="${name}" data-folder="${folder}" data-value="${esc(value ?? "")}" style="aspect-ratio:${ratio}">${imgInner(value)}<input type="file" accept="image/*" hidden></div>`;
const imgInner = (v) => v
  ? `<img src="${esc(v)}" alt=""><div class="imgf-act">${btn("Substituir", { size: "sm", attrs: "data-pick" })}${btn("", { variant: "danger", size: "sm", icon: "trash", attrs: 'data-clear aria-label="Remover imagem"' })}</div>`
  : `<button type="button" class="imgf-empty" data-pick>${ic("imagePlus", 22)}<span>Arraste ou clique para carregar</span></button>`;

/* Delegação global para campos de imagem */
document.addEventListener("click", (e) => {
  const f = e.target.closest(".imgf"); if (!f) return;
  if (e.target.closest("[data-pick]")) $("input[type=file]", f).click();
  if (e.target.closest("[data-clear]")) setImg(f, null);
});
document.addEventListener("change", (e) => { const f = e.target.closest(".imgf"); if (f && e.target.files?.[0]) handleImg(f, e.target.files[0]); });
document.addEventListener("dragover", (e) => { if (e.target.closest(".imgf")) e.preventDefault(); });
document.addEventListener("drop", (e) => { const f = e.target.closest(".imgf"); if (f && e.dataTransfer.files[0]) { e.preventDefault(); handleImg(f, e.dataTransfer.files[0]); } });
async function handleImg(f, file) {
  f.classList.add("busy");
  try { setImg(f, await uploadImage(file, f.dataset.folder)); } catch (err) { fail(err); }
  f.classList.remove("busy");
}
function setImg(f, url) {
  f.dataset.value = url ?? "";
  const inputEl = $("input[type=file]", f);
  f.innerHTML = imgInner(url); f.append(inputEl); inputEl.value = "";
  f.dispatchEvent(new CustomEvent("imagechange", { bubbles: true, detail: url }));
}

/* ---------------- Ordenação por arrastar (rato, toque e teclado) ---------------- */
/**
 * Torna os filhos [data-id] de `list` ordenáveis.
 * Pega: [data-grip] (arrastar) · setas ↑/↓ no teclado com a pega em foco.
 */
export function sortable(list, onReorder) {
  let dragEl = null, startY = 0, startX = 0, pointerId = null;
  const ids = () => $$(":scope > [data-id]", list).map((e) => e.dataset.id);
  const commit = () => onReorder(ids());

  list.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("[data-grip]"); if (!g || !list.contains(g)) return;
    dragEl = g.closest("[data-id]"); pointerId = e.pointerId; startY = e.clientY; startX = e.clientX;
    dragEl.classList.add("dragging"); g.setPointerCapture(pointerId); e.preventDefault();
  });
  list.addEventListener("pointermove", (e) => {
    if (!dragEl || e.pointerId !== pointerId) return;
    dragEl.style.transform = `translate(${e.clientX - startX}px, ${e.clientY - startY}px)`;
    const others = $$(":scope > [data-id]:not(.dragging)", list);
    const target = others.find((o) => { const r = o.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; });
    if (target) {
      const r = target.getBoundingClientRect();
      const before = list.classList.contains("grid") ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2;
      const old = dragEl.getBoundingClientRect();
      list.insertBefore(dragEl, before ? target : target.nextSibling);
      const now = dragEl.getBoundingClientRect();
      startX += now.left - old.left; startY += now.top - old.top;
      dragEl.style.transform = `translate(${e.clientX - startX}px, ${e.clientY - startY}px)`;
    }
  });
  const end = () => { if (!dragEl) return; dragEl.classList.remove("dragging"); dragEl.style.transform = ""; dragEl = null; commit(); };
  list.addEventListener("pointerup", end); list.addEventListener("pointercancel", end);
  list.addEventListener("keydown", (e) => {
    const g = e.target.closest("[data-grip]"); if (!g || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const item = g.closest("[data-id]");
    const back = e.key === "ArrowUp" || e.key === "ArrowLeft";
    const sib = back ? item.previousElementSibling : item.nextElementSibling;
    if (!sib) return;
    list.insertBefore(item, back ? sib : sib.nextSibling);
    $("[data-grip]", item).focus(); commit();
  });
}
export const grip = () => `<button type="button" class="grip" data-grip aria-label="Arrastar para reordenar (ou use as setas)">${ic("grip", 16)}</button>`;

/** Grava sort_order 1..n numa tabela. */
export async function saveOrder(table, ids) {
  const sb = await sbc();
  const res = await Promise.all(ids.map((id, i) => sb.from(table).update({ sort_order: i + 1 }).eq("id", id)));
  const err = res.find((r) => r.error)?.error;
  if (err) fail(err); else toast("ok", "Ordem atualizada");
}
