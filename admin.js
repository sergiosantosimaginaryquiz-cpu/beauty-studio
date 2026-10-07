/* ============================================================
   Painel de gestão — autenticação, estrutura e navegação
   Rotas: admin.html#/dashboard, #/marcacoes, #/servicos, …
   ============================================================ */
import { isConfigured } from "./db.js";
import { $, $$, esc } from "./lib.js";
import { sbc, ic, toast, setBusy } from "./admin-ui.js";
import * as V1 from "./admin-views1.js";
import * as V2 from "./admin-views2.js";
import * as V3 from "./admin-views3.js";

const app = $("#app");
export const ROUTES = [
  { path: "dashboard", label: "Dashboard", icon: "dashboard", view: V1.dashboard },
  { path: "marcacoes", label: "Marcações", icon: "calCheck", view: V1.marcacoes },
  { path: "servicos", label: "Serviços", icon: "sparkles", view: V2.servicos },
  { path: "precos", label: "Preços", icon: "euro", view: V2.precos },
  { path: "promocoes", label: "Promoções", icon: "tag", view: V2.promocoes },
  { path: "disponibilidade", label: "Disponibilidade", icon: "clock", view: V3.disponibilidade },
  { path: "galeria", label: "Galeria", icon: "images", view: V3.galeria },
  { path: "clientes", label: "Clientes", icon: "users", view: V1.clientes },
  { path: "conteudo", label: "Conteúdo", icon: "file", view: V3.conteudo },
  { path: "definicoes", label: "Definições", icon: "settings", view: V3.definicoes },
];

let user = null;

async function start() {
  if (!isConfigured) return renderLogin("Supabase ainda não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY em config.js (ver README).");
  const sb = await sbc();
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") { user = null; renderLogin(); }
    if (event === "PASSWORD_RECOVERY") { location.hash = "#/definicoes"; toast("ok", "Defina uma nova palavra-passe em Definições → Conta."); }
    if (session?.user && !user) { user = session.user; renderShell(); }
  });
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) { user = session.user; renderShell(); } else renderLogin();
}

/* ---------------- Login ---------------- */
function renderLogin(warning = "") {
  app.innerHTML = `<main class="login"><form novalidate>
    <div class="lk">${ic("lock", 22)}</div><h1>Painel do estúdio</h1><p class="s">Beauty Studio Cátia Gonçalves</p>
    ${warning ? `<p class="warn">${esc(warning)}</p>` : ""}
    <div class="fields">
      <input type="email" name="email" required autocomplete="email" placeholder="Email" aria-label="Email">
      <input type="password" name="password" required autocomplete="current-password" placeholder="Palavra-passe" aria-label="Palavra-passe">
    </div>
    <p class="msg" role="alert"></p>
    <button class="go" ${warning ? "disabled" : ""}>Entrar</button>
    <button type="button" class="link" data-reset>Esqueci-me da palavra-passe</button></form></main>`;
  const form = $("form", app), msg = $(".msg", app);
  form.onsubmit = async (e) => {
    e.preventDefault(); msg.className = "msg"; msg.textContent = "";
    const b = $(".go", form); setBusy(b, true);
    const sb = await sbc();
    const { error } = await sb.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
    setBusy(b, false);
    if (error) { msg.className = "msg err"; msg.textContent = /invalid/i.test(error.message) ? "Email ou palavra-passe incorretos." : error.message; }
  };
  $("[data-reset]", form).onclick = async () => {
    if (!isConfigured) return;
    if (!form.email.value) { msg.className = "msg err"; msg.textContent = "Escreva o seu email primeiro."; return; }
    const sb = await sbc();
    const { error } = await sb.auth.resetPasswordForEmail(form.email.value.trim(), { redirectTo: location.href.split("#")[0] });
    msg.className = `msg ${error ? "err" : "ok"}`; msg.textContent = error ? error.message : "Enviámos um email para redefinir a palavra-passe.";
  };
}

/* ---------------- Estrutura ---------------- */
const sidebar = (pending) => `<div class="brand"><small>✦ Beauty Studio</small><b>Cátia Gonçalves</b></div>
  <nav><ul>${ROUTES.map((r) => `<li><a href="#/${r.path}" data-path="${r.path}">${ic(r.icon, 17)}${r.label}${r.path === "marcacoes" && pending ? `<span class="count">${pending}</span>` : ""}</a></li>`).join("")}</ul></nav>
  <div class="bottom"><a href="index.html" target="_blank">${ic("external")}Ver site</a><button data-logout>${ic("logout")}Terminar sessão</button><p class="email">${esc(user.email ?? "")}</p></div>`;

async function renderShell() {
  const sb = await sbc();
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || !isAdmin) {
    app.innerHTML = `<main class="login"><div class="card" style="max-width:380px;text-align:center"><h1 style="font-size:20px">Sem permissão</h1>
      <p style="margin-top:8px;color:#6e6e73;font-size:14px">A conta ${esc(user.email)} não é administradora. Adicione-a à tabela <code>admins</code> (ver README).</p>
      <button class="abtn primary" style="margin-top:20px" data-logout>Terminar sessão</button></div></main>`;
    return bindGlobal();
  }
  const { count } = await sb.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending");
  app.innerHTML = `<aside class="side" aria-label="Menu">${sidebar(count ?? 0)}</aside>
    <div class="topbar"><span>Painel</span><button class="iconbtn" data-open-menu aria-label="Abrir menu">${ic("menu", 20)}</button></div>
    <div class="main-area"><main class="content" id="view" tabindex="-1"></main></div>`;
  bindGlobal();
  route();
}

function bindGlobal() {
  app.onclick = async (e) => {
    if (e.target.closest("[data-logout]")) { (await sbc()).auth.signOut(); }
    if (e.target.closest("[data-open-menu]")) {
      const m = document.createElement("div");
      m.className = "mobile-nav"; m.innerHTML = `<div class="scrim"></div><aside class="side">${sidebar(0)}</aside>`;
      document.body.append(m); markActive(m);
      m.onclick = async (ev) => {
        if (ev.target.classList.contains("scrim") || ev.target.closest("a")) m.remove();
        if (ev.target.closest("[data-logout]")) { m.remove(); (await sbc()).auth.signOut(); }
      };
    }
  };
}

const current = () => (location.hash.replace(/^#\/?/, "").split("?")[0] || "dashboard");
function markActive(root = document) {
  $$("[data-path]", root).forEach((a) => a.dataset.path === current() ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
}

let token = 0;
async function route() {
  const old = $("#view"); if (!old || !user) return;
  const view = old.cloneNode(false); old.replaceWith(view); // remove listeners da vista anterior
  const r = ROUTES.find((x) => x.path === current()) ?? ROUTES[0];
  markActive();
  document.title = `${r.label} | Painel`;
  const my = ++token;
  try { await r.view(view, () => my === token); }
  catch (e) { console.error(e); view.innerHTML = `<div class="card"><p style="font-weight:600">Ups! Algo não correu como esperado.</p><p style="color:#6e6e73;margin-top:4px">${esc(e.message ?? e)}</p></div>`; }
  view.focus({ preventScroll: true });
  scrollTo(0, 0);
}
addEventListener("hashchange", route);

start();
