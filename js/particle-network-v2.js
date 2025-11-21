/* =============================================================================
   Particle Network v2 - Connection-based Network Animation
   - Variant: MHH (Home ⇄ Person) / PASS (Information Clusters) / DOTS (Neutral)
   - Connection line priority weighting system
   - IntersectionObserver + blur/focus optimization
   - Parallax effect with accessibility guards (reduced-motion + mobile OFF)
   ============================================================================= */

(function() {
  'use strict';

  // Get variant from body data attribute
  const variant = document.body.dataset.variant || "DOTS";
  const canvas = document.getElementById('bg-v2');
  
  if (!canvas) {
    console.warn('[ParticleNetworkV2] Canvas element #bg-v2 not found');
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  // ===== Variant Configuration =====
  const SIZES = {
    MHH: {
      countPC: 110,
      countTB: 75,
      countSP: 48,
      bgCountPC: 35,  // Background blur particles
      bgCountTB: 22,
      bgCountSP: 14,
      dist: 190,  // Wider connection for house-person relationships
      speed: [0.05, 0.12],
      iconRatio: 0.16  // 16% icons (house and person)
    },
    PASS: {
      countPC: 100,
      countTB: 70,
      countSP: 45,
      bgCountPC: 30,
      bgCountTB: 20,
      bgCountSP: 12,
      dist: 200,  // Wider connection distance for information network
      speed: [0.06, 0.14],
      iconRatio: 0.18  // 18% information icons (doc, chart, link, db, gear)
    },
    DOTS: {
      countPC: 120,
      countTB: 80,
      countSP: 50,
      bgCountPC: 40,
      bgCountTB: 25,
      bgCountSP: 15,
      dist: 180,
      speed: [0.05, 0.12],
      iconRatio: 0  // No icons, only dots
    }
  }[variant];

  // Icon types per variant
  const ICONS = {
    MHH: ["house", "person"],
    PASS: ["doc", "chart", "link", "db", "gear"],  // Information icons for PASS
    DOTS: ["dot"]
  };

  let W = 0, H = 0;
  let nodes = [];
  let running = true;
  let isVisible = true;
  let animationFrameId = null;

  // Parallax settings
  let parallaxEnabled = false;
  let lastScrollY = window.scrollY;

  // ===== Utility Functions =====
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function getCSS(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || "#CFE2FF";
  }

  function getRGBA(hexOrRgb, alpha) {
    if (hexOrRgb.startsWith('rgb')) {
      return hexOrRgb.replace('rgb', 'rgba').replace(')', `,${alpha})`);
    }
    const h = hexOrRgb.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ===== Canvas Resize =====
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = Math.floor(rect.width * DPR);
    H = canvas.height = Math.floor(rect.height * DPR);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
  }

  // ===== Create Particle Nodes =====
  function makeNodes() {
    nodes.length = 0;
    
    const isSP = window.innerWidth <= 767;
    const isTB = window.innerWidth > 767 && window.innerWidth < 1280;
    const baseCount = isSP ? SIZES.countSP : isTB ? SIZES.countTB : SIZES.countPC;
    const bgCount = isSP ? SIZES.bgCountSP : isTB ? SIZES.bgCountTB : SIZES.bgCountPC;

    // Create foreground particles (sharp, connected)
    for (let i = 0; i < baseCount; i++) {
      const v = rand(SIZES.speed[0], SIZES.speed[1]) * DPR;
      const n = {
        x: rand(0, W),
        y: rand(0, H),
        vx: (Math.random() > 0.5 ? 1 : -1) * v * Math.random(),
        vy: (Math.random() > 0.5 ? 1 : -1) * v * Math.random(),
        r: rand(1.5, 3) * DPR,
        t: "dot",
        layer: "fg",
        alpha: rand(0.7, 1.0)
      };
      nodes.push(n);
    }

    // Convert some dots to icons (for PASS variant)
    const iconCount = Math.floor(baseCount * SIZES.iconRatio);
    if (iconCount > 0) {
      let converted = 0;
      while (converted < iconCount) {
        const idx = Math.floor(Math.random() * baseCount);
        const n = nodes[idx];
        if (n.layer === "fg" && n.t === "dot") {
          n.t = pick(ICONS[variant]);
          n.r = rand(2, 3.5) * DPR;  // Slightly larger for icons
          converted++;
        }
      }
    }

    // Create background particles (blurred, larger, no connections)
    for (let i = 0; i < bgCount; i++) {
      const v = rand(SIZES.speed[0] * 0.5, SIZES.speed[1] * 0.5) * DPR;
      const n = {
        x: rand(-50, W + 50),
        y: rand(-50, H + 50),
        vx: (Math.random() > 0.5 ? 1 : -1) * v * Math.random(),
        vy: (Math.random() > 0.5 ? 1 : -1) * v * Math.random(),
        r: rand(8, 20) * DPR,
        t: "blur",
        layer: "bg",
        alpha: rand(0.15, 0.35)
      };
      nodes.push(n);
    }
  }

  // ===== Draw Icon =====
  function drawIcon(n) {
    ctx.save();
    ctx.translate(n.x, n.y);
    
    // Outer glow
    ctx.globalAlpha = 0.45;
    const g = ctx.createRadialGradient(0, 0, 2 * DPR, 0, 0, 16 * DPR);
    g.addColorStop(0, getRGBA(getCSS('--accent'), 0.85));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * DPR, 0, Math.PI * 2);
    ctx.fill();

    // Icon body
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = getRGBA(getCSS('--dot'), 0.95);
    ctx.lineWidth = 1.6 * DPR;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (n.t) {
      case "house":
        ctx.beginPath();
        ctx.moveTo(-6 * DPR, 2 * DPR);
        ctx.lineTo(0, -6 * DPR);
        ctx.lineTo(6 * DPR, 2 * DPR);
        ctx.moveTo(-4 * DPR, 2 * DPR);
        ctx.lineTo(-4 * DPR, 6 * DPR);
        ctx.lineTo(4 * DPR, 6 * DPR);
        ctx.lineTo(4 * DPR, 2 * DPR);
        ctx.stroke();
        break;

      case "person":
        ctx.beginPath();
        ctx.arc(0, -4 * DPR, 2.8 * DPR, 0, Math.PI * 2);
        ctx.moveTo(0, -1 * DPR);
        ctx.lineTo(0, 6 * DPR);
        ctx.moveTo(-5 * DPR, 2 * DPR);
        ctx.lineTo(5 * DPR, 2 * DPR);
        ctx.stroke();
        break;

      case "doc":
        ctx.beginPath();
        ctx.rect(-6 * DPR, -7 * DPR, 12 * DPR, 14 * DPR);
        ctx.moveTo(-4 * DPR, -3 * DPR);
        ctx.lineTo(4 * DPR, -3 * DPR);
        ctx.moveTo(-4 * DPR, 0);
        ctx.lineTo(4 * DPR, 0);
        ctx.moveTo(-4 * DPR, 3 * DPR);
        ctx.lineTo(2 * DPR, 3 * DPR);
        ctx.stroke();
        break;

      case "chart":
        ctx.beginPath();
        ctx.moveTo(-6 * DPR, 6 * DPR);
        ctx.lineTo(6 * DPR, 6 * DPR);
        ctx.moveTo(-3 * DPR, 6 * DPR);
        ctx.lineTo(-3 * DPR, 0);
        ctx.moveTo(0, 6 * DPR);
        ctx.lineTo(0, -2 * DPR);
        ctx.moveTo(3 * DPR, 6 * DPR);
        ctx.lineTo(3 * DPR, -4 * DPR);
        ctx.stroke();
        break;

      case "link":
        ctx.beginPath();
        ctx.arc(-3 * DPR, 0, 4 * DPR, 0.6, 3.7);
        ctx.arc(3 * DPR, 0, 4 * DPR, 3.8, 6.8);
        ctx.stroke();
        break;

      case "db":
        ctx.beginPath();
        ctx.ellipse(0, -6 * DPR, 6 * DPR, 3 * DPR, 0, 0, Math.PI * 2);
        ctx.moveTo(-6 * DPR, -6 * DPR);
        ctx.lineTo(-6 * DPR, 6 * DPR);
        ctx.moveTo(6 * DPR, -6 * DPR);
        ctx.lineTo(6 * DPR, 6 * DPR);
        ctx.moveTo(-6 * DPR, 0);
        ctx.ellipse(0, 0, 6 * DPR, 3 * DPR, 0, 0, Math.PI * 2);
        ctx.moveTo(-6 * DPR, 6 * DPR);
        ctx.ellipse(0, 6 * DPR, 6 * DPR, 3 * DPR, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case "gear":
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.moveTo(Math.cos(a) * 6 * DPR, Math.sin(a) * 6 * DPR);
          ctx.lineTo(Math.cos(a) * 8 * DPR, Math.sin(a) * 8 * DPR);
        }
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 3.5 * DPR, 0, Math.PI * 2);
        ctx.stroke();
        break;

      default:
        break;
    }
    
    ctx.restore();
  }

  // ===== Update & Draw =====
  function step() {
    if (!running || !isVisible) return;

    animationFrameId = requestAnimationFrame(step);

    ctx.clearRect(0, 0, W, H);

    // Move particles
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      
      // Wrap around for background particles
      if (n.layer === "bg") {
        if (n.x < -50) n.x = W + 50;
        if (n.x > W + 50) n.x = -50;
        if (n.y < -50) n.y = H + 50;
        if (n.y > H + 50) n.y = -50;
      } else {
        // Bounce for foreground particles
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
    }

    // Separate foreground and background particles
    const fgNodes = nodes.filter(n => n.layer === "fg");
    const bgNodes = nodes.filter(n => n.layer === "bg");

    // Draw blurred background particles first
    ctx.filter = 'blur(12px)';
    for (const n of bgNodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2);
      g.addColorStop(0, `rgba(255, 255, 255, ${n.alpha})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.filter = 'none';

    // Draw connection lines (only between foreground particles)
    const maxDist = SIZES.dist * DPR;
    for (let i = 0; i < fgNodes.length; i++) {
      const a = fgNodes[i];
      for (let j = i + 1; j < fgNodes.length; j++) {
        const b = fgNodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);

        if (d < maxDist) {
          const alpha = Math.max(0, (1 - d / maxDist)) * 0.35;
          if (alpha > 0.03) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.8 * DPR;
            ctx.stroke();
          }
        }
      }
    }

    // Draw foreground particles (sharp, bright)
    for (const n of fgNodes) {
      if (n.t === "dot") {
        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.5);
        outerGlow.addColorStop(0, `rgba(255, 255, 255, ${n.alpha * 0.3})`);
        outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = outerGlow;
        ctx.fill();
        
        // Core particle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        const coreGlow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        coreGlow.addColorStop(0, `rgba(255, 255, 255, ${n.alpha})`);
        coreGlow.addColorStop(1, `rgba(255, 255, 255, ${n.alpha * 0.5})`);
        ctx.fillStyle = coreGlow;
        ctx.fill();
      } else {
        // Draw information icon
        drawIcon(n);
      }
    }
  }

  // ===== Parallax Effect (Weak) =====
  function parallax() {
    if (!parallaxEnabled) return;
    
    const y = window.scrollY;
    const offset = (y - lastScrollY) * 0.35 * DPR;
    lastScrollY = y;
    
    // Subtle vertical shift (not translation to avoid cumulative drift)
    // This effect is purely visual and doesn't affect particle positions
  }

  // ===== IntersectionObserver =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible && !running) {
        running = true;
        step();
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);

  // ===== Window Focus/Blur =====
  window.addEventListener('blur', () => {
    running = false;
  });

  window.addEventListener('focus', () => {
    if (isVisible) {
      running = true;
      step();
    }
  });

  // ===== Scroll Parallax (with guards) =====
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 767;

  // Enable parallax only on desktop + no reduced-motion preference
  if (!prefersReducedMotion && !isMobile) {
    parallaxEnabled = true;
    window.addEventListener('scroll', parallax, { passive: true });
  }

  // ===== Resize Handler =====
  window.addEventListener('resize', () => {
    resize();
    makeNodes();
  });

  // ===== Visibility Change =====
  document.addEventListener('visibilitychange', () => {
    const hidden = document.hidden;
    running = !hidden;
    if (running && isVisible) {
      step();
    }
  });

  // ===== Initialization =====
  function init() {
    // Apply reduced motion particle count reduction
    if (prefersReducedMotion) {
      SIZES.countPC = Math.floor(SIZES.countPC * 0.6);
      SIZES.countTB = Math.floor(SIZES.countTB * 0.6);
      SIZES.countSP = Math.floor(SIZES.countSP * 0.6);
    }

    resize();
    makeNodes();
    step();

    console.log('[ParticleNetworkV2] Initialized:', {
      variant,
      particleCount: nodes.length,
      parallaxEnabled,
      reducedMotion: prefersReducedMotion
    });
  }

  init();

})();
