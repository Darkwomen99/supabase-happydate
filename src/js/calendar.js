// /js/calendar.js — HappyDate Calendar (Supabase v2, production-ready, ESM)
import { Calendar } from "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.js";

// Клієнт беремо з window.supabase (його ініціалізуєш у /src/js/supabaseClient.js або /src/js/auth.js)
const supabase = window.supabase;

// ───────────────────────── helpers
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const hasAuthModule = typeof window.auth?.requireAuth === "function";

function colorByType(type) {
  switch ((type || "").toLowerCase()) {
    case "birthday":    return "#3b82f6";
    case "anniversary": return "#ec4899";
    case "name_day":    return "#10b981";
    case "holiday":
    case "event":
    default:            return "#8b5cf6";
  }
}

function esc(s = "") {
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function localDateTimeToISO(dateStr /* YYYY-MM-DD */, timeStr /* HH:mm */ = "09:00") {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm]  = (timeStr || "09:00").split(":").map(Number);
  const dt = new Date(y, (m - 1), d, hh || 0, mm || 0, 0, 0);
  return dt.toISOString();
}

function humanDate(isoOrYmd) {
  // Повертаємо YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(isoOrYmd))) return isoOrYmd;
  try {
    const d = new Date(isoOrYmd);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch { return String(isoOrYmd); }
}

// ───────────────────────── auth guard
async function ensureUser() {
  if (!supabase) {
    console.error("[calendar] Supabase client missing. Make sure /src/js/supabaseClient.js loaded first.");
    return null;
  }
  // 1) якщо є window.auth
  if (hasAuthModule) {
    try {
      const user = await window.auth.requireAuth({ redirectTo: "/pages/login.html" });
      return user;
    } catch { return null; }
  }
  // 2) fallback напряму
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    try {
      sessionStorage.setItem("happydate_post_login_redirect", location.pathname + location.search + location.hash);
    } catch {}
    location.href = "/pages/login.html";
    return null;
  }
  return session.user;
}

function attachAuthGuard() {
  supabase?.auth?.onAuthStateChange?.((_e, session) => {
    if (!session?.user) location.href = "/pages/login.html";
  });
}

// ───────────────────────── DB access (підтримка 2 схем)
function rowToEvent(row) {
  // Нова схема: start_at (timestamptz)
  // Стара схема: date (YYYY-MM-DD) +, можливо, time (HH:mm) — будемо вважати 09:00
  const start =
    row.start_at ? row.start_at :
    row.date     ? localDateTimeToISO(row.date, row.time || "09:00") :
    null;

  const title = `${row.person ? row.person + " " : ""}${row.title || ""}`.trim() || "Wydarzenie";

  return {
    id: row.id,
    title,
    start,
    color: colorByType(row.type),
    extendedProps: {
      type: row.type || "",
      person: row.person || ""
    }
  };
}

// Ми не знаємо напевно, який стовпець для user_id використовується (user_id чи uid),
// тому беремо по користувачу з OR і фільтруємо по діапазону в JS — це надійно й просто.
async function fetchEventsForRange(userId, startStr, endStr) {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,type,person,start_at,date,time,user_id,uid")
    .or(`user_id.eq.${userId},uid.eq.${userId}`)
    .order("start_at", { ascending: true })
    .order("date", { ascending: true });

  if (error) {
    console.error("[events] fetch error:", error);
    return [];
  }

  const startMs = new Date(startStr).getTime();
  const endMs   = new Date(endStr).getTime();

  return (data || [])
    .map(rowToEvent)
    .filter(ev => {
      if (!ev.start) return false;
      const t = new Date(ev.start).getTime();
      return t >= startMs && t < endMs;
    });
}

async function fetchNextEvents(userId, limit = 5) {
  const now = Date.now();
  const { data, error } = await supabase
    .from("events")
    .select("id,title,type,person,start_at,date,time,user_id,uid")
    .or(`user_id.eq.${userId},uid.eq.${userId}`);

  if (error) {
    console.error("[events] next error:", error);
    return [];
  }

  return (data || [])
    .map(rowToEvent)
    .filter(ev => ev.start && new Date(ev.start).getTime() >= now)
    .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, limit);
}

async function insertEvent(userId, { title, type, person, date, time }) {
  // Підтримуємо нову схему (user_id + start_at).
  // Якщо у тебе ще стара таблиця (uid + date), цей insert не спрацює.
  // РЕКОМЕНДАЦІЯ: мігруй таблицю на user_id/start_at (див. попередні інструкції).
  return supabase.from("events").insert({
    user_id: userId,
    title,
    type,
    person,
    start_at: localDateTimeToISO(date, time)
  });
}

async function updateEvent(eventId, { title, type, person, date, time }) {
  const patch = { title, type, person };
  if (date) patch.start_at = localDateTimeToISO(date, time);
  return supabase.from("events").update(patch).eq("id", eventId);
}

async function deleteEvent(eventId) {
  return supabase.from("events").delete().eq("id", eventId);
}

// ───────────────────────── UI helpers
function openModal() {
  const m = $("#eventModal");
  if (!m) return;
  m.classList.remove("hidden");
  $("#eventTitle")?.focus();
}

function closeModal(reset = true) {
  const modal = $("#eventModal");
  if (!modal) return;
  modal.classList.add("hidden");
  if (reset) $("#eventForm")?.reset();
  modal.removeAttribute("data-editing-id");
}

