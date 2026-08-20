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
  let seenIntro = false;
  try { seenIntro = !!sessionStorage.getItem("mv-intro"); } catch (e) { /* storage unavailable */ }

  // Single choreographer for the entry sequence: dismisses the preloader,
  // fires the camera flash (first visit only), starts the hero light sweep,
  // and signals everything else via the mv:reveal event.
  const reveal = (withFlash) => {
    if (window.__mvRevealed) return;
    window.__mvRevealed = true;
    preloader && preloader.classList.add("is-done");
    if (withFlash && !prefersReducedMotion) {
      const flash = document.querySelector(".flash");
      if (flash) flash.classList.add("is-firing");
    }
    const sweep = document.querySelector(".hero__sweep");
    if (sweep && !prefersReducedMotion) setTimeout(() => sweep.classList.add("is-on"), 250);
    document.dispatchEvent(new CustomEvent("mv:reveal"));
  };

  if (preloader && seenIntro) {
    // Returning within the session: skip the intro instead of replaying it on every page
    preloader.style.transitionDuration = "0.3s";
    reveal(false);
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => {
        reveal(true);
        try { sessionStorage.setItem("mv-intro", "1"); } catch (e) { /* ignore */ }
      }, 650);
    });
  }
  // Safety: never trap the user behind the preloader
  setTimeout(() => reveal(false), 3000);

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
    const setMenu = (open) => {
      mobileMenu.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    toggle.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("is-open")));
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     Placeholder links (social profiles not yet created):
     don't jump to the top of the page on click
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href="#"]').forEach((a) => {
    a.setAttribute("aria-disabled", "true");
    if (!a.title) a.title = "Profile coming soon";
    a.addEventListener("click", (e) => e.preventDefault());
  });

  /* ----------------------------------------------------------
     Hero scroll cue — click to scroll past the hero
     ---------------------------------------------------------- */
  const scrollCue = document.querySelector(".hero__scroll");
  if (scrollCue) {
    scrollCue.addEventListener("click", () => {
      const hero = document.querySelector(".hero");
      const target = hero ? hero.offsetHeight : window.innerHeight;
      if (lenis) lenis.scrollTo(target);
      else window.scrollTo({ top: target, behavior: "smooth" });
    });
  }

  /* ----------------------------------------------------------
     Autoplay videos — browsers pause (or never start) offscreen
     and post-navigation autoplay, so drive playback explicitly:
     play when visible, pause when not, and if autoplay is blocked
     (e.g. iOS Low Power Mode) fall back to controls / first tap.
     ---------------------------------------------------------- */
  const autoVids = document.querySelectorAll("video[autoplay]");
  if (autoVids.length) {
    const tryPlay = (v) => {
      const p = v.play();
      if (p) p.catch(() => {
        // background hero video can't be tapped — retry on first touch instead
        if (v.closest(".hero__video")) return;
        v.controls = true;
      });
    };
    if ("IntersectionObserver" in window) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) tryPlay(en.target);
          else if (!en.target.paused) en.target.pause();
        });
      }, { threshold: 0.15 });
      autoVids.forEach((v) => vio.observe(v));
    } else {
      autoVids.forEach(tryPlay);
    }
    const inView = (v) => {
      const r = v.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const resume = () => autoVids.forEach((v) => { if (v.paused && inView(v)) tryPlay(v); });
    document.addEventListener("touchend", resume, { once: true, passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) resume(); });
  }

  /* ----------------------------------------------------------
     Custom cursor
     ---------------------------------------------------------- */
  const cross = document.querySelector(".cursor-cross");
  if (cross && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    // Comet trail: chained dots, each easing toward the one before it
    const TRAIL = prefersReducedMotion ? 0 : 8;
    const trail = [];
    for (let i = 0; i < TRAIL; i++) {
      const t = document.createElement("div");
      t.className = "cursor-trail";
      const size = 5 - i * 0.45;
      t.style.width = t.style.height = `${size}px`;
      t.style.opacity = String(0.38 - i * 0.042);
      document.body.appendChild(t);
      trail.push({ el: t, x: -100, y: -100 });
    }

    let mx = -100, my = -100;
    let seen = false;
    let overText = false; // pointer is over an input/textarea (native I-beam zone)
    const setHidden = (hidden) => {
      cross.classList.toggle("is-hidden", hidden);
      trail.forEach((t) => t.el.classList.toggle("is-hidden", hidden));
    };
    setHidden(true); // stay invisible until the first real mouse position

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!seen) {
        seen = true;
        trail.forEach((t) => { t.x = mx; t.y = my; });
        // Only hide the native cursor once the custom one has a real
        // position — a stationary pointer keeps the OS arrow until then
        document.documentElement.classList.add("has-cursor");
        if (!overText) setHidden(false);
      }
    }, { passive: true });

    (function cursorLoop() {
      // Cross follows instantly
      cross.style.transform = `translate(${mx - 11}px, ${my - 11}px)`;
      // Each trail dot chases the previous point in the chain
      let px = mx, py = my;
      for (const t of trail) {
        t.x += (px - t.x) * 0.35;
        t.y += (py - t.y) * 0.35;
        t.el.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%, -50%)`;
        px = t.x; py = t.y;
      }
      requestAnimationFrame(cursorLoop);
    })();

    document.querySelectorAll("a, button, .service-card, .work-item__visual, .case-media").forEach((el) => {
      el.addEventListener("mouseenter", () => cross.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cross.classList.remove("is-hover"));
    });

    // Text fields keep the native I-beam — fade the custom cursor there
    document.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("mouseenter", () => { overText = true; setHidden(true); });
      el.addEventListener("mouseleave", () => { overText = false; setHidden(false); });
    });

    // Fade out when the pointer leaves the window
    document.addEventListener("mouseleave", () => setHidden(true));
    document.addEventListener("mouseenter", () => { if (seen && !overText) setHidden(false); });

    // Press feedback
    window.addEventListener("mousedown", () => cross.classList.add("is-pressed"));
    window.addEventListener("mouseup", () => cross.classList.remove("is-pressed"));
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

    // Hero intro — starts when the preloader hands off (mv:reveal)
    const heroLines = document.querySelectorAll(".hero__title .line > span");
    if (heroLines.length) {
      const startHeroIntro = () => {
        gsap.to(heroLines, { y: 0, duration: 1.3, ease: "power4.out", stagger: 0.16, delay: 0.1 });
        // "visible." pulls into focus like a lens
        gsap.fromTo(".hero__title .serif",
          { filter: "blur(16px)", opacity: 0 },
          { filter: "blur(0px)", opacity: 1, duration: 1.6, ease: "power2.out", delay: 0.6 });
        gsap.to(".hero [data-hero-fade]", {
          opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.15, delay: 0.85,
        });
      };
      if (window.__mvRevealed) startHeroIntro();
      else document.addEventListener("mv:reveal", startHeroIntro, { once: true });
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
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.035);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    heroCanvasWrap.appendChild(renderer.domElement);

    const champagne = new THREE.Color(0xc6ae82);
    const stone = new THREE.Color(0xaaa69d);

    /* --------------------------------------------------------
       Procedural camera model — dark solids that occlude, with
       champagne edge wireframes on top (technical-drawing look)
       -------------------------------------------------------- */
    const camGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: champagne, transparent: true, opacity: 0.75 });
    const softLineMat = new THREE.LineBasicMaterial({ color: champagne, transparent: true, opacity: 0.35 });
    const occluderMat = new THREE.MeshBasicMaterial({ color: 0x0c0b09, transparent: true, opacity: 0.88 });

    const part = (geo, x, y, z, opts = {}) => {
      const solid = new THREE.Mesh(geo, occluderMat);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, opts.threshold ?? 12),
        opts.soft ? softLineMat : lineMat
      );
      edges.scale.setScalar(1.002);
      solid.add(edges);
      solid.position.set(x, y, z);
      if (opts.rx) solid.rotation.x = opts.rx;
      if (opts.ry) solid.rotation.y = opts.ry;
      if (opts.rz) solid.rotation.z = opts.rz;
      camGroup.add(solid);
      return solid;
    };
    const ring = (radius, tube, x, y, z, segments = 28) => {
      const t = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 8, segments),
        occluderMat
      );
      t.add(new THREE.LineSegments(new THREE.EdgesGeometry(t.geometry, 30), softLineMat));
      t.position.set(x, y, z);
      camGroup.add(t);
      return t;
    };

    // Body + grip
    part(new THREE.BoxGeometry(3.4, 2.1, 1.3), 0, 0, 0);
    part(new THREE.BoxGeometry(0.55, 1.95, 1.5), 1.5, -0.02, 0.06);
    // Pentaprism hump + hot shoe
    part(new THREE.BoxGeometry(1.5, 0.62, 1.05), 0, 1.33, 0);
    part(new THREE.BoxGeometry(0.55, 0.1, 0.55), 0, 1.7, 0);
    // Lens barrel, focus ring, hood ring, glass rings
    part(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16), 0, 0, 1.28, { rx: Math.PI / 2, threshold: 10 });
    ring(0.86, 0.075, 0, 0, 1.02);
    ring(0.82, 0.05, 0, 0, 1.98);
    ring(0.55, 0.022, 0, 0, 2.02, 24);
    ring(0.28, 0.016, 0, 0, 2.04, 20);
    // Mode dial + shutter button
    part(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12), -1.22, 1.16, 0.1, { threshold: 10 });
    part(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 10), 1.12, 1.14, 0.28, { threshold: 10 });
    // Viewfinder (back) + strap lugs
    part(new THREE.BoxGeometry(0.52, 0.36, 0.08), 0, 0.55, -0.69);
    ring(0.1, 0.03, -1.73, 0.72, 0, 12).rotation.y = Math.PI / 2;
    ring(0.1, 0.03, 1.79, 0.72, 0, 12).rotation.y = Math.PI / 2;

    // The primitives above are only a stand-in while the real model loads
    const placeholder = new THREE.Group();
    while (camGroup.children.length) placeholder.add(camGroup.children[0]);
    camGroup.add(placeholder);

    camGroup.scale.setScalar(1.08);
    scene.add(camGroup);

    // Lighting for the PBR model (invisible to the Basic-material stand-in)
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.7);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xc6ae82, 1.3);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Real camera model — Antique Camera by Maximillan Kamps / UX3D (CC0)
    let placeholderFade = -1;
    if (THREE.GLTFLoader) {
      new THREE.GLTFLoader().load(
        "assets/camera.glb",
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const s = 4.8 / size.y;
          model.scale.setScalar(s);
          model.position.sub(center.multiplyScalar(s));
          camGroup.add(model);
          placeholderFade = 1; // hand off from the wireframe stand-in
        },
        undefined,
        () => { /* keep the wireframe stand-in if the model fails to load */ }
      );
    }

    // Ambient particle field (unchanged language from the previous hero)
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
    let baseScale = 1.08;
    function resize() {
      const { clientWidth: w, clientHeight: h } = heroCanvasWrap;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      camGroup.position.x = w > 900 ? 3.9 : 0;
      camGroup.position.y = w > 900 ? 0.2 : 1.7;
      baseScale = w > 900 ? 1.08 : 0.8;
    }
    resize();
    window.addEventListener("resize", resize);

    // Entrance: the camera sweeps in from the distance on reveal,
    // spinning into its resting orientation
    let introT = 0;
    let introActive = false;
    const beginCameraIntro = () => { introActive = true; };
    if (window.__mvRevealed) beginCameraIntro();
    else document.addEventListener("mv:reveal", beginCameraIntro, { once: true });

    /* --------------------------------------------------------
       Drag to spin — pointer drag with momentum; slow auto-spin
       resumes a moment after the user lets go
       -------------------------------------------------------- */
    let rotY = -0.55, rotX = 0.12;
    let vX = 0, vY = 0;
    let dragging = false, lastX = 0, lastY = 0, lastDrag = 0;
    const hint = document.querySelector(".hero__drag-hint");

    heroCanvasWrap.style.touchAction = "pan-y"; // horizontal drag spins, vertical still scrolls
    heroCanvasWrap.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      vX = 0; vY = 0;
      heroCanvasWrap.setPointerCapture(e.pointerId);
      if (e.pointerType === "mouse") e.preventDefault();
      if (hint) hint.classList.add("is-done");
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      rotY += dx * 0.007;
      rotX = Math.max(-0.9, Math.min(0.9, rotX + dy * 0.004));
      vX = dx * 0.007; vY = dy * 0.004;
      lastDrag = performance.now();
    }, { passive: true });
    const endDrag = () => { dragging = false; lastDrag = performance.now(); };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // Mouse parallax (subtle) + scroll drift
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    let scrollFactor = 0;
    window.addEventListener("scroll", () => {
      scrollFactor = Math.min(window.scrollY / window.innerHeight, 1.5);
    }, { passive: true });

    const clock = new THREE.Clock();
    let running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { running = entries[0].isIntersecting; }, { threshold: 0 })
        .observe(heroCanvasWrap);
    }

    (function animate() {
      requestAnimationFrame(animate);
      if (!running) return;
      const t = clock.getElapsedTime();

      if (!dragging) {
        // Momentum, then settle into a slow idle spin
        rotY += vX;
        rotX = Math.max(-0.9, Math.min(0.9, rotX + vY));
        vX *= 0.94; vY *= 0.94;
        if (performance.now() - lastDrag > 2200) {
          rotY += 0.0028;
          rotX += (0.12 - rotX) * 0.02;
        }
      }

      if (placeholderFade >= 0) {
        placeholderFade = Math.max(0, placeholderFade - 0.025);
        lineMat.opacity = 0.75 * placeholderFade;
        softLineMat.opacity = 0.35 * placeholderFade;
        occluderMat.opacity = 0.88 * placeholderFade;
        if (placeholderFade === 0) { camGroup.remove(placeholder); placeholderFade = -1; }
      }

      if (introActive && introT < 1) introT = Math.min(1, introT + 0.011);
      const introE = 1 - Math.pow(1 - introT, 3); // ease-out cubic

      camGroup.rotation.y = rotY - (1 - introE) * 2.6;
      camGroup.rotation.x = rotX;
      camGroup.position.z = -(1 - introE) * 5;
      camGroup.scale.setScalar(baseScale * (0.55 + 0.45 * introE));
      camGroup.position.y += Math.sin(t * 0.8) * 0.0012; // gentle float

      stars.rotation.y = t * 0.015;

      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      camera.position.x = cx * 0.35;
      camera.position.y = -cy * 0.25 - scrollFactor * 2.2;
      camera.lookAt(camGroup.position.x * 0.5, 0, 0);

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
     Brand wall — generate the blurred MADE VISIBLE pattern
     ---------------------------------------------------------- */
  const wallPattern = document.querySelector(".brand-wall__pattern");
  if (wallPattern) {
    const ROWS = 11;
    for (let i = 0; i < ROWS; i++) {
      const row = document.createElement("div");
      row.className = "brand-wall__row";
      row.textContent = Array(16).fill("MADE VISIBLE").join("\u2002\u2002");
      row.style.marginLeft = `-${(i % 4) * 4 + 1}rem`;
      row.style.filter = `blur(${1.5 + ((i * 7) % 5) * 0.8}px)`;
      row.style.opacity = String(0.45 + ((i * 3) % 5) * 0.11);
      if (!prefersReducedMotion) {
        // slow horizontal drift, alternating direction per row
        row.style.setProperty("--drift", `${i % 2 ? 2.5 : -2.5}rem`);
        row.style.animation = `wall-drift ${22 + (i % 5) * 4}s ease-in-out ${-(i * 3)}s infinite alternate`;
      }
      wallPattern.appendChild(row);
    }
  }

  // Swap in the real brand photo when assets/brand-wall.jpg exists
  const wallPhoto = document.querySelector(".brand-wall__photo");
  if (wallPhoto) {
    const activatePhoto = () => {
      const wall = wallPhoto.closest(".brand-wall");
      if (wall) wall.classList.add("has-photo");
    };
    if (wallPhoto.complete) {
      wallPhoto.naturalWidth > 0 ? activatePhoto() : wallPhoto.remove();
    } else {
      wallPhoto.addEventListener("load", activatePhoto);
      wallPhoto.addEventListener("error", () => wallPhoto.remove());
    }
  }

  /* ----------------------------------------------------------
     Inquiry form (front-end only — wire to a backend/service)
     ---------------------------------------------------------- */
  const form = document.querySelector(".inquiry-form form");
  if (form) {
    const fail = (input, msg) => {
      const field = input.closest(".field");
      if (!field) return;
      field.classList.add("is-error");
      const err = document.createElement("span");
      err.className = "field-error";
      err.textContent = msg;
      field.appendChild(err);
    };
    const clearError = (input) => {
      const field = input.closest(".field");
      if (!field) return;
      field.classList.remove("is-error");
      const err = field.querySelector(".field-error");
      if (err) err.remove();
    };
    form.querySelectorAll("input, select, textarea").forEach((el) =>
      el.addEventListener("input", () => clearError(el))
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.querySelectorAll(".field.is-error").forEach((f) => {
        f.classList.remove("is-error");
        const err = f.querySelector(".field-error");
        if (err) err.remove();
      });

      const name = form.querySelector("#f-name");
      const email = form.querySelector("#f-email");
      const website = form.querySelector("#f-website");
      let ok = true;

      if (name && !name.value.trim()) { fail(name, "Please tell us your name."); ok = false; }
      if (email) {
        const v = email.value.trim();
        if (!v) { fail(email, "Please enter your email."); ok = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { fail(email, "That email address doesn’t look right."); ok = false; }
      }
      if (website && website.value.trim() && !/^(https?:\/\/)?[^\s]+\.[^\s]{2,}$/i.test(website.value.trim())) {
        fail(website, "That website address doesn’t look right."); ok = false;
      }

      if (!ok) {
        const first = form.querySelector(".field.is-error input, .field.is-error select, .field.is-error textarea");
        if (first) first.focus();
        return;
      }

      const showSuccess = () => {
        form.style.display = "none";
        const success = document.querySelector(".form-success");
        if (success) {
          success.classList.add("is-visible");
          success.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        }
      };

      // Honeypot filled → a bot; pretend it worked and send nothing
      const honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) { showSuccess(); return; }

      const submitBtn = form.querySelector('button[type="submit"]');
      const alertBox = form.querySelector(".form-alert");
      if (alertBox) alertBox.remove();

      const setSending = (sending) => {
        if (!submitBtn) return;
        submitBtn.disabled = sending;
        submitBtn.style.opacity = sending ? "0.6" : "";
        submitBtn.innerHTML = sending
          ? "Sending\u2026"
          : 'Make Me Visible <span class="arrow">\u2197</span>';
      };

      setSending(true);
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("send failed");
          showSuccess();
        })
        .catch(() => {
          setSending(false);
          const alert = document.createElement("p");
          alert.className = "form-alert";
          alert.setAttribute("role", "alert");
          alert.innerHTML = "Something went wrong sending your inquiry. Please try again, or email us directly at <a href=\"mailto:madevisiblemv@gmail.com\">madevisiblemv@gmail.com</a>.";
          form.appendChild(alert);
        });
    });
  }

  /* ----------------------------------------------------------
     Footer year
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
