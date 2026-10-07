/* ============================================================
   Acesso a dados — Supabase (produção) ou demonstração local
   ============================================================ */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { toISODate } from "./lib.js";

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise = null;
/** Cliente Supabase (carregado a pedido a partir de CDN). */
export function supabase() {
  if (!isConfigured) return Promise.resolve(null);
  clientPromise ??= import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
    .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, storageKey: "bscg-admin" } }));
  return clientPromise;
}

/* ---------------- Dados de demonstração (espelham supabase/02_seed.sql) ---------------- */
const svc = (id, name, description, category_id, price, duration, featured = false, sort_order = 0, promo_price = null) =>
  ({ id, name, description, category_id, price, promo_price, promo_label: promo_price ? "Promoção" : null, duration, image_url: null, featured, active: true, sort_order });
const endOfMonth = () => { const d = new Date(); return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

export const demoData = {
  settings: {
    id: 1, business_name: "Beauty Studio Cátia Gonçalves", phone: "+351 900 000 000", whatsapp: "351900000000",
    whatsapp_message: "Olá! Gostaria de marcar uma sessão no Beauty Studio Cátia Gonçalves.",
    email: "ola@beautystudiocatia.pt", address: "Av. Amália Rodrigues", address_line2: "Moinhos da Funcheira",
    postal_code: "2650-000", city: "Amadora", parking_info: "Estacionamento gratuito na rua, junto ao estúdio.",
    instagram: "https://www.instagram.com/beautystudiocatia", facebook: null, tiktok: null,
    google_maps_url: "https://maps.google.com/?q=Av.+Amália+Rodrigues,+Moinhos+da+Funcheira",
    google_maps_embed: null, slot_interval: 30, min_notice_hours: 12, booking_window_days: 60,
  },
  content: {
    hero: { section: "hero", title: "A beleza está nos detalhes.", subtitle: "Manicure, nail art e cuidados personalizados para realçar a sua beleza.", cta_text: "Marcar sessão", image_url: null, extra: { secondary_cta: "Ver trabalhos", tagline: "Manicure • Nail Art • Cuidados" }, active: true },
    about: { section: "about", title: "Mais do que unhas. Um momento para si.", subtitle: "Olá, sou a Cátia.", body: "Criei este estúdio para ser um lugar onde cada detalhe é pensado para si. Trabalho com técnicas atuais, produtos de qualidade profissional e muita atenção à saúde das suas unhas — porque um resultado bonito começa sempre por um cuidado verdadeiro.", cta_text: "Conhecer o estúdio", image_url: null, extra: { stats: [{ value: "8+", label: "anos de experiência" }, { value: "2000+", label: "clientes felizes" }, { value: "100%", label: "material esterilizado" }], philosophy: "Precisão, higiene e um atendimento pessoal, sem pressas." }, active: true },
    studio: { section: "studio", title: "Um espaço pensado para si.", subtitle: "Luz natural, calma e conforto — venha conhecer o estúdio.", cta_text: "Como chegar", image_url: null, extra: {}, active: true },
    promotions: { section: "promotions", title: "Momentos especiais", subtitle: "Sem promoções neste momento", body: "Mas temos sempre algo especial preparado para si.", extra: {}, active: true },
    instagram: { section: "instagram", title: "Siga o nosso trabalho", subtitle: "Inspiração diária, novos designs e bastidores do estúdio.", cta_text: "@beautystudiocatia", extra: {}, active: true },
    booking: { section: "booking", title: "Pronta para o seu momento?", subtitle: "Escolha o serviço, a data e a hora. Nós tratamos do resto.", cta_text: "Marcar sessão", extra: {}, active: true },
  },
  categories: [
    { id: "c1", name: "Manicure", slug: "manicure", description: "Cuidado completo das mãos e unhas naturais.", sort_order: 1, active: true },
    { id: "c2", name: "Unhas de gel", slug: "gel", description: "Aplicação, manutenção e extensão em gel.", sort_order: 2, active: true },
    { id: "c3", name: "Nail Art", slug: "nail-art", description: "Detalhes desenhados à mão, à sua medida.", sort_order: 3, active: true },
  ],
  services: [
    svc("s1", "Manicure", "Limpeza, cutículas e hidratação. Acabamento com verniz tradicional.", "c1", 15, 45, false, 1),
    svc("s2", "Manicure com verniz gel", "Cuidado completo + acabamento perfeito que dura até 3 semanas.", "c1", 22, 60, true, 2),
    svc("s3", "Manicure francesa", "O clássico intemporal, com linha fina e precisa.", "c1", 25, 60, false, 3),
    svc("s4", "Manutenção de verniz gel", "Remoção, preparação e nova aplicação.", "c1", 20, 60, false, 4),
    svc("s5", "Aplicação de gel", "Unhas de gel sobre a unha natural, com forma à sua escolha.", "c2", 35, 90, true, 1),
    svc("s6", "Manutenção de gel", "Preenchimento e reequilíbrio da estrutura.", "c2", 30, 75, false, 2, 25),
    svc("s7", "Extensão de gel", "Extensão com molde para o comprimento que deseja.", "c2", 45, 120, false, 3),
    svc("s8", "Remoção de gel", "Remoção cuidada, sem danificar a unha natural.", "c2", 12, 30, false, 4),
    svc("s9", "Nail Art simples", "Pequenos detalhes: linhas, pontos, foil ou pedras.", "c3", 5, 15, false, 1),
    svc("s10", "Francesinha", "Francesa clássica, colorida ou invertida.", "c3", 8, 20, false, 2),
    svc("s11", "Nail Art personalizada", "Um design criado para si, unha a unha.", "c3", 15, 45, true, 3),
  ],
  promotions: [{ id: "pr1", title: "Francesinha + Nail Art", description: "Verniz gel com francesinha e um detalhe de nail art à sua escolha.", label: "Esta semana", original_price: 35, promo_price: 29, image_url: null, service_id: null, start_date: toISODate(new Date()), end_date: endOfMonth(), active: true, cta_text: "Aproveitar promoção", sort_order: 0 }],
  gallery: [
    ["Nude acetinado", "verniz-gel", "portrait", true], ["Francesa fina", "francesinhas", "square", false],
    ["Pérolas e dourado", "nail-art", "landscape", true], ["Rosa pó", "manicure", "portrait", false],
    ["Amêndoa natural", "gel", "square", false], ["Linhas douradas", "nail-art", "portrait", false],
    ["Francesa invertida", "francesinhas", "portrait", false], ["Leitoso", "verniz-gel", "square", false],
  ].map(([title, category, aspect, featured], i) => ({ id: `g${i}`, image_url: null, title, category, description: null, aspect, featured, active: true, sort_order: i })),
  instagram: ["Nude clássico", "Francesa", "Detalhe dourado", "Rosa pó", "Nail art", "O estúdio"].map((caption, i) => ({ id: `ig${i}`, image_url: null, caption, permalink: null, active: true, sort_order: i })),
  availability: [1, 2, 3, 4, 5].map((d) => ({ id: `av${d}`, day_of_week: d, start_time: "09:00:00", end_time: "18:00:00", active: true }))
    .concat([{ id: "av6", day_of_week: 6, start_time: "09:00:00", end_time: "13:00:00", active: true }]),
  blocked: [
    { id: "b1", date: "2026-12-24", end_date: null, kind: "closed", reason: "Véspera de Natal", start_time: null, end_time: null },
    { id: "b2", date: "2026-12-25", end_date: null, kind: "closed", reason: "Natal", start_time: null, end_time: null },
    { id: "b3", date: "2026-12-26", end_date: null, kind: "special", reason: "Horário especial", start_time: "10:00:00", end_time: "16:00:00" },
  ],
};

const num = (r, keys) => { const o = { ...r }; keys.forEach((k) => { if (o[k] != null) o[k] = Number(o[k]); }); return o; };

/** Todos os dados públicos do site (uma ida à base de dados, em paralelo). */
export async function getSiteData() {
  const sb = await supabase();
  if (!sb) return demoData;
  const today = toISODate(new Date());
  const yearAgo = toISODate(new Date(Date.now() - 365 * 864e5));
  const res = await Promise.all([
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("content").select("*"),
    sb.from("categories").select("*").order("sort_order"),
    sb.from("services").select("*").order("sort_order"),
    sb.from("promotions").select("*").order("sort_order").order("end_date"),
    sb.from("gallery").select("*").order("sort_order"),
    sb.from("instagram_posts").select("*").order("sort_order").limit(12),
    sb.from("availability").select("*").order("day_of_week").order("start_time"),
    sb.from("blocked_dates").select("*").gte("date", yearAgo).order("date"),
  ]);
  const err = res.find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  const [settings, content, categories, services, promotions, gallery, instagram, availability, blocked] = res.map((r) => r.data);
  const map = {}; (content ?? []).forEach((c) => (map[c.section] = c));
  return {
    settings: settings ?? demoData.settings, content: map, categories: categories ?? [],
    services: (services ?? []).map((s) => num(s, ["price", "promo_price"])),
    promotions: (promotions ?? []).map((p) => num(p, ["original_price", "promo_price"]))
      .filter((p) => (!p.end_date || p.end_date >= today) && (!p.start_date || p.start_date <= today)),
    gallery: gallery ?? [], instagram: instagram ?? [], availability: availability ?? [], blocked: blocked ?? [],
  };
}

export async function getBusySlots(date) {
  const sb = await supabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc("get_busy_slots", { p_date: date });
  if (error) throw error;
  return (data ?? []).map((r) => ({ start_time: r.start_time.slice(0, 5), duration: r.duration }));
}

export async function requestAppointment(p) {
  const sb = await supabase();
  if (!sb) return { demo: true };
  const { error } = await sb.rpc("request_appointment", {
    p_service_id: p.service_id, p_date: p.date, p_time: p.time, p_name: p.name, p_phone: p.phone,
    p_email: p.email || null, p_notes: p.notes || null,
  });
  if (error) throw error;
  return { demo: false };
}

/** Regista um clique no WhatsApp (aparece no painel). */
export function trackLead(context, message) {
  supabase().then((sb) => sb?.from("leads").insert({
    channel: "whatsapp", context: String(context).slice(0, 400), message: message ? String(message).slice(0, 1000) : null, page: location.pathname,
  })).catch(() => {});
}
