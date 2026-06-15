"use strict";

/* ============================================================
   TEKILA BAR -- "El Atardecer" animated hero
   A code-driven sunset on the Malecon that breathes from golden
   hour (Arriba) into the Bottom Bar's neon night (Abajo) and back.
   Pure 2D canvas. iOS-safe (no filters/blend/mask). Honors
   prefers-reduced-motion with a single static golden-hour frame.
   Optional window.__HERO_FORCE_P (0..1) pins the day/night phase
   (used only for screenshots).
   ============================================================ */

(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sky gradient stops (top -> horizon), day vs night, lerped by p.
  const STOPS = [0, 0.45, 0.72, 1];
  const SKY_DAY = [[34, 30, 78], [122, 58, 120], [216, 92, 50], [255, 190, 96]];
  const SKY_NIGHT = [[4, 4, 16], [10, 8, 32], [20, 12, 48], [42, 18, 70]];
  const SUN_LOW = [255, 96, 44];     // sun near/under horizon
  const SUN_HIGH = [255, 244, 202];  // sun high in golden hour
  const SEA_TOP_DAY = [232, 122, 70], SEA_TOP_NIGHT = [22, 16, 48];
  const SEA_BOT_DAY = [14, 20, 50], SEA_BOT_NIGHT = [3, 4, 14];
  const EMBER = [255, 202, 128];
  const NEON_A = [255, 45, 149], NEON_B = [54, 226, 255];

  let W = 0, H = 0, DPR = 1, horizonY = 0;
  let stars = [], embers = [], garland = [];

  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    horizonY = H * 0.6;
    build();
  }

  function build() {
    stars = [];
    const n = Math.round((W * H) / 14000);
    for (let i = 0; i < n; i++) {
      stars.push({ x: rand(0, W), y: rand(0, horizonY * 0.92), r: rand(0.4, 1.5), ph: rand(0, 6.28) });
    }
    embers = [];
    const m = Math.round(W / 34) + 14;
    for (let i = 0; i < m; i++) {
      embers.push({ x: rand(0, W), y: rand(0, H), r: rand(0.8, 2.4), sp: rand(0.15, 0.55), dr: rand(0.4, 1.1), ph: rand(0, 6.28) });
    }
    garland = [];
    const g = 22;
    for (let i = 0; i < g; i++) {
      const u = i / (g - 1);
      garland.push({ x: u * W, y: H * 0.05 + Math.sin(u * Math.PI) * (H * 0.05), ph: rand(0, 6.28) });
    }
  }

  function palm(baseX, dir) {
    // Trunk
    const baseY = H + 6;
    const topX = baseX + dir * W * 0.04;
    const topY = H * 0.46;
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.beginPath();
    ctx.moveTo(baseX - 7, baseY);
    ctx.quadraticCurveTo(baseX + dir * 6, H * 0.74, topX - 4, topY);
    ctx.lineTo(topX + 4, topY);
    ctx.quadraticCurveTo(baseX + dir * 18, H * 0.74, baseX + 7, baseY);
    ctx.closePath();
    ctx.fill();
    // Fronds
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const ang = (-Math.PI * 0.5) + dir * (i - 3) * 0.42;
      const len = H * (0.17 + (i % 2) * 0.05);
      const ex = topX + Math.cos(ang) * len;
      const ey = topY + Math.sin(ang) * len * 0.8;
      const mx = topX + Math.cos(ang) * len * 0.5 - dir * 8;
      const my = topY + Math.sin(ang) * len * 0.5 - 18;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
  }

  function frame(t) {
    const forced = window.__HERO_FORCE_P;
    let p = typeof forced === "number" ? forced : (Math.sin(t * 0.32) + 1) / 2; // ~20s breathe
    // Ease so it lingers at golden hour and at night
    p = p * p * (3 - 2 * p);
    const night = 1 - p;

    ctx.clearRect(0, 0, W, H);

    // ── Sky ──
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + H * 0.06);
    for (let i = 0; i < STOPS.length; i++) sky.addColorStop(STOPS[i], rgb(mix(SKY_NIGHT[i], SKY_DAY[i], p)));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizonY + 2);

    // ── Stars ──
    if (night > 0.02) {
      for (const s of stars) {
        const a = night * (0.45 + 0.55 * Math.sin(t * 2 + s.ph)) * 0.9;
        if (a <= 0) continue;
        ctx.fillStyle = rgba([255, 250, 235], Math.max(0, a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
    }

    // ── Sun (drawn before sea so it "sinks" into the water) ──
    const sunX = W * 0.5;
    const sunY = lerp(horizonY + H * 0.12, H * 0.13, p);
    const sunR = Math.min(W, H) * 0.085;
    const sunCol = mix(SUN_LOW, SUN_HIGH, p);
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 5.5);
    glow.addColorStop(0, rgba(sunCol, 0.95));
    glow.addColorStop(0.18, rgba(sunCol, 0.55));
    glow.addColorStop(0.5, rgba(mix(sunCol, SKY_DAY[2], 0.5), 0.18 * p + 0.05));
    glow.addColorStop(1, rgba(sunCol, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizonY + sunR);
    ctx.fillStyle = rgba(sunCol, 0.95);
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, 6.2832);
    ctx.fill();

    // ── Sea ──
    const sea = ctx.createLinearGradient(0, horizonY, 0, H);
    sea.addColorStop(0, rgb(mix(SEA_TOP_NIGHT, SEA_TOP_DAY, p)));
    sea.addColorStop(1, rgb(mix(SEA_BOT_NIGHT, SEA_BOT_DAY, p)));
    ctx.fillStyle = sea;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // ── Sun reflection shimmer ──
    for (let i = 0; i < 26; i++) {
      const depth = i / 26;
      const yy = horizonY + depth * (H - horizonY);
      const sway = Math.sin(t * 2 + i * 0.6) * (5 + depth * depth * 42);
      const w = sunR * (1.5 - depth * 0.7);
      const a = 0.5 * (1 - depth) * (0.55 + 0.45 * Math.sin(t * 3 + i)) * (0.2 + p * 0.85);
      if (a <= 0) continue;
      ctx.fillStyle = rgba(sunCol, Math.max(0, a));
      ctx.fillRect(sunX - w / 2 + sway, yy, w, 2 + depth * 4);
    }

    // ── Neon horizon (Bottom Bar waking up) ──
    if (night > 0.02) {
      const cyc = (Math.sin(t * 0.5) + 1) / 2;
      const neon = mix(NEON_A, NEON_B, cyc);
      const gh = H * 0.11;
      const ng = ctx.createLinearGradient(0, horizonY - gh, 0, horizonY + gh);
      ng.addColorStop(0, rgba(neon, 0));
      ng.addColorStop(0.5, rgba(neon, 0.5 * night));
      ng.addColorStop(1, rgba(neon, 0));
      ctx.fillStyle = ng;
      ctx.fillRect(0, horizonY - gh, W, gh * 2);
      ctx.fillStyle = rgba(neon, 0.85 * night);
      ctx.fillRect(0, horizonY - 1, W, 2);
    }

    // ── Garland (terrace string lights) ──
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < garland.length; i++) {
      const b = garland[i];
      if (i === 0) ctx.moveTo(b.x, b.y); else ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    for (const b of garland) {
      const fl = 0.55 + 0.45 * Math.sin(t * 4 + b.ph);
      const a = (0.3 + 0.7 * night) * fl;
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7);
      bg.addColorStop(0, rgba([255, 214, 140], a));
      bg.addColorStop(1, rgba([255, 214, 140], 0));
      ctx.fillStyle = bg;
      ctx.fillRect(b.x - 7, b.y - 7, 14, 14);
      ctx.fillStyle = rgba([255, 236, 190], a);
      ctx.beginPath();
      ctx.arc(b.x, b.y, 1.6, 0, 6.2832);
      ctx.fill();
    }

    // ── Foreground silhouettes: palms + terrace railing ──
    palm(W * 0.085, -1);
    palm(W * 0.915, 1);
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    const railY = H * 0.95;
    ctx.fillRect(0, railY, W, 4);
    for (let x = W * 0.04; x < W; x += Math.max(38, W / 26)) {
      ctx.fillRect(x, railY, 5, H - railY);
    }

    // ── Embers / fireflies ──
    for (const e of embers) {
      e.y -= e.sp;
      e.x += Math.sin(t * e.dr + e.ph) * 0.3;
      if (e.y < -4) { e.y = H + 4; e.x = rand(0, W); }
      const a = (0.35 + 0.45 * night) * (0.5 + 0.5 * Math.sin(t * 3 + e.ph));
      const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3);
      eg.addColorStop(0, rgba(EMBER, Math.max(0, a)));
      eg.addColorStop(1, rgba(EMBER, 0));
      ctx.fillStyle = eg;
      ctx.fillRect(e.x - e.r * 3, e.y - e.r * 3, e.r * 6, e.r * 6);
    }
  }

  let raf = 0;
  function loop(now) {
    frame(now * 0.001);
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  if (reduce) {
    if (typeof window.__HERO_FORCE_P !== "number") window.__HERO_FORCE_P = 0.8; // calm golden-hour still
    frame(0);
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(loop);
    });
  }
})();
