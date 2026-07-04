# ResNet-50 Vision Classifier

A local web app that classifies any image (given as a URL) using a pretrained **ResNet-50** trained on **ImageNet-1K**, with a camera-aperture themed 3D interface built on **Flask**.

---

## ✨ Features

- 🔗 Classify any image by pasting its **URL** — no upload needed
- 🎛️ Adjustable **Top-K** predictions (1–20)
- 🎥 GPU-accelerated inference (auto-detects CUDA, falls back to CPU)
- 🌀 Camera-iris reveal animation for the input image
- 🧊 3D tilt effect on the image card (follows your cursor)
- 💡 Ambient drifting bokeh-light background
- 📊 Animated confidence bars for each predicted class
- 🖥️ Shows which device (CPU/GPU) ran the inference

---

## 📁 Project Structure

```
resnet50_ui/
├── app.py                     # Flask server + ResNet-50 model + /predict route
├── requirements.txt           # Python dependencies
├── templates/
│   └── index.html             # Main HTML page
└── static/
    ├── css/
    │   └── style.css          # All styling (design system, layout, animations)
    └── js/
        ├── main.js            # UI logic — tilt, iris reveal, fetch calls
        └── bokeh.js           # Drifting background light-orb animation
```

---

## ⚙️ Requirements

- Python 3.9 – 3.11 (tested on 3.11.15)
- Conda environment with PyTorch already installed (CPU or GPU build)
- Internet connection (for downloading the image + ImageNet class labels)

---

## 🚀 Setup & Installation

### 1. Activate your existing PyTorch environment
```bash
conda activate pytorch
```

### 2. Navigate to the project folder
```bash
cd path\to\resnet50_ui
```

### 3. Install remaining dependencies
Your environment likely already has `torch`, `torchvision`, `requests`, and `pillow` — this just adds Flask:
```bash
pip install -r requirements.txt
```

> ⚠️ If you get an `OMP: Error #15` crash related to `libiomp5md.dll`, this is already handled inside `app.py` via:
> ```python
> os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
> ```
> No extra steps needed.

---

## ▶️ Running the App

```bash
python app.py
```

You should see startup logs like:
```
[startup] Using device: cuda
[startup] Loading pretrained ResNet-50 ...
[startup] Model ready.
[startup] Downloading ImageNet class labels ...
[startup] Loaded 1000 labels.
 * Running on http://127.0.0.1:5000
```

- `Using device: cuda` → GPU is being used ✅
- `Using device: cpu` → GPU wasn't detected — check your PyTorch install (`torch.cuda.is_available()`)

Then open your browser and go to:
```
http://127.0.0.1:5000
```

To stop the server: press `Ctrl + C` in the terminal.

---

## 🖱️ How to Use

1. Paste an image **URL** into the input field
   - Example: `https://images.pexels.com/photos/32073659/pexels-photo-32073659.jpeg`
2. Set **Top K** (how many predictions to return — default: 5)
3. Click **Classify**
4. View:
   - The input image inside the animated iris frame
   - Ranked predictions with confidence percentages
   - The compute device used (CPU/GPU)

---

## 🔌 API Endpoint

### `POST /predict`

**Request body (JSON):**
```json
{
  "url": "https://example.com/image.jpg",
  "k": 5
}
```

**Success response (200):**
```json
{
  "image_url": "https://example.com/image.jpg",
  "device": "cuda",
  "predictions": [
    { "rank": 1, "label": "cock", "confidence": 42.38 },
    { "rank": 2, "label": "hen", "confidence": 6.90 }
  ]
}
```

**Error response (400 / 500):**
```json
{ "error": "Couldn't fetch that image. Check the URL and try again." }
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0B0E14` | Page background |
| `--panel` | `#141924` | Cards / console |
| `--amber` | `#E8A33D` | Primary accent, top prediction |
| `--cyan` | `#4FD1C5` | Secondary accent, reticle, other predictions |
| `--text` | `#EDEAE3` | Primary text |
| `--muted` | `#8B93A1` | Secondary text |

**Fonts:**
- `Space Grotesk` — headings / display
- `Inter` — body text
- `JetBrains Mono` — data, labels, percentages

---

## 🛠️ Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `OMP: Error #15` crash | Duplicate OpenMP runtime (torch + numpy/MKL) | Already fixed in `app.py`; ensure you're running the updated file |
| "Couldn't fetch that image" | URL blocks hotlinking, requires auth, or is invalid | Try a direct image link (e.g. from Pexels/Unsplash) |
| `Using device: cpu` despite having a GPU | GPU-enabled torch not installed in this env | Reinstall matching CUDA build: see [pytorch.org](https://pytorch.org/get-started/locally/) |
| Page loads but styling looks broken | Static files not found | Confirm `static/` and `templates/` folders sit next to `app.py`, not inside another subfolder |
| Changes to HTML/CSS/JS not showing | Browser cache / server not reloaded | Hard refresh (`Ctrl+Shift+R`); restart `python app.py` if not using `debug=True` |

---

## 📌 Notes

- The model uses `ResNet50_Weights.IMAGENET1K_V2` pretrained weights (1000 ImageNet classes).
- Class labels are fetched live from PyTorch's official GitHub repo on startup.
- `Top K` is capped between 1 and 20 in both frontend and backend for UI sanity.
- This app is intended for **local/personal use** (`debug=True`) — not configured for production deployment.

---

## 📄 License

Personal / educational use.