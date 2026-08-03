---
title: Smart Vision NPK
emoji: 🌱
colorFrom: green
colorTo: emerald
sdk: docker
pinned: false
license: mit
---

# Smart Vision NPK — AI Leaf Deficiency Detection

Detects Nitrogen (N), Phosphorus (P), and Potassium (K) deficiencies from
maize and bean leaf photos, plus healthy leaves. Includes a crop classifier that
rejects non-crop (unknown) images.

## Features
- Upload a leaf photo and get an NPK deficiency diagnosis with severity.
- Crop detection (maize / bean) with rejection of non-crop images.
- Server-side authentication (register / login) backed by SQLite.
- Multi-language + voice assistant.

## Tech
- Backend: Flask + TensorFlow (local MobileNetV2 models) + SQLite auth.
- Frontend: React + Vite, built and served by Flask on a single port (7860).

## Run locally
```bash
cd ml
pip install -r requirements.txt
python server.py   # serves built frontend on PORT=7860, or 5000 by default
```