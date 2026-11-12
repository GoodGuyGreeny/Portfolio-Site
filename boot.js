(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("booting");
  let overlay;
  let typing;
  let sequence;
  let finished = false;
  let surfaces = [];
  const previousFocus = document.activeElement;

  function cleanup() {
    root.classList.remove("booting");
    surfaces.forEach(({ element, inert }) => {
      element.inert = inert;
      element.style.removeProperty("opacity");
    });
    if (typing) typing.destroy();
    if (overlay) overlay.remove();
    document.removeEventListener("keydown", onKey);
    document.dispatchEvent(new Event("portfolio-ready"));
  }

  function finish(immediate = false) {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    if (typing) typing.stop();
    if (sequence) sequence.kill();
    const skipHadFocus = overlay && overlay.contains(document.activeElement);
    const complete = () => {
      cleanup();
      if (skipHadFocus) {
        const heading = document.querySelector("main > section.is-target h2, #home h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        } else if (previousFocus) previousFocus.focus({ preventScroll: true });
      }
    };
    if (immediate || !window.gsap || !overlay) {
      complete();
      return;
    }
    // Reveal the real theme underneath the fading black CRT screen.
    window.gsap.to(surfaces.map(({ element }) => element), { opacity: 1, duration: 0.9 });
    window.gsap.to(overlay, { opacity: 0, duration: 0.9, onComplete: complete });
  }

  function onKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      finish(true);
    }
  }

  // Never leave content hidden if a library or startup callback fails.
  const watchdog = setTimeout(() => finish(true), 12000);
  document.addEventListener("DOMContentLoaded", () => {
    if (finished) return;
    if (!window.gsap || typeof window.Typed !== "function") {
      finish(true);
      return;
    }
    surfaces = [...document.querySelectorAll("body > header, body > main, body > footer")]
      .map(element => ({ element, inert: element.inert }));
    surfaces.forEach(({ element }) => { element.inert = true; });
    overlay = document.createElement("div");
    overlay.className = "boot-screen";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Portfolio startup");
    overlay.innerHTML = '<div class="boot-screen__scanlines" aria-hidden="true"></div><div class="boot-screen__content"><p class="boot-screen__tag" aria-hidden="true">PM / PERSONAL TERMINAL</p><h2 class="boot-screen__title" aria-label="Palash Mathur Portfolio"><span class="boot-screen__typed" aria-hidden="true"></span></h2><p class="boot-screen__status" aria-hidden="true"></p><div class="boot-screen__track" aria-hidden="true"><span></span></div></div><button class="boot-screen__skip" type="button">SKIP INTRO <span aria-hidden="true">[ESC]</span></button>';
    document.body.append(overlay);
    overlay.querySelector("button").addEventListener("click", () => finish(true));
    document.addEventListener("keydown", onKey);
    const status = overlay.querySelector(".boot-screen__status");
    const progress = overlay.querySelector(".boot-screen__track span");

    function showMessages() {
      if (finished) return;
      sequence = window.gsap.timeline({ onComplete: () => finish() });
      ["Welcome.", "Loading assets...", "Calibrating systems...", "Startup Complete"].forEach((message, index) => {
        sequence
          .call(() => { status.textContent = message; })
          .fromTo(status, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.3 })
          .to(progress, { scaleX: (index + 1) / 4, duration: 0.45, ease: "power1.inOut" }, "<")
          .to(status, { opacity: 0, duration: 0.25 }, "+=0.45");
      });
    }

    // Brief darkness, then a terminal title. No flashing or rapid flicker.
    typing = new window.Typed(overlay.querySelector(".boot-screen__typed"), {
      strings: ["Palash Mathur Portfolio"],
      startDelay: 450,
      typeSpeed: 65,
      showCursor: true,
      cursorChar: "_",
      autoInsertCss: false,
      contentType: "null",
      onComplete: showMessages
    });
  }, { once: true });
})();
