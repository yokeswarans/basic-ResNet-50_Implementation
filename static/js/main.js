// ---------------------------------------------------------------------
// Build the iris blades (8 wedges around the frame)
// ---------------------------------------------------------------------
const BLADE_COUNT = 8;
const bladesEl = document.getElementById('irisBlades');

for (let i = 0; i < BLADE_COUNT; i++) {
  const blade = document.createElement('div');
  blade.className = 'blade';
  const baseRot = (360 / BLADE_COUNT) * i;
  blade.style.setProperty('--i', i);
  blade.style.setProperty('--rot', `${baseRot}deg`);
  blade.style.transform = `rotate(${baseRot}deg)`;
  bladesEl.appendChild(blade);
}

// ---------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------
const imgUrlEl = document.getElementById('imgUrl');
const kValueEl = document.getElementById('kValue');
const kMinusEl = document.getElementById('kMinus');
const kPlusEl = document.getElementById('kPlus');
const classifyBtn = document.getElementById('classifyBtn');
const statusLine = document.getElementById('statusLine');
const resultStage = document.getElementById('resultStage');
const previewImg = document.getElementById('previewImg');
const irisCard = document.getElementById('irisCard');
const predictionList = document.getElementById('predictionList');
const kEcho = document.getElementById('kEcho');
const deviceEcho = document.getElementById('deviceEcho');

// ---------------------------------------------------------------------
// K stepper
// ---------------------------------------------------------------------
function clampK(v) {
  v = parseInt(v, 10);
  if (isNaN(v)) v = 5;
  return Math.min(20, Math.max(1, v));
}
kMinusEl.addEventListener('click', () => {
  kValueEl.value = clampK(parseInt(kValueEl.value, 10) - 1);
});
kPlusEl.addEventListener('click', () => {
  kValueEl.value = clampK(parseInt(kValueEl.value, 10) + 1);
});
kValueEl.addEventListener('change', () => {
  kValueEl.value = clampK(kValueEl.value);
});

// ---------------------------------------------------------------------
// 3D tilt on the iris card
// ---------------------------------------------------------------------
irisCard.addEventListener('mousemove', (e) => {
  const rect = irisCard.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;   // 0..1
  const y = (e.clientY - rect.top) / rect.height;   // 0..1
  const rotY = (x - 0.5) * 14;   // left/right tilt
  const rotX = (0.5 - y) * 14;   // up/down tilt
  irisCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
});
irisCard.addEventListener('mouseleave', () => {
  irisCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
});

// ---------------------------------------------------------------------
// Classify action
// ---------------------------------------------------------------------
function setStatus(msg, isError = false) {
  statusLine.textContent = msg;
  statusLine.classList.toggle('error', isError);
}

function renderPredictions(predictions) {
  predictionList.innerHTML = '';
  predictions.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'pred-row';
    li.innerHTML = `
      <span class="pred-rank">${String(p.rank).padStart(2, '0')}</span>
      <div class="pred-main">
        <span class="pred-label">${p.label}</span>
        <div class="pred-track"><div class="pred-fill" data-target="${p.confidence}"></div></div>
      </div>
      <span class="pred-pct">${p.confidence.toFixed(2)}%</span>
    `;
    predictionList.appendChild(li);
  });

  // animate bar fills on next frame so the transition is visible
  requestAnimationFrame(() => {
    document.querySelectorAll('.pred-fill').forEach((el) => {
      el.style.width = `${el.dataset.target}%`;
    });
  });
}

async function classify() {
  const url = imgUrlEl.value.trim();
  const k = clampK(kValueEl.value);
  kValueEl.value = k;

  if (!url) {
    setStatus('Paste an image URL first.', true);
    imgUrlEl.focus();
    return;
  }

  classifyBtn.disabled = true;
  classifyBtn.classList.add('working');
  setStatus('Focusing the lens…');
  irisCard.classList.remove('open');

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, k }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || 'Something went wrong.', true);
      return;
    }

    previewImg.src = data.image_url;
    kEcho.textContent = k;
    deviceEcho.textContent = data.device;
    renderPredictions(data.predictions);

    resultStage.classList.remove('hidden');
    // let the browser lay out the image before opening the iris
    requestAnimationFrame(() => {
      requestAnimationFrame(() => irisCard.classList.add('open'));
    });

    setStatus(`Read ${data.predictions.length} classes from this exposure.`);
    resultStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    setStatus('Network error — is the Flask server running?', true);
  } finally {
    classifyBtn.disabled = false;
    classifyBtn.classList.remove('working');
  }
}

classifyBtn.addEventListener('click', classify);
imgUrlEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') classify();
});
