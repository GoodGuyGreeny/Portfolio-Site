(() => {
  "use strict";
  const profile = document.querySelector("#about");
  const portrait = document.querySelector("#profile-portrait");
  const buttons = [...profile.querySelectorAll("[data-portrait]")];
  const scan = profile.querySelector(".dossier-scan");
  let entrance;
  let photoAnimation;
  let selection = 0;

  function animateProfile() {
    if (!window.gsap) return;
    if (entrance) entrance.kill();
    const elements = profile.querySelectorAll(".dossier-visual, .dossier-eyebrow, .dossier-name, .dossier-facts, .dossier-interests, .dossier-quote");
    window.gsap.set(elements, { clearProps: "opacity,transform" });
    entrance = window.gsap.fromTo(elements, { opacity: 0, y: 14 }, {
      opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: "power2.out",
      clearProps: "opacity,transform"
    });
    window.gsap.fromTo(scan, { yPercent: -100 }, { yPercent: 700, duration: 1.1, ease: "none" });
  }

  buttons.forEach(button => button.addEventListener("click", async () => {
    const number = button.dataset.portrait;
    const request = ++selection;
    const image = new Image();
    image.src = "images/palash-" + number + ".jpeg";
    try { await image.decode(); } catch { return; }
    if (request !== selection) return;
    if (photoAnimation) photoAnimation.kill();
    buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    portrait.src = image.src;
    portrait.alt = "Palash Mathur, portrait photo " + number;
    profile.querySelector(".portrait-id").textContent = "PM_0" + number + " / VISUAL RECORD";
    if (window.gsap) {
      photoAnimation = window.gsap.fromTo(portrait, { opacity: 0.35 }, { opacity: 1, duration: 0.3 });
      window.gsap.killTweensOf(scan);
      window.gsap.fromTo(scan, { yPercent: -100 }, { yPercent: 700, duration: 0.7, ease: "none" });
    }
  }));

  document.addEventListener("section-revealed", event => {
    if (event.detail === "about") animateProfile();
  });
  document.addEventListener("portfolio-ready", () => {
    if (location.hash === "#about") animateProfile();
  });
})();
