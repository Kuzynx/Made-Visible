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
  if (preloader && seenIntro) {
    // Returning within the session: skip the intro instead of replaying it on every page
    preloader.style.transitionDuration = "0.3s";
    preloader.classList.add("is-done");
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => {
        preloader && preloader.classList.add("is-done");
        try { sessionStorage.setItem("mv-intro", "1"); } catch (e) { /* ignore */ }
      }, 650);
    });
  }
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
     Custom cursor
     ---------------------------------------------------------- */
  const dot = document.querySelector(".cursor--dot");
  const ring = document.querySelector(".cursor--ring");
  if (dot && ring && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    let seen = false;
    let overText = false; // pointer is over an input/textarea (native I-beam zone)
    const setHidden = (hidden) => {
      dot.classList.toggle("is-hidden", hidden);
      ring.classList.toggle("is-hidden", hidden);
    };
    setHidden(true); // stay invisible until the first real mouse position

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!seen) {
        seen = true;
        rx = mx; ry = my;
        // Only hide the native cursor once the custom one has a real
        // position — a stationary pointer keeps the OS arrow until then
        document.documentElement.classList.add("has-cursor");
        if (!overText) setHidden(false);
      }
    }, { passive: true });

    (function cursorLoop() {
      rx += (mx - rx) * 0.22;
      ry += (my - ry) * 0.22;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(cursorLoop);
    })();

    document.querySelectorAll("a, button, .service-card, .work-item__visual").forEach((el) => {
      el.addEventListener("mouseenter", () => { dot.classList.add("is-hover"); ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", () => { dot.classList.remove("is-hover"); ring.classList.remove("is-hover"); });
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
    window.addEventListener("mousedown", () => ring.classList.add("is-pressed"));
    window.addEventListener("mouseup", () => ring.classList.remove("is-pressed"));
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
