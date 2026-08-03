# ML Inference Server

This repo includes a Flask server that exposes a `/predict` endpoint.

## Model artifacts expected
- `ml/artifacts/npk_resnet50_export/` (SavedModel)
- `ml/artifacts/meta.json`

The server reads:
- `meta.json.class_to_idx`
- `meta.json.idx_to_class`
- `meta.json.image_size` (defaults to 224)

## Run server (dev)
From the repo root:

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python ml\server.py
```

Server will listen on:
- `http://localhost:5000/health`
- `http://localhost:5000/predict`

## Endpoint
### `POST /predict`
Body:
```json
{
  "imageData": "data:image/jpeg;base64,...",
  "cropType": "maize" | "beans"
}
```

Response:
```json
{
  "deficiency": "nitrogen" | "phosphorus" | "potassium" | "healthy",
  "confidence": 92.3,
  "severity": "low" | "moderate" | "severe" | "critical",
  "riskLevel": "Low Risk – Monitor regularly" 
}
```

> Note: `cropType` is accepted for API compatibility with the frontend, but the current model/meta mapping may already encode the crop/class relationship.