function fillFormFromEventObj(e) {
  const modal = $("#eventModal");
  modal?.setAttribute("data-editing-id", e.id);

  $("#eventTitle").value  = (e.title || "").replace(/\s*🎁$/, "").trim();
  $("#eventType").value   = e.extendedProps?.type || "";
  $("#eventPerson").value = e.extendedProps?.person || "";

  const dateIso = e.startStr || e.start?.toISOString?.() || e.start;
  $("#eventDate").value   = humanDate(dateIso);
  const time = (e.start?.toTimeString?.() || "").slice(0,5); // HH:mm
  if ($("#eventTime")) $("#eventTime").value = time || "09:00";
}

function readForm() {
  const title  = $("#eventTitle")?.value?.trim();
  const type   = $("#eventType")?.value?.trim();
  const person = $("#eventPerson")?.value?.trim();
  const date   = $("#eventDate")?.value;
  const time   = $("#eventTime")?.value || "09:00";
  return { title, type, person, date, time };
}

function setFeedback(msg, type = "info") {
  const box = $("#calendarFeedback");
  if (!box) return;
  box.textContent = msg || "";
  box.dataset.type = type;
  box.hidden = !msg;
  if (!box.hasAttribute("role")) box.setAttribute("role", "status");
  if (!box.hasAttribute("aria-live")) box.setAttribute("aria-live", "polite");
}

function updateEventList(events) {
  const box = $("#event-list");
  if (!box) return;
  if (!events.length) {
    box.innerHTML = `<div class="text-gray-500 text-center">Brak nadchodzących wydarzeń 🎈</div>`;
    return;
  }
  const html = events
    .slice()
    .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5)
    .map(e => {
      const who = (e.extendedProps?.person || "").trim() || e.title;
      return `
        <div class="bg-white/80 dark:bg-gray-800/60 rounded-xl px-4 py-3 shadow flex flex-col gap-1">
          <span class="font-semibold">${esc(who)} 🎁</span>
          <span class="text-xs text-gray-600">${esc(humanDate(e.start))}</span>
        </div>
      `;
    }).join("");
  box.innerHTML = html;
}

// Дебаунс для рефетчу
let refetchTimer;
function scheduleRefetch(calendar, user) {
  clearTimeout(refetchTimer);
  refetchTimer = setTimeout(async () => {
    await calendar.refetchEvents();
    const upcoming = await fetchNextEvents(user.id, 5);
    updateEventList(upcoming);
  }, 250);
}

// ───────────────────────── main
export async function initEventsPage() {
  if (!supabase) {
    console.error("[calendar] Supabase client is missing (window.supabase).");
    return;
  }

  attachAuthGuard();

  const user = await ensureUser();
  if (!user) return;

  const calendarEl = $("#calendar");
  if (!calendarEl) return;

  const calendar = new Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,
    dayMaxEvents: true,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,listMonth"
    },
    events: async (fetchInfo, successCb, failureCb) => {
      try {
        const rows = await fetchEventsForRange(user.id, fetchInfo.startStr, fetchInfo.endStr);
        successCb(rows);
      } catch (e) {
        console.error(e);
        failureCb(e);
      }
    },
    dateClick(info) {
      $("#eventDate").value = info.dateStr;
      if ($("#eventTime") && !$("#eventTime").value) $("#eventTime").value = "09:00";
      openModal();
    },
    eventClick(info) {
      fillFormFromEventObj(info.event);
      openModal();
    }
  });

  calendar.render();

  // Початкові 5 найближчих
  fetchNextEvents(user.id, 5).then(updateEventList).catch(() => {});

  // Realtime тільки для цього користувача
  const channel = supabase
    .channel("events-user-feed")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events", filter: `user_id=eq.${user.id}` },
      () => scheduleRefetch(calendar, user)
    )
    // якщо ще стара схема — дублюємо підписку і по uid
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events", filter: `uid=eq.${user.id}` },
      () => scheduleRefetch(calendar, user)
    )
    .subscribe();

  // Модалка / форма
  const modal = $("#eventModal");
  const form  = $("#eventForm");

  $("#closeModal")?.addEventListener("click", () => closeModal(true));
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(true); });

  document.addEventListener("keydown", (e) => {
    if (!modal || modal.classList.contains("hidden")) return;
    if (e.key === "Escape") closeModal(true);
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setFeedback("");

    const payload = readForm();
    if (!payload.title || !payload.date) {
      setFeedback("Wpisz tytuł i datę.", "error");
      return;
    }

    const editingId = modal.getAttribute("data-editing-id");
    try {
      if (editingId) {
        const { error } = await updateEvent(editingId, payload);
        if (error) throw error;
      } else {
        const { error } = await insertEvent(user.id, payload);
        if (error) throw error;
      }
      closeModal(true);
      scheduleRefetch(calendar, user);
    } catch (err) {
      console.error(err);
      setFeedback(err?.message || "Nie udało się zapisać wydarzenia.", "error");
    }
  });

  $("#deleteEvent")?.addEventListener("click", async () => {
    const editingId = modal.getAttribute("data-editing-id");
    if (!editingId) return;
    if (!confirm("Usunąć to wydarzenie?")) return;

    try {
      const { error } = await deleteEvent(editingId);
      if (error) throw error;
      closeModal(true);
      scheduleRefetch(calendar, user);
    } catch (err) {
      console.error(err);
      setFeedback(err?.message || "Nie udało się usunąć.", "error");
    }
  });

  window.addEventListener("beforeunload", () => {
    try { supabase.removeChannel(channel); } catch {}
  });
}

// Автозапуск
document.addEventListener("DOMContentLoaded", initEventsPage);
