// Soft, slow-drifting bokeh orbs behind the content — like unfocused
// light circles behind a camera lens. Pure canvas, no images/assets.
(function () {
  const canvas = document.getElementById('bokehCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = [
    'rgba(232,163,61,ALPHA)', // amber
    'rgba(79,209,197,ALPHA)', // cyan
    'rgba(237,234,227,ALPHA)', // warm white
  ];

  const rand = (min, max) => Math.random() * (max - min) + min;

  const ORB_COUNT = 14;
  const orbs = Array.from({ length: ORB_COUNT }, () => ({
    x: rand(0, 1),
    y: rand(0, 1),
    r: rand(70, 200),
    baseAlpha: rand(0.03, 0.08),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    speedX: rand(-0.00010, 0.00010),
    speedY: rand(-0.00007, 0.00007),
    driftPhase: rand(0, Math.PI * 2),
    driftSpeed: rand(0.00015, 0.00030),
    driftAmp: rand(0.02, 0.05),
  }));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    orbs.forEach((o) => {
      const px = (o.x + Math.sin(o.driftPhase) * o.driftAmp) * width;
      const py = (o.y + Math.cos(o.driftPhase * 0.8) * o.driftAmp) * height;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, o.r);
      grad.addColorStop(0, o.color.replace('ALPHA', o.baseAlpha));
      grad.addColorStop(1, o.color.replace('ALPHA', 0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (reduceMotion) {
    draw(); // static single frame, no motion
    return;
  }

  let last = performance.now();
  function frame(now) {
    const dt = now - last;
    last = now;

    orbs.forEach((o) => {
      o.x += o.speedX * dt;
      o.y += o.speedY * dt;
      o.driftPhase += o.driftSpeed * dt;

      if (o.x < -0.15) o.x = 1.15;
      if (o.x > 1.15) o.x = -0.15;
      if (o.y < -0.15) o.y = 1.15;
      if (o.y > 1.15) o.y = -0.15;
    });

    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
