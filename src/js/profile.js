// /src/js/profile.js — HappyDate (Supabase v2, clean & safe)
import { supabase } from "/src/js/supabaseClient.js";

(() => {
  "use strict";

  /* ───────────────────────────── helpers ───────────────────────────── */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const toast = (() => {
    let tId = null;
    return (msg, color = "bg-green-600") => {
      const el = document.createElement("div");
      el.role = "status";
      el.className = `fixed top-8 right-8 z-50 px-5 py-3 rounded-xl text-white font-semibold shadow-xl transition-all duration-300 ${color}`;
      el.textContent = msg;
      document.body.appendChild(el);
      clearTimeout(tId);
      tId = setTimeout(() => el.remove(), 3000);
    };
  })();

  const calcLevel = (points) =>
    points >= 100 ? "Ekspert" :
    points >=  40 ? "Znawca"  :
    points >=  20 ? "Entuzjasta" : "Nowicjusz";

  const normalizeDate = (str) => {
    const v = String(str || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const d = new Date(v);
    return Number.isNaN(+d) ? null : v;
  };

  // безпечний фабрикатор елементів
  const h = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") el.className = v;
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k in el) el[k] = v;
      else el.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      if (typeof c === "string") el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  };

  const sanitizeFilename = (name) =>
    String(name || "file")
      .replace(/[^\w.\-]+/g, "_")
      .slice(0, 80);

  /* ───────────────────────────── main ───────────────────────────── */
  document.addEventListener("DOMContentLoaded", async () => {
    // Auth gate
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      location.href = "/pages/login.html";
      return;
    }
    const userId = session.user.id;

    // UI refs
    const form           = $("#profile-form");
    const nameInput      = $("#name");
    const surnameInput   = $("#surname");
    const emailInput     = $("#email");
    const phoneInput     = $("#phone");
    const birthdateInput = $("#birthdate");
    const genderSelect   = $("#gender");
    const prefTextarea   = $("#preferences");

    const photoInput     = $("#photoFile");
    const userPhoto      = $("#user-photo");
    const userPoints     = $("#userPoints");
    const userLevel      = $("#user-level");
    const logoutBtn      = $("#logout-btn");

    const eventList      = $("#event-list");
    const eventEmpty     = $("#event-empty");
    const eventForm      = $("#eventForm");
    const eventModal     = $("#eventModal");

    const historyList    = $("#history-list");
    const referralBtn    = $("#referral-btn");

    // Lang dropdown (легкий init; не ламає, якщо i18n відсутній)
    const langBtn  = $("#langDropdownBtn");
    const langDD   = $("#langDropdown");
    const langFlag = $("#langFlag");
    const langMap  = { pl: "🇵🇱", ua: "🇺🇦", en: "🇬🇧", ru: "🇷🇺", de: "🇩🇪" };
    const getLang  = () => window.i18n?.getLang?.() || localStorage.getItem("lang") || (navigator.language || "pl").slice(0, 2);
    const setFlag  = () => { if (langFlag) langFlag.textContent = langMap[getLang()] || "🌐"; };

    setFlag();
    if (langBtn && langDD) {
      langBtn.setAttribute("aria-expanded", "false");
      langBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nowHidden = langDD.classList.toggle("hidden");
        langBtn.setAttribute("aria-expanded", String(!nowHidden));
      });
      document.addEventListener("click", () => {
        if (!langDD.classList.contains("hidden")) {
          langDD.classList.add("hidden");
          langBtn.setAttribute("aria-expanded", "false");
        }
      });
      langDD.querySelectorAll("button[data-lang]")?.forEach((b) => {
        b.addEventListener("click", async () => {
          const lng = b.dataset.lang;
          if (window.i18n?.setLang) { await window.i18n.setLang(lng, { persist: true }); setFlag(); }
          else { localStorage.setItem("lang", lng); location.reload(); }
        });
      });
    }

    // Logout
    logoutBtn?.addEventListener("click", async () => {
      try {
        await supabase.auth.signOut();
        toast("Wylogowano ✅");
      } finally {
        setTimeout(() => (location.href = "/pages/login.html"), 600);
      }
    });

    let loadedPoints = 0;

    /* ───────────── profile: load ───────────── */
    async function loadProfile() {
      try {
        const [{ data: prof, error }, userRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase.auth.getUser()
        ]);
        if (error) throw error;

        const p = prof || {};
        const email = userRes?.data?.user?.email || "";

        if (nameInput)       nameInput.value = p.name || "";
        if (surnameInput)    surnameInput.value = p.surname || "";
        if (emailInput)      emailInput.value = email;
        if (phoneInput)      phoneInput.value = p.phone || "";
        if (birthdateInput)  birthdateInput.value = p.birthdate || "";
        if (genderSelect)    genderSelect.value = p.gender || "";
        if (prefTextarea)    prefTextarea.value = p.preferences || "";

        const avatar =
          p.photo_url ||
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          "https://api.dicebear.com/8.x/fun-emoji/svg?seed=gift";
        if (userPhoto) {
          userPhoto.src = avatar;
          userPhoto.alt = p.name ? `${p.name} — avatar` : "Profil użytkownika";
          userPhoto.referrerPolicy = "no-referrer";
        }

        loadedPoints = Number.isFinite(+p.points) ? +p.points : 0;
        if (userPoints) userPoints.textContent = `${loadedPoints} pkt`;
        if (userLevel)  userLevel.textContent  = calcLevel(loadedPoints);
      } catch (e) {
        console.error("[profile] loadProfile:", e);
        toast("Nie udało się wczytać profilu.", "bg-red-600");
      }
    }

    /* ───────────── profile: save ───────────── */
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const name        = nameInput?.value?.trim() || "";
        const surname     = surnameInput?.value?.trim() || "";
        const phone       = phoneInput?.value?.trim() || "";
        const birthdate   = normalizeDate(birthdateInput?.value);
        const gender      = (genderSelect?.value || "") || null;
        const preferences = prefTextarea?.value?.trim() || "";

        // бонус за заповнення (одноразово піднімаємо до 20, якщо було менше)
        const filledCount = [name, surname, phone, birthdate, gender, preferences].filter(Boolean).length;
        const completionBonus = filledCount >= 5 ? 20 : 0;
        const nextPoints = loadedPoints < completionBonus ? completionBonus : loadedPoints;

        const patch = { id: userId, name, surname, phone, birthdate, gender, preferences, points: nextPoints };

        // avatar upload (опційно, до 5MB)
        if (photoInput?.files?.[0]) {
          const file = photoInput.files[0];
          if (!file.type.startsWith("image/")) throw new Error("Plik musi być obrazem.");
          const MAX_MB = 5;
          if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Maksymalny rozmiar: ${MAX_MB}MB.`);
          const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
          const path = `avatars/${userId}/${filename}`;
          const { error: upErr } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
          if (pub?.publicUrl) {
            patch.photo_url = pub.publicUrl;
            if (userPhoto) userPhoto.src = pub.publicUrl;
          }
        }

        const { error } = await supabase.from("profiles").upsert(patch).select("points").single();
        if (error) throw error;

        loadedPoints = patch.points;
        if (userPoints) userPoints.textContent = `${loadedPoints} pkt`;
        if (userLevel)  userLevel.textContent  = calcLevel(loadedPoints);
        toast("Profil zaktualizowany! 🎉");
      } catch (err) {
        console.error("[profile] save:", err);
        toast(err?.message || "Błąd zapisu profilu.", "bg-red-600");
      }
    });

    // avatar preview
    userPhoto?.addEventListener("click", () => photoInput?.click());
    photoInput?.addEventListener("change", () => {
      const f = photoInput.files?.[0];
      if (!f || !f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e2) => { if (userPhoto) userPhoto.src = e2.target.result; };
      reader.readAsDataURL(f);
    });

    /* ───────────── events: list ───────────── */
    async function loadUserEvents() {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("uid", userId)
          .order("date", { ascending: true });
        if (error) throw error;

        if (!eventList) return;
        eventList.textContent = "";

        if (!data?.length) {
          eventEmpty && eventEmpty.classList.remove("hidden");
          return;
        }
        eventEmpty && eventEmpty.classList.add("hidden");

        const frag = document.createDocumentFragment();
        data.forEach((ev) => {
          const left = h("div", {}, [
            h("div", { class: "font-bold text-pink-700" }, [
              String(ev.title || "Wydarzenie"),
              " ",
              h("span", { class: "text-xs text-gray-500" }, `(${ev.date || "—"})`)
            ]),
            h("div", { class: "text-sm text-gray-700" }, `Dla: ${ev.person || "—"}`),
            ev.comment ? h("div", { class: "text-xs text-gray-500" }, `Komentarz: ${ev.comment}`) : null
          ]);

          const delBtn = h(
            "button",
            {
              class: "text-red-500 hover:text-red-700 ml-2 text-xl",
              title: "Usuń",
              onClick: async () => {
                if (!confirm("Usunąć wydarzenie?")) return;
                const { error: delErr } = await supabase
                  .from("events")
                  .delete()
                  .eq("id", ev.id)
                  .eq("uid", userId);
                if (delErr) {
                  console.error("[events] delete:", delErr);
                  toast("Błąd usuwania", "bg-red-600");
                } else {
                  toast("Usunięto wydarzenie ✅");
                  loadUserEvents();
                  loadUserHistory();
                }
              }
            },
            "🗑"
          );

          const row = h(
            "div",
            { class: "border-l-4 pl-4 py-2 mb-3 rounded bg-gradient-to-r from-pink-50 to-blue-50 shadow flex justify-between items-center" },
            [left, delBtn]
          );

          frag.appendChild(row);
        });
        eventList.appendChild(frag);
      } catch (e) {
        console.error("[events] load:", e);
        toast("Błąd ładowania wydarzeń", "bg-red-600");
      }
    }

    /* ───────────── events: create ───────────── */
    eventForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const titleEl   = $("#eventTitle");
      const dateEl    = $("#eventDate");
      const forWhoEl  = $("#eventForWho");
      const commentEl = $("#eventComment");

      const title   = titleEl?.value?.trim();
      const date    = normalizeDate(dateEl?.value);
      const person  = forWhoEl?.value?.trim() || null;
      const comment = commentEl?.value?.trim() || null;

      if (!title || !date) return toast("Uzupełnij tytuł i datę.", "bg-yellow-600");

      const { error } = await supabase.from("events").insert({
        uid: userId, title, person, comment, date, type: "custom"
      });
      if (error) {
        console.error("[events] insert:", error);
        toast("Błąd zapisu wydarzenia", "bg-red-600");
        return;
      }

      if (eventModal && typeof eventModal.close === "function") eventModal.close();
      else eventModal?.classList.add("hidden");

      eventForm.reset?.();
      toast("Wydarzenie zapisane! 🎉");
      loadUserEvents();
      loadUserHistory();
    });

    /* ───────────── history (ostatnie 5) ───────────── */
    async function loadUserHistory() {
      try {
        if (!historyList) return;
        const { data, error } = await supabase
          .from("events")
          .select("title,date,person,created_at")
          .eq("uid", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        historyList.textContent = "";
        if (error || !data?.length) {
          historyList.appendChild(h("li", {}, "Brak aktywności."));
          return;
        }
        const frag = document.createDocumentFragment();
        data.forEach((ev) => {
          frag.appendChild(
            h("li", {}, `${ev.title || "Wydarzenie"} (${ev.date || "—"})${ev.person ? " – " + ev.person : ""}`)
          );
        });
        historyList.appendChild(frag);
      } catch (e) {
        console.error("[history] load:", e);
      }
    }

    /* ───────────── referral ───────────── */
    referralBtn?.addEventListener("click", () => {
      const link = `${location.origin}/?ref=${encodeURIComponent(userId)}`;
      (navigator.clipboard?.writeText(link) || Promise.reject())
        .then(() => toast("Link polecający skopiowany! ✨"))
        .catch(() => {
          // фолбек: показати в prompt
          try {
            // prompt повертає null якщо cancel
            const ok = window.prompt("Skopiuj link polecający:", link);
            ok != null ? toast("Skopiuj z pola powyżej.") : toast("Anulowano.", "bg-yellow-600");
          } catch {
            toast("Błąd kopiowania.", "bg-red-600");
          }
        });
    });

    /* ───────────── realtime (optional) ───────────── */
    try {
      const channel = supabase
        .channel("events-realtime")
        .on("postgres_changes",
          { event: "*", schema: "public", table: "events", filter: `uid=eq.${userId}` },
          () => { loadUserEvents(); loadUserHistory(); }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && isNaN) {/* noop to satisfy linter */}
        });
      window.addEventListener("beforeunload", () => {
        try { supabase.removeChannel(channel); } catch {}
      });
    } catch (e) {
      console.warn("[realtime] disabled or unavailable:", e?.message || e);
    }

    /* ───────────── initial load ───────────── */
    await Promise.all([loadProfile(), loadUserEvents(), loadUserHistory()]);
  });
})();
