/* ============================================================
   MADE VISIBLE — main.js
   Smooth scroll (Lenis) · Scroll animations (GSAP ScrollTrigger)
   3D hero (Three.js) · Navigation · Micro-interactions
   ============================================================ */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     Preloader
     ---------------------------------------------------------- */
  const preloader = document.querySelector(".preloader");
  window.addEventListener("load", () => {
    setTimeout(() => preloader && preloader.classList.add("is-done"), 650);
  });
  // Safety: never trap the user behind the preloader
  setTimeout(() => preloader && preloader.classList.add("is-done"), 3000);

  /* ----------------------------------------------------------
     Smooth scrolling — Lenis
     ---------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ----------------------------------------------------------
     Header behaviour
     ---------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      // Hide on scroll down, show on scroll up (only past the hero)
      if (y > 500 && y > lastY + 6) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 500) header.classList.remove("is-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------- */
  const toggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (toggle && mobileMenu) {
    toggle.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("is-open");
        toggle.classList.remove("is-open");
        document.body.style.overflow = "";
        if (lenis) lenis.start();
      })
    );
  }

  /* ----------------------------------------------------------
     Custom cursor
     ---------------------------------------------------------- */
  const dot = document.querySelector(".cursor--dot");
  const ring = document.querySelector(".cursor--ring");
  if (dot && ring && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function cursorLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(cursorLoop);
    })();
    document.querySelectorAll("a, button, .service-card, .work-item__visual").forEach((el) => {
      el.addEventListener("mouseenter", () => { dot.classList.add("is-hover"); ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", () => { dot.classList.remove("is-hover"); ring.classList.remove("is-hover"); });
    });
  }

  /* ----------------------------------------------------------
     GSAP scroll animations
     ---------------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);

    // Generic fade-up reveals
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: parseFloat(el.dataset.revealDelay || 0),
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Line-mask headline reveals
    document.querySelectorAll("[data-reveal-line]").forEach((el) => {
      const spans = el.querySelectorAll(".line > span");
      gsap.to(spans, {
        y: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Parallax visuals
    document.querySelectorAll("[data-parallax]").forEach((el) => {
      const strength = parseFloat(el.dataset.parallax || 12);
      gsap.fromTo(
        el,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    // Editorial statement — words light up as you scroll through
    document.querySelectorAll("[data-statement]").forEach((block) => {
      const words = block.querySelectorAll(".word");
      if (!words.length) return;
      gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.06,
        onUpdate: function () {
          words.forEach((w) => w.classList.toggle("is-lit", parseFloat(getComputedStyle(w).opacity) > 0.6));
        },
        scrollTrigger: { trigger: block, start: "top 75%", end: "bottom 55%", scrub: 0.5 },
      });
    });

    // Stat counters
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: () => {
          el.textContent = obj.v.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        },
      });
    });

    // Hero intro (plays on load, not scroll)
    const heroLines = document.querySelectorAll(".hero__title .line > span");
    if (heroLines.length) {
      gsap.to(heroLines, { y: 0, duration: 1.3, ease: "power4.out", stagger: 0.14, delay: 0.9 });
      gsap.to(".hero [data-hero-fade]", {
        opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.15, delay: 1.5,
      });
    }
  } else {
    // No GSAP or reduced motion: show everything
    document.querySelectorAll("[data-reveal]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
    document.querySelectorAll("[data-reveal-line] .line > span, .hero__title .line > span").forEach((s) => { s.style.transform = "none"; });
    document.querySelectorAll("[data-hero-fade]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
    document.querySelectorAll(".statement .word").forEach((w) => w.classList.add("is-lit"));
  }

  /* ----------------------------------------------------------
     3D hero — Three.js
     A slow-rotating champagne wireframe icosahedron surrounded
     by a particle field, reacting subtly to the mouse.
     ---------------------------------------------------------- */
  const heroCanvasWrap = document.querySelector(".hero__canvas");
  if (heroCanvasWrap && window.THREE && !prefersReducedMotion) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.055);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroCanvasWrap.appendChild(renderer.domElement);

    const champagne = new THREE.Color(0xc6ae82);
    const stone = new THREE.Color(0xaaa69d);

    // Core wireframe form
    const coreGroup = new THREE.Group();
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.1, 1),
      new THREE.MeshBasicMaterial({ color: champagne, wireframe: true, transparent: true, opacity: 0.28 })
    );
    const icoInner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.1, 0),
      new THREE.MeshBasicMaterial({ color: champagne, wireframe: true, transparent: true, opacity: 0.14 })
    );
    coreGroup.add(ico, icoInner);
    scene.add(coreGroup);

    // Glowing vertices on the core
    const icoPoints = new THREE.Points(
      new THREE.IcosahedronGeometry(3.1, 1),
      new THREE.PointsMaterial({ color: champagne, size: 0.055, transparent: true, opacity: 0.9, sizeAttenuation: true })
    );
    coreGroup.add(icoPoints);

    // Ambient particle field
    const COUNT = 900;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 6 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi) - 4;
      const c = Math.random() < 0.3 ? champagne : stone;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.55, sizeAttenuation: true })
    );
    scene.add(stars);

    // Sizing
    function resize() {
      const { clientWidth: w, clientHeight: h } = heroCanvasWrap;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      // Push the form to the right on wide screens, centre it on mobile
      coreGroup.position.x = w > 900 ? 3.4 : 0;
      coreGroup.position.y = w > 900 ? 0.2 : 1.6;
    }
    resize();
    window.addEventListener("resize", resize);

    // Mouse parallax
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Scroll influence
    let scrollFactor = 0;
    window.addEventListener("scroll", () => {
      scrollFactor = Math.min(window.scrollY / window.innerHeight, 1.5);
    }, { passive: true });

    const clock = new THREE.Clock();
    let running = true;

    // Pause rendering when the hero is off screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { running = entries[0].isIntersecting; }, { threshold: 0 })
        .observe(heroCanvasWrap);
    }

    (function animate() {
      requestAnimationFrame(animate);
      if (!running) return;
      const t = clock.getElapsedTime();

      coreGroup.rotation.y = t * 0.12 + cx * 0.35;
      coreGroup.rotation.x = Math.sin(t * 0.18) * 0.15 + cy * 0.25;
      icoInner.rotation.y = -t * 0.2;
      icoInner.rotation.z = t * 0.1;

      // Gentle breathing
      const s = 1 + Math.sin(t * 0.6) * 0.03;
      ico.scale.setScalar(s);
      icoPoints.scale.setScalar(s);

      stars.rotation.y = t * 0.015;

      // Ease mouse
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      camera.position.x = cx * 0.6;
      camera.position.y = -cy * 0.4 - scrollFactor * 2.2;
      camera.lookAt(coreGroup.position.x * 0.5, 0, 0);

      renderer.render(scene, camera);
    })();
  }

  /* ----------------------------------------------------------
     3D tilt on cards
     ---------------------------------------------------------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      let raf = null;
      card.style.transformStyle = "preserve-3d";
      card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      card.addEventListener("mousemove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateZ(6px)`;
          raf = null;
        });
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
      });
    });
  }

  /* ----------------------------------------------------------
     Inquiry form (front-end only — wire to a backend/service)
     ---------------------------------------------------------- */
  const form = document.querySelector(".inquiry-form form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.style.display = "none";
      const success = document.querySelector(".form-success");
      if (success) success.classList.add("is-visible");
    });
  }

  /* ----------------------------------------------------------
     Footer year
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
