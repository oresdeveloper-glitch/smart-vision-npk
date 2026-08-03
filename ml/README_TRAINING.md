# NPK Model Training (uses local `data/`)

## Dataset layout expected
This script expects:
- `data/maize/{Training,Validation,Testing}/{nitrogen,phosphorus,potassium,healthy}/*.jpg`
- `data/Beans/{Training,Validation,Testing}/{nitrogen,phosphorus,potassium,healthy}/*.jpg`

## Output
- `ml/artifacts/best.keras`
- `ml/artifacts/npk_resnet50_export/` (SavedModel)
- `ml/artifacts/meta.json`

## Train
Create venv + install deps (example):

```bat
cd ml
python -m venv .venv
.venv\Scripts\activate
pip install tensorflow pillow numpy
python train_model.py
```

Notes:
- TensorFlow installs are heavy; first run may take time.
- If your images are PNG, the loader can be extended; currently it uses `decode_jpeg`.

