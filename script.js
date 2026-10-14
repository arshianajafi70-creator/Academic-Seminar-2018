/* =========================================================
   ENGLISH IN IRAN — SEMINAR
   script.js — full version (بدون نقشه و کره)
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     1. ELEMENTS
     ========================================================= */
  const slides       = Array.from(document.querySelectorAll(".slide"));
  const currentEl    = document.getElementById("current");
  const totalEl      = document.getElementById("total");
  const bar          = document.getElementById("bar");
  const btnPrev      = document.getElementById("prev");
  const btnNext      = document.getElementById("next");
  const btnFull      = document.getElementById("fullscreen");
  const passport     = document.getElementById("passport");
  const passportStat = document.getElementById("passport-status");

  if (!slides.length) {
    console.warn("[Deck] No slides found.");
    return;
  }

  const TOTAL = slides.length;

  let current = 0;
  let helpOverlay = null;

  /* =========================================================
     2. INIT TOTALS
     ========================================================= */
  if (totalEl) totalEl.textContent = TOTAL;

  /* =========================================================
     3. SLIDE LOOKUP HELPERS
     ========================================================= */
  function getSlideIndexByNumber(num) {
    return slides.findIndex((s) => s.getAttribute("data-slide") === String(num));
  }

  /* =========================================================
     4. NAVIGATION
     ========================================================= */
  function goTo(index, options = {}) {
    if (index < 0) index = TOTAL - 1;
    if (index >= TOTAL) index = 0;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      if (active) slide.scrollTop = 0;
    });

    // خروج از اسلاید ۱۱ → ریست English Passport
    const prevSlideNum = slides[current]
      ? slides[current].getAttribute("data-slide")
      : null;
    if (prevSlideNum === "11" && index !== current) {
      resetPassport();
    }

    current = index;

    if (currentEl) currentEl.textContent = current + 1;

    if (bar) {
      const pct = ((current + 1) / TOTAL) * 100;
      bar.style.width = pct + "%";
    }

    const section = slides[current].getAttribute("data-section") || "";
    document.title = section
      ? `English in Iran — ${section}`
      : "English in Iran — Seminar";

    if (options.updateHash !== false) {
      const slideNum = slides[current].getAttribute("data-slide");
      try {
        history.replaceState(null, "", "#" + slideNum);
      } catch (_) {}
    }
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* =========================================================
     5. BUTTONS
     ========================================================= */
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnPrev) btnPrev.addEventListener("click", prev);

  /* =========================================================
     6. KEYBOARD
     ========================================================= */
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      el.isContentEditable
    );
  }

  document.addEventListener("keydown", (e) => {
    if (isTypingTarget(e.target)) {
      if (e.key === "Escape") e.target.blur();
      return;
    }

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        next();
        break;

      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        prev();
        break;

      case " ":
      case "Enter":
        e.preventDefault();
        next();
        break;

      case "Home":
        e.preventDefault();
        goTo(0);
        break;

      case "End":
        e.preventDefault();
        goTo(TOTAL - 1);
        break;

      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;

      case "?":
        e.preventDefault();
        toggleHelp();
        break;

      case "Escape":
        if (helpOverlay) {
          hideHelp();
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        break;
    }
  });

  /* =========================================================
     7. FULLSCREEN
     ========================================================= */
  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function requestFullscreen(el) {
    const fn =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;
    if (fn) {
      try {
        const result = fn.call(el);
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch (_) {}
    }
  }

  function exitFullscreen() {
    const fn =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.mozCancelFullScreen ||
      document.msExitFullscreen;
    if (fn) {
      try {
        const result = fn.call(document);
        if (result && typeof result.catch === "function") {
          result.catch(() => {});
        }
      } catch (_) {}
    }
  }

  function toggleFullscreen() {
    if (!getFullscreenElement()) {
      requestFullscreen(document.documentElement);
    } else {
      exitFullscreen();
    }
  }

  if (btnFull) btnFull.addEventListener("click", toggleFullscreen);

  /* =========================================================
     8. SWIPE (TOUCH)
     ========================================================= */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchActive = false;

  function isInteractiveTarget(el) {
    if (!el) return false;
    return !!el.closest(
      "button, a, input, textarea, select, label, .controls"
    );
  }

  document.addEventListener(
    "touchstart",
    (e) => {
      if (isTypingTarget(e.target) || isInteractiveTarget(e.target)) return;
      const t = e.changedTouches[0];
      touchStartX = t.screenX;
      touchStartY = t.screenY;
      touchStartTime = Date.now();
      touchActive = true;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!touchActive) return;
      touchActive = false;
      if (isTypingTarget(e.target) || isInteractiveTarget(e.target)) return;

      const t = e.changedTouches[0];
      const dx = t.screenX - touchStartX;
      const dy = t.screenY - touchStartY;
      const dt = Date.now() - touchStartTime;

      if (dt > 800) return;
      if (Math.abs(dx) < 60) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.4) return;

      if (dx < 0) next();
      else prev();
    },
    { passive: true }
  );

  /* =========================================================
     9. ENGLISH PASSPORT (SLIDE 11)
     ========================================================= */
  const MAX_CHOICES = 3;

  function resetPassport() {
    if (!passport || !passportStat) return;
    const boxes = passport.querySelectorAll('input[type="checkbox"]');
    boxes.forEach((b) => (b.checked = false));
    passportStat.textContent = `Selected: 0 / ${MAX_CHOICES}`;
    passportStat.style.color = "var(--brand)";
  }

  if (passport && passportStat) {
    const boxes = Array.from(
      passport.querySelectorAll('input[type="checkbox"]')
    );

    function updateStatus() {
      const checked = boxes.filter((b) => b.checked);
      passportStat.textContent = `Selected: ${checked.length} / ${MAX_CHOICES}`;
      passportStat.style.color =
        checked.length === MAX_CHOICES ? "var(--brand-2)" : "var(--brand)";
    }

    boxes.forEach((box) => {
      box.addEventListener("change", () => {
        const checked = boxes.filter((b) => b.checked);

        if (checked.length > MAX_CHOICES) {
          box.checked = false;
          const label = box.closest("label");
          if (label && label.animate) {
            label.animate(
              [
                { transform: "translateX(0)" },
                { transform: "translateX(-6px)" },
                { transform: "translateX(6px)" },
                { transform: "translateX(-4px)" },
                { transform: "translateX(4px)" },
                { transform: "translateX(0)" },
              ],
              { duration: 300, easing: "ease-out" }
            );
          }
        }

        updateStatus();
      });
    });

    updateStatus();
  }

  /* =========================================================
     10. QUESTION FORM
     ========================================================= */
  const formInputs = document.querySelectorAll(".question-form input");
  formInputs.forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
  });

  /* =========================================================
     11. HELP OVERLAY
     ========================================================= */
  function createHelp() {
    const div = document.createElement("div");
    div.className = "help-overlay";
    div.innerHTML = `
      <div class="help-card">
        <h3>Keyboard shortcuts</h3>
        <ul>
          <li><kbd>→</kbd> / <kbd>Space</kbd> — Next slide</li>
          <li><kbd>←</kbd> — Previous slide</li>
          <li><kbd>Home</kbd> — First slide</li>
          <li><kbd>End</kbd> — Last slide</li>
          <li><kbd>F</kbd> — Toggle fullscreen</li>
          <li><kbd>?</kbd> — Show this help</li>
          <li><kbd>Esc</kbd> — Close / exit fullscreen</li>
        </ul>
        <button type="button" class="help-close">Close</button>
      </div>
    `;

    Object.assign(div.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(26, 22, 37, 0.55)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      zIndex: "2000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font, system-ui)",
    });

    const card = div.querySelector(".help-card");
    Object.assign(card.style, {
      background: "#fff",
      padding: "2rem 2.4rem",
      borderRadius: "18px",
      boxShadow: "0 24px 60px rgba(107, 91, 154, 0.3)",
      maxWidth: "420px",
      width: "calc(100% - 3rem)",
      color: "#1a1625",
    });

    const h3 = card.querySelector("h3");
    Object.assign(h3.style, {
      margin: "0 0 1rem",
      color: "#6b5b9a",
      fontSize: "1.2rem",
      fontWeight: "800",
    });

    const list = card.querySelector("ul");
    Object.assign(list.style, {
      listStyle: "none",
      padding: "0",
      margin: "0 0 1.4rem",
    });

    card.querySelectorAll("li").forEach((li) => {
      Object.assign(li.style, {
        padding: "0.5rem 0",
        fontSize: "0.95rem",
        borderBottom: "1px dashed #ece8f3",
        color: "#4c4560",
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
      });
    });

    card.querySelectorAll("kbd").forEach((k) => {
      Object.assign(k.style, {
        background: "#f8f4ff",
        border: "1px solid #dcd4ea",
        borderRadius: "6px",
        padding: "0.15rem 0.5rem",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.82rem",
        color: "#6b5b9a",
        fontWeight: "700",
      });
    });

    const closeBtn = card.querySelector(".help-close");
    Object.assign(closeBtn.style, {
      background: "linear-gradient(135deg, #6b5b9a, #8b7bb8)",
      color: "#fff",
      border: "none",
      borderRadius: "12px",
      padding: "0.7rem 1.4rem",
      fontWeight: "700",
      fontSize: "0.9rem",
      cursor: "pointer",
      width: "100%",
    });

    closeBtn.addEventListener("click", hideHelp);
    div.addEventListener("click", (e) => {
      if (e.target === div) hideHelp();
    });

    return div;
  }

  function toggleHelp() {
    if (helpOverlay) hideHelp();
    else showHelp();
  }

  function showHelp() {
    if (helpOverlay) return;
    helpOverlay = createHelp();
    document.body.appendChild(helpOverlay);
  }

  function hideHelp() {
    if (!helpOverlay) return;
    helpOverlay.remove();
    helpOverlay = null;
  }

  /* =========================================================
     12. HASH CHANGE
     ========================================================= */
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "").trim();
    const idx = getSlideIndexByNumber(hash);
    if (idx >= 0 && idx !== current) {
      goTo(idx, { updateHash: false });
    }
  });

  /* =========================================================
     13. INIT — همیشه از اسلاید ۱ شروع کن
     ========================================================= */
  goTo(0, { updateHash: false });

  /* =========================================================
     14. DEBUG API
     ========================================================= */
  window.__deck = {
    goTo,
    next,
    prev,
    showHelp,
    hideHelp,
    resetPassport,
    get current() {
      return current;
    },
    get total() {
      return TOTAL;
    },
  };

  console.info(
    "%cEnglish in Iran deck ready",
    "background:#6b5b9a;color:#fff;padding:4px 10px;border-radius:6px;font-weight:700;"
  );
  console.info("Tip: press ? for shortcuts, or use window.__deck in console.");

})();
