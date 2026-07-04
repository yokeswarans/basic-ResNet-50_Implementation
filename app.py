import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"  # avoid the libiomp5md.dll OpenMP crash on Windows

import io
import requests
import torch
import torchvision.models as models
import torchvision.transforms as T
from PIL import Image
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Model setup (loaded once at startup, reused for every request)
# ---------------------------------------------------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[startup] Using device: {device}")

print("[startup] Loading pretrained ResNet-50 ...")
model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
model.eval()
model.to(device)
print("[startup] Model ready.")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/91.0.4472.124 Safari/537.36"
    )
}

LABELS_URL = "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"


def load_labels():
    resp = requests.get(LABELS_URL, headers=_HEADERS, timeout=10)
    resp.raise_for_status()
    return resp.text.strip().split("\n")


print("[startup] Downloading ImageNet class labels ...")
LABELS = load_labels()
print(f"[startup] Loaded {len(LABELS)} labels.")

transform = T.Compose(
    [
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)


def download_image(url: str) -> Image.Image:
    resp = requests.get(url, headers=_HEADERS, timeout=15)
    resp.raise_for_status()
    return Image.open(io.BytesIO(resp.content)).convert("RGB")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True, silent=True) or {}
    url = (data.get("url") or "").strip()

    try:
        k = int(data.get("k", 5))
    except (TypeError, ValueError):
        k = 5
    k = max(1, min(k, 20))  # ImageNet has 1000 classes, but keep the UI sane

    if not url:
        return jsonify({"error": "Paste an image URL first."}), 400

    try:
        img = download_image(url)
    except Exception:
        return jsonify(
            {"error": "Couldn't fetch that image. Check the URL and try again."}
        ), 400

    try:
        x = transform(img).unsqueeze(0).to(device)
        with torch.no_grad():
            out = model(x)
        probs = torch.nn.functional.softmax(out[0], dim=0)
        top_probs, top_idx = torch.topk(probs, k)

        predictions = [
            {
                "rank": i + 1,
                "label": LABELS[idx.item()],
                "confidence": round(prob.item() * 100, 2),
            }
            for i, (prob, idx) in enumerate(zip(top_probs, top_idx))
        ]
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    return jsonify(
        {
            "image_url": url,
            "predictions": predictions,
            "device": str(device),
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)
