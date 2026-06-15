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
  // Craters as fractions of the moon radius (fixed so they don't jitter).
  const MOON_CRATERS = [
    { dx: -0.30, dy: -0.22, r: 0.17 },
    { dx: 0.22, dy: -0.04, r: 0.12 },
    { dx: -0.06, dy: 0.30, r: 0.11 },
    { dx: 0.34, dy: 0.28, r: 0.07 },
    { dx: 0.05, dy: -0.42, r: 0.06 },
    { dx: -0.40, dy: 0.12, r: 0.06 },
  ];

  let W = 0, H = 0, DPR = 1, horizonY = 0, palmH = 0;
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
    // Keep the foreground palms in scale on tall, narrow phones so the
    // scene reads as a wide vista, not a zoomed-in crop.
    palmH = Math.min(W * 0.5, H * 0.44);
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

  // One drooping, tapered palm frond (filled leaf shape).
  function frond(ox, oy, ang, len, w) {
    const horiz = Math.abs(Math.cos(ang));        // 1 when the frond is horizontal
    const ex = ox + Math.cos(ang) * len;
    const ey = oy + Math.sin(ang) * len + horiz * len * 0.5; // tips fall with gravity
    const mx = ox + Math.cos(ang) * len * 0.55;
    const my = oy + Math.sin(ang) * len * 0.55 + horiz * len * 0.14;
    const pa = ang + Math.PI / 2;
    const px = Math.cos(pa) * w, py = Math.sin(pa) * w;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(mx + px, my + py, ex, ey);
    ctx.quadraticCurveTo(mx - px, my - py, ox, oy);
    ctx.fill();
  }

  function palm(baseX, dir, h) {
    const baseY = H + 8;
    const crownX = baseX + dir * h * 0.16;
    const crownY = baseY - h;
    const tw = Math.max(5, h * 0.045);
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    // Curved, tapered trunk
    ctx.beginPath();
    ctx.moveTo(baseX - tw, baseY);
    ctx.quadraticCurveTo(baseX + dir * h * 0.02, baseY - h * 0.55, crownX - tw * 0.5, crownY);
    ctx.lineTo(crownX + tw * 0.5, crownY);
    ctx.quadraticCurveTo(baseX + dir * h * 0.1 + tw, baseY - h * 0.55, baseX + tw, baseY);
    ctx.closePath();
    ctx.fill();
    // Coconut cluster at the crown
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(crownX + (i - 1) * tw * 0.95, crownY + tw * 0.5, tw * 0.55, 0, 6.2832);
      ctx.fill();
    }
    // Crown of drooping fronds
    const N = 9;
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1);
      const ang = -Math.PI * 0.5 + (f - 0.5) * Math.PI * 1.45;
      const len = h * (0.5 + 0.16 * Math.sin(f * Math.PI));
      frond(crownX, crownY, ang, len, h * 0.05);
    }
  }

  function frame(t) {
    const forced = window.__HERO_FORCE_P;
    let p = typeof forced === "number" ? forced : (Math.sin(t * 0.32) + 1) / 2; // ~20s breathe
    p = p * p * (3 - 2 * p); // ease: linger at golden hour and at night
    const night = 1 - p;
    const narrow = W < 700;

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

    // ── Moon (rises through the night, opposite the sun) ──
    if (night > 0.4) {
      const mA = Math.min(1, (night - 0.4) / 0.4);
      const moonX = W * 0.74;
      const moonY = lerp(horizonY * 0.82, H * 0.16, night);
      const moonR = Math.min(W, H) * (narrow ? 0.05 : 0.052);
      // Soft halo
      const mh = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 3.4);
      mh.addColorStop(0, rgba([206, 220, 255], 0.45 * mA));
      mh.addColorStop(1, rgba([206, 220, 255], 0));
      ctx.fillStyle = mh;
      ctx.fillRect(moonX - moonR * 3.4, moonY - moonR * 3.4, moonR * 6.8, moonR * 6.8);
      // Disc with a soft lit gradient
      const md = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.2, moonX, moonY, moonR);
      md.addColorStop(0, rgba([246, 249, 255], mA));
      md.addColorStop(1, rgba([198, 209, 236], mA));
      ctx.fillStyle = md;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, 6.2832);
      ctx.fill();
      // Craters + terminator, clipped to the disc
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, 6.2832);
      ctx.clip();
      for (const c of MOON_CRATERS) {
        ctx.fillStyle = rgba([168, 180, 210], 0.55 * mA);
        ctx.beginPath();
        ctx.arc(moonX + c.dx * moonR, moonY + c.dy * moonR, c.r * moonR, 0, 6.2832);
        ctx.fill();
      }
      const term = ctx.createLinearGradient(moonX - moonR, 0, moonX + moonR, 0);
      term.addColorStop(0, rgba([18, 22, 46], 0));
      term.addColorStop(1, rgba([18, 22, 46], 0.4 * mA));
      ctx.fillStyle = term;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }

    // ── Sun (drawn before sea so it "sinks" into the water) ──
    const sunX = W * 0.5;
    const sunY = lerp(horizonY + H * 0.12, H * 0.13, p);
    const sunR = Math.min(W, H) * (narrow ? 0.072 : 0.085);
    const sunCol = mix(SUN_LOW, SUN_HIGH, p);
    // Atmospheric glow
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * (narrow ? 4.6 : 5.6));
    glow.addColorStop(0, rgba(sunCol, 0.95));
    glow.addColorStop(0.18, rgba(sunCol, 0.5));
    glow.addColorStop(0.5, rgba(mix(sunCol, SKY_DAY[2], 0.5), 0.16 * p + 0.05));
    glow.addColorStop(1, rgba(sunCol, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizonY + sunR);
    // Soft corona rays
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + t * 0.06;
      const r1 = sunR * 1.12;
      const r2 = sunR * (1.5 + 0.55 * Math.sin(t * 1.6 + i * 1.7));
      ctx.globalAlpha = 0.10 * p;
      ctx.strokeStyle = rgb(mix(sunCol, [255, 240, 200], 0.4));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(a) * r1, sunY + Math.sin(a) * r1);
      ctx.lineTo(sunX + Math.cos(a) * r2, sunY + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
    // Disc with limb shading
    const disc = ctx.createRadialGradient(sunX, sunY - sunR * 0.25, sunR * 0.1, sunX, sunY, sunR);
    disc.addColorStop(0, rgb(mix(sunCol, [255, 255, 248], 0.65)));
    disc.addColorStop(0.55, rgb(sunCol));
    disc.addColorStop(1, rgb(mix(sunCol, [196, 64, 30], 0.55)));
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, 6.2832);
    ctx.fill();
    // Bright upper rim
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = rgb(mix(sunCol, [255, 255, 255], 0.6));
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 0.97, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.globalAlpha = 1;

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
    palm(W * 0.08, -1, palmH);
    palm(W * 0.92, 1, palmH);
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
