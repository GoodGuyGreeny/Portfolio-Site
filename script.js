/*
 * AI assistance: generated and refined theme persistence, local panel selection, animated section navigation, progress controls, and section entrance effects, including keyboard and reduced-motion handling.
 * Source: OpenAI, ChatGPT/Codex assistance, https://chatgpt.com/ (2026-11-12).
 * Developed iteratively from the portfolio owner's requests and feedback.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const toggle = document.querySelector("#theme-toggle");
  const systemTheme = window.matchMedia("(prefers-color-scheme: light)");
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem("portfolio-theme");
  } catch {
    // The toggle still works when browser storage is unavailable.
  }
  let followsSystem = savedTheme !== "light" && savedTheme !== "dark";

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const isLight = theme === "light";
    toggle.setAttribute("aria-pressed", String(isLight));
    toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    toggle.textContent = isLight ? "MODE: LIGHT" : "MODE: DARK";
  }

  applyTheme(followsSystem ? (systemTheme.matches ? "light" : "dark") : savedTheme);
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    const theme = root.dataset.theme === "light" ? "dark" : "light";
    followsSystem = false;
    applyTheme(theme);
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      // Keep the current choice for this page even without persistence.
    }
  });
  systemTheme.addEventListener("change", (event) => {
    if (followsSystem) applyTheme(event.matches ? "light" : "dark");
  });

  // Panel selection is local UI state; only main navigation changes the fragment.
  const selectPanel = (id) => {
    document.querySelectorAll(".is-target").forEach((el) => el.classList.remove("is-target"));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add("is-target");
    const entryId = panel && panel.classList.contains("codex-entry") ? id : "love-coding";
    document.querySelectorAll(".codex-navigation a").forEach(link => {
      if (link.getAttribute("href") === "#" + entryId) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };
  const syncFragment = () => selectPanel(location.hash.slice(1) || "home");
  syncFragment();
  window.addEventListener("hashchange", syncFragment);
  let skillTrigger = null;
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const isTab = link.closest(".codex-navigation, .stats-navigation");
    const isClose = link.closest(".stat-category") && link.getAttribute("href") === "#skills";
    if (!isTab && !isClose) return;
    event.preventDefault();
    selectPanel(link.getAttribute("href").slice(1));
    if (link.closest(".codex-navigation") && window.gsap) {
      const entry = document.querySelector(".codex-entry.is-target");
      window.gsap.killTweensOf(entry);
      window.gsap.fromTo(entry, { opacity: 0, y: 7 }, {
        opacity: 1, y: 0, duration: 0.3, ease: "power2.out", clearProps: "opacity,transform"
      });
    }
    if (link.closest(".stats-navigation")) {
      skillTrigger = link;
      document.querySelector(".stat-category.is-target a").focus({ preventScroll: true });
    } else if (isClose && skillTrigger) {
      skillTrigger.focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector(".stat-category.is-target")) {
      selectPanel("skills");
      if (skillTrigger) skillTrigger.focus({ preventScroll: true });
    }
  });

  // Typed.js is independent of the theme controls. A CDN failure leaves static text.
  const intro = document.querySelector("#title-prompt");

  let terminal = null;
  let homeEntrance;
  function updateIntro() {
    if (window.gsap) {
      if (homeEntrance) homeEntrance.kill();
      homeEntrance = window.gsap.fromTo(
        "#home .home-kicker, #home-heading, #home .home-description, #home .home-launch",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, clearProps: "opacity,transform", ease: "power2.out" }
      );
    }
    if (terminal) {
      terminal.destroy();
      terminal = null;
    }
    intro.textContent = "Press Play to Continue";
    if (typeof window.Typed !== "function") return;
    intro.textContent = "";
    terminal = new window.Typed(intro, {
      strings: ["System ready.", "Press Play to Continue"],
      typeSpeed: 42,
      backSpeed: 24,
      backDelay: 700,
      startDelay: 200,
      loop: false,
      showCursor: false,
      contentType: "null"
    });
  }
  if (!root.classList.contains("booting")) updateIntro();
  document.addEventListener("portfolio-ready", updateIntro, { once: true });

  window.addEventListener("hashchange", () => {
    if (location.hash === "#home") updateIntro();
  });

  // GSAP shutters cover the relocation; only top-level section links use them.
  const shutter = document.createElement("div");
  shutter.className = "screen-transition";
  shutter.hidden = true;
  shutter.setAttribute("aria-hidden", "true");
  shutter.innerHTML = '<div class="screen-transition__top"></div><div class="screen-transition__bottom"></div>';
  document.body.append(shutter);
  const topShutter = shutter.querySelector(".screen-transition__top");
  const bottomShutter = shutter.querySelector(".screen-transition__bottom");

  let transition = null;
  let destination = null;

  function relocate(section) {
    selectPanel(section.id);
    if (location.hash !== "#" + section.id) {
      history.pushState(null, "", "#" + section.id);
    }
    const offset = 0;
    window.scrollTo({
      top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - offset),
      behavior: "instant"
    });
  }

  function finishTransition() {
    shutter.hidden = true;
    const heading = destination && destination.querySelector("h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }


    transition = null;
    destination = null;
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute("download") || link.target === "_blank") return;
    const section = document.getElementById(link.getAttribute("href").slice(1));
    if (!section || !section.matches("main > section")) return;
    event.preventDefault();
    navigateTo(section);
  });

  function navigateTo(section) {
    // Ignore repeated activation until the current transition finishes.
    if (transition) return;
    destination = section;
    if (!window.gsap) {
      relocate(section);
      finishTransition();
      return;
    }

    shutter.hidden = false;
    window.gsap.set(topShutter, { y: 0, yPercent: -100 });
    window.gsap.set(bottomShutter, { y: 0, yPercent: 100 });

    transition = window.gsap.timeline({ onComplete: finishTransition });


    transition
      .to([topShutter, bottomShutter], { yPercent: 0, duration: 0.8, ease: "power3.inOut" })
      .call(() => {
        relocate(section);
        // Initialize the entrance while fully covered, on the same timeline
        // boundary where the shutters begin opening. Never reset it afterward.
        if (section.id === "home") updateIntro();
        document.dispatchEvent(new CustomEvent("section-revealed", { detail: section.id }));
      })


      .to(topShutter, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "reveal")
      .to(bottomShutter, { yPercent: 100, duration: 0.7, ease: "power3.inOut" }, "reveal");
  }

  // Browser history remains native; cancel any overlay if history changes mid-effect.
  window.addEventListener("popstate", () => {
    if (transition) {
      transition.kill();
      shutter.hidden = true;
      transition = null;
      destination = null;
    }
    syncFragment();
  });

  // Section rail, wheel, and in-page links share the transition function.
  const sections = [...document.querySelectorAll("main > section")];
  const rail = document.createElement("nav");
  rail.className = "section-rail";
  rail.setAttribute("aria-label", "Section progress");
  let activeSection = 0;
  let wheelLockedUntil = 0;
  let wheelAmount = 0;
  let lastWheel = 0;
  const segments = sections.map((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-rail__segment";
    button.setAttribute("aria-label", "Go to " + section.querySelector("h2").textContent);
    button.title = section.querySelector("h2").textContent;
    button.addEventListener("click", () => goToSection(index));
    rail.append(button);
    return button;
  });
  document.body.append(rail);

  function goToSection(index) {
    if (transition || root.classList.contains("booting")) return;
    const section = sections[index];
    if (!section) return;
    wheelLockedUntil = performance.now() + 1800;
    navigateTo(section);
  }

  function updateRail() {
    const headerHeight = 0;
    // Use the section at the top of the viewport; works with history and keyboard scrolling.
    let closest = Infinity;
    sections.forEach((section, index) => {
      const distance = Math.abs(section.getBoundingClientRect().top - headerHeight);
      if (distance < closest) {
        closest = distance;
        activeSection = index;
      }
    });
    segments.forEach((button, index) => {
      if (index === activeSection) button.setAttribute("aria-current", "location");
      else button.removeAttribute("aria-current");
    });
  }
  let railFrame = 0;
  window.addEventListener("scroll", () => {
    if (!railFrame) railFrame = requestAnimationFrame(() => {
      railFrame = 0;
      updateRail();
    });
  }, { passive: true });
  window.addEventListener("resize", updateRail);
  document.addEventListener("portfolio-ready", updateRail);
  updateRail();

  window.addEventListener("wheel", (event) => {
    // Preserve browser zoom and horizontal scrolling in the compact navigation.
    if (event.target.closest("#skills")) return;
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (!event.deltaY) return;
    event.preventDefault();
    const now = performance.now();
    if (root.classList.contains("booting") || transition ||
        document.querySelector(".stat-category.is-target") || now < wheelLockedUntil) {
      wheelAmount = 0;
      lastWheel = now;
      return;
    }
    if (now - lastWheel > 180 || Math.sign(wheelAmount) !== Math.sign(event.deltaY)) wheelAmount = 0;
    lastWheel = now;
    wheelAmount += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (Math.abs(wheelAmount) < 45) return;
    const next = Math.max(0, Math.min(sections.length - 1, activeSection + Math.sign(wheelAmount)));
    wheelAmount = 0;
    if (next !== activeSection) goToSection(next);
  }, { passive: false });

  let welcomeEntrance;
  function animateWelcome() {
    if (!window.gsap) return;
    if (welcomeEntrance) welcomeEntrance.kill();
    welcomeEntrance = window.gsap.fromTo(
      "#welcome .welcome-intro, #welcome .menu-directory, #welcome .main-menu li, #welcome .menu-footer",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, clearProps: "opacity,transform", ease: "power2.out" }
    );
  }
  document.addEventListener("section-revealed", event => {
    if (event.detail === "welcome") animateWelcome();
  });
  document.addEventListener("portfolio-ready", () => {
    if (location.hash === "#welcome") animateWelcome();
  });

  let archiveEntrance;
  function animateArchive() {
    if (!window.gsap) return;
    if (archiveEntrance) archiveEntrance.kill();
    archiveEntrance = window.gsap.fromTo(
      "#portfolio .mission-heading, #portfolio .mission-card",
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "opacity,transform" }
    );
  }
  document.addEventListener("section-revealed", event => {
    if (event.detail === "portfolio") animateArchive();
  });
  document.addEventListener("portfolio-ready", () => {
    if (location.hash === "#portfolio") animateArchive();
  });

  let contactEntrance;
  function animateContact() {
    if (!window.gsap) return;
    if (contactEntrance) contactEntrance.kill();
    contactEntrance = window.gsap.fromTo(
      "#contact .contact-intro, #contact .contact-terminal, #contact .contact-outro",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "opacity,transform" }
    );
  }
  document.addEventListener("section-revealed", event => {
    if (event.detail === "contact") animateContact();
  });
  document.addEventListener("portfolio-ready", () => {
    if (location.hash === "#contact") animateContact();
  });

  let codexEntrance;
  function animateCodex() {
    if (!window.gsap) return;
    if (codexEntrance) codexEntrance.kill();
    const codex = document.querySelector("#what-i-love");
    const entry = [...codex.querySelectorAll(".codex-entry")]
      .find(panel => getComputedStyle(panel).display !== "none");
    const elements = [
      codex.querySelector("h2"),
      codex.querySelector(".codex-navigation"),
      entry,
      codex.querySelector(":scope > p")
    ].filter(Boolean);
    window.gsap.killTweensOf(elements);
    codexEntrance = window.gsap.fromTo(
      elements,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "opacity,transform" }
    );
  }
  document.addEventListener("section-revealed", event => {
    if (event.detail === "what-i-love") animateCodex();
  });
  document.addEventListener("portfolio-ready", () => {
    if (location.hash === "#what-i-love" || location.hash.startsWith("#love-")) animateCodex();
  });
})();
