// /src/js/profile.js — HappyDate (Supabase v2, clean & safe)
import { supabase } from "/src/js/supabaseClient.js";

(() => {
  // ───────────────────────────────── Helpers
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const toast = (msg, color = "bg-green-600") => {
    const el = document.createElement("div");
    el.className = `fixed top-8 right-8 z-50 px-5 py-3 rounded-xl text-white font-semibold shadow-xl transition-all duration-300 ${color}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const calcLevel = (points) =>
    points >= 100 ? "Ekspert" : points >= 40 ? "Znawca" : points >= 20 ? "Entuzjasta" : "Nowicjusz";

  const normalizeDate = (str) => {
    const d = String(str || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // маленький конструктор елементів (щоб не ліпити innerHTML)
  const h = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") el.className = v;
      else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k in el) el[k] = v;
      else el.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      if (typeof c === "string") el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    });
    return el;
  };

  // ───────────────────────────────── Main
  document.addEventListener("DOMContentLoaded", async () => {
    // Lang dropdown (простенько, без перезавантаження якщо є i18n)
    const langBtn = $("#langDropdownBtn"), langDD = $("#langDropdown"), langFlag = $("#langFlag");
    const langMap = { pl: "🇵🇱", ua: "🇺🇦", en: "🇬🇧", ru: "🇷🇺", de: "🇩🇪" };
    const getLang = () =>
      window.i18n?.getLang?.() ||
      localStorage.getItem("lang") ||
      (navigator.language || "pl").slice(0, 2);
    const setFlag = () => langFlag && (langFlag.textContent = langMap[getLang()] || "🌐");
    setFlag();
    langBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      langDD?.classList.toggle("hidden");
    });
    document.addEventListener("click", () => langDD?.classList.add("hidden"));
    langDD?.querySelectorAll("button[data-lang]").forEach((b) => {
      b.addEventListener("click", async () => {
        const lng = b.dataset.lang;
        if (window.i18n?.setLang) {
          await window.i18n.setLang(lng, { persist: true });
          setFlag();
        } else {
          localStorage.setItem("lang", lng);
          location.reload();
        }
      });
    });

    // Auth gate
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      location.href = "/pages/login.html";
      return;
    }
    const userId = session.user.id;

    // UI refs
    const form          = $("#profile-form");
    const photoInput    = $("#photoFile");
    const userPhoto     = $("#user-photo");
    const userPoints    = $("#userPoints");
    const userLevel     = $("#user-level");
    const logoutBtn     = $("#logout-btn");

    const eventList     = $("#event-list");
    const eventEmpty    = $("#event-empty");
    const eventForm     = $("#eventForm");
    const eventModal    = $("#eventModal");

    const historyList   = $("#history-list");
    const referralBtn   = $("#referral-btn");

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

    // ───────────────── loadProfile
    async function loadProfile() {
      try {
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (error) throw error;

        const { data: u } = await supabase.auth.getUser();

        const p = prof || {};
        if (form) {
          // guardy на випадок відсутніх полів у розмітці
          form.name       && (form.name.value       = p.name || "");
          form.surname    && (form.surname.value    = p.surname || "");
          form.email      && (form.email.value      = u?.user?.email || "");
          form.phone      && (form.phone.value      = p.phone || "");
          form.birthdate  && (form.birthdate.value  = p.birthdate || "");
          form.gender     && (form.gender.value     = p.gender || "");
          form.preferences&& (form.preferences.value= p.preferences || "");
        }

        const avatar =
          p.photo_url ||
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture ||
          "/public/img/11.png";
        if (userPhoto) {
          userPhoto.src = avatar;
          userPhoto.alt = p.name ? `${p.name} — avatar` : "Profil użytkownika";
          userPhoto.referrerPolicy = "no-referrer";
        }

        loadedPoints = Number(p.points || 0);
        userPoints   && (userPoints.textContent = `${loadedPoints} pkt`);
        userLevel    && (userLevel.textContent  = calcLevel(loadedPoints));
      } catch (e) {
        console.error("[profile] loadProfile:", e);
        toast("Nie udało się wczytać profilu.", "bg-red-600");
      }
    }

    // ───────────────── updateProfile
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const name        = form.name?.value?.trim() || "";
        const surname     = form.surname?.value?.trim() || "";
        const phone       = form.phone?.value?.trim() || "";
        const birthdate   = form.birthdate?.value ? normalizeDate(form.birthdate.value) : null;
        const gender      = form.gender?.value || null;
        const preferences = form.preferences?.value?.trim() || "";

        // bonus за заповнені поля
        const filled = ["name","surname","phone","birthdate","gender","preferences"]
          .filter((id) => form[id]?.value?.trim()).length;
        const completionBonus = filled >= 5 ? 20 : 0;
        const nextPoints = Math.max(loadedPoints, completionBonus);

        const patch = {
          id: userId,
          name, surname, phone, birthdate, gender, preferences,
          points: nextPoints
        };

        // avatar upload (опціонально)
        if (photoInput?.files?.[0]) {
          const file = photoInput.files[0];
          if (!file.type.startsWith("image/")) throw new Error("Plik musi być obrazem.");
          const path = `avatars/${userId}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
          patch.photo_url = pub.publicUrl;
          if (userPhoto) userPhoto.src = pub.publicUrl;
        }

        const { error } = await supabase.from("profiles").upsert(patch).select("points").single();
        if (error) throw error;

        loadedPoints = patch.points;
        userPoints && (userPoints.textContent = `${loadedPoints} pkt`);
        userLevel  && (userLevel.textContent  = calcLevel(loadedPoints));
        toast("Profil zaktualizowany! 🎉");
      } catch (err) {
        console.error("[profile] save:", err);
        toast("Błąd zapisu profilu.", "bg-red-600");
      }
    });

    // prev фото
    userPhoto?.addEventListener("click", () => photoInput?.click());
    photoInput?.addEventListener("change", () => {
      const f = photoInput.files?.[0];
      if (!f || !f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => (userPhoto.src = e.target.result);
      reader.readAsDataURL(f);
    });

    // ───────────────── Events
    async function loadUserEvents() {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("uid", userId)
          .order("date", { ascending: true });
        if (error) throw error;

        if (!eventList) return;
        eventList.innerHTML = "";

        if (!data?.length) {
          eventEmpty && eventEmpty.classList.remove("hidden");
          return;
        }
        eventEmpty && eventEmpty.classList.add("hidden");

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

          const delBtn = h("button", {
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
                toast("Błąd usuwania", "bg-red-600");
              } else {
                toast("Usunięto wydarzenie", "bg-red-600");
                loadUserEvents();
                loadUserHistory();
              }
            }
          }, "🗑");

          const row = h(
            "div",
            { class: "border-l-4 pl-4 py-2 mb-3 rounded bg-gradient-to-r from-pink-50 to-blue-50 shadow flex justify-between items-center" },
            [left, delBtn]
          );

          eventList.appendChild(row);
        });
      } catch (e) {
        console.error("[events] load:", e);
        toast("Błąd ładowania wydarzeń", "bg-red-600");
      }
    }

    eventForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title   = eventForm.eventTitle?.value?.trim();
      const date    = normalizeDate(eventForm.eventDate?.value);
      const person  = eventForm.eventForWho?.value?.trim();
      const comment = eventForm.eventComment?.value?.trim();

      if (!title || !date) return toast("Uzupełnij tytuł i datę.", "bg-yellow-600");

      const { error } = await supabase.from("events").insert({
        uid: userId, title, person, comment, date, type: "custom"
      });
      if (error) {
        toast("Błąd zapisu wydarzenia", "bg-red-600");
        return;
      }

      if (typeof eventModal?.close === "function") eventModal.close();
      else eventModal?.classList.add("hidden");

      eventForm.reset?.();
      toast("Wydarzenie zapisane!");
      loadUserEvents();
      loadUserHistory();
    });

    // ───────────────── History (ostatnie 5)
    async function loadUserHistory() {
      try {
        if (!historyList) return;
        const { data, error } = await supabase
          .from("events")
          .select("title,date,person,created_at")
          .eq("uid", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        historyList.innerHTML = "";
        if (error || !data?.length) {
          historyList.appendChild(h("li", {}, "Brak aktywności."));
          return;
        }
        data.forEach((ev) => {
          const li = h("li", {}, `${ev.title || "Wydarzenie"} (${ev.date || "—"}) – ${ev.person || ""}`);
          historyList.appendChild(li);
        });
      } catch (e) {
        console.error("[history] load:", e);
      }
    }

    // ───────────────── Referral
    referralBtn?.addEventListener("click", () => {
      const link = `${location.origin}/?ref=${encodeURIComponent(userId)}`;
      navigator.clipboard?.writeText(link)
        .then(() => toast("Link polecający skopiowany! ✨"))
        .catch(() => toast("Błąd kopiowania.", "bg-red-600"));
    });

    // ───────────────── Realtime (opcjonalnie)
    try {
      const channel = supabase
        .channel("events-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "events", filter: `uid=eq.${userId}` },
          () => { loadUserEvents(); loadUserHistory(); }
        )
        .subscribe();
      window.addEventListener("beforeunload", () => {
        try { supabase.removeChannel(channel); } catch {}
      });
    } catch (e) {
      // Якщо edge runtime / без Realtime — тихо ігноруємо
    }

    // Initial load
    await loadProfile();
    await loadUserEvents();
    await loadUserHistory();
  });
})();
