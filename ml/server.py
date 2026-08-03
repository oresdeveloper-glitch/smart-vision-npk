import base64
import io
import json
import os
import random
import time
from typing import Dict

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import numpy as np
from PIL import Image

from auth_db import (
    init_db, register_user, authenticate_user, create_session,
    revoke_session, get_user_by_token, change_user_password,
    update_user_profile, list_users, delete_user,
)


APP_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(APP_DIR)
FRONTEND_DIST = os.environ.get(
    "FRONTEND_DIST",
    os.path.join(PROJECT_DIR, "dist"),
)
ARTIFACTS_DIR = os.path.join(APP_DIR, "artifacts")
MODEL_DIR = os.path.join(ARTIFACTS_DIR, "npk_resnet50_export")
META_PATH = os.path.join(ARTIFACTS_DIR, "meta.json")
CROP_MODEL_DIRS = {
    "maize": os.path.join(ARTIFACTS_DIR, "model_maize"),
    "beans": os.path.join(ARTIFACTS_DIR, "model_beans"),
}

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
CORS(app)

model = None
metadata = None
use_fallback = False

# Per-crop models
crop_models: Dict[str, object] = {}
crop_metas: Dict[str, Dict] = {}

DEFICIENCIES = ["nitrogen", "phosphorus", "potassium", "healthy"]
SEVERITIES = ["low", "moderate", "severe", "critical"]


def _decode_base64_image(data_uri: str) -> Image.Image:
    if "," in data_uri:
        _, b64 = data_uri.split(",", 1)
    else:
        b64 = data_uri
    raw = base64.b64decode(b64)
    return Image.open(io.BytesIO(raw)).convert("RGB")


def _make_result(deficiency: str, confidence: float) -> Dict:
    c01 = confidence / 100.0
    if deficiency == "healthy":
        if c01 < 0.4:
            severity = "low"
        elif c01 < 0.7:
            severity = "low"
        else:
            severity = "healthy"
    elif c01 < 0.2:
        severity = "low"
    elif c01 < 0.55:
        severity = "moderate"
    elif c01 < 0.85:
        severity = "severe"
    else:
        severity = "critical"

    risk_map = {
        "healthy": "Healthy - No action needed",
        "low": "Low Risk - Monitor regularly",
        "moderate": "Medium Risk - Action recommended within 1 week",
        "severe": "High Risk - Immediate action required",
        "critical": "Critical Risk - Urgent intervention needed",
    }
    return {
        "deficiency": deficiency,
        "confidence": round(confidence, 1),
        "severity": severity,
        "riskLevel": risk_map[severity],
    }


def _norm(v: int) -> float:
    return v / 255.0


def _fallback_predict(img: Image.Image) -> Dict:
    arr = img.resize((64, 64), Image.Resampling.BILINEAR)
    px = np.asarray(arr, dtype=np.float32)
    avg_r = _norm(np.mean(px[:, :, 0]))
    avg_g = _norm(np.mean(px[:, :, 1]))
    avg_b = _norm(np.mean(px[:, :, 2]))

    color_score = avg_g / (avg_r + avg_g + avg_b + 1e-6)
    variation = float(np.std(px))

    if color_score > 0.45:
        idx = 3
        conf = random.uniform(78, 96)
    elif variation < 45:
        idx = 0
        conf = random.uniform(72, 91)
    elif avg_r > avg_b:
        idx = 1
        conf = random.uniform(70, 89)
    else:
        idx = 2
        conf = random.uniform(71, 88)

    return _make_result(DEFICIENCIES[idx], conf)


def _predict_tta(img: Image.Image, crop_type: str = None) -> np.ndarray:
    """Test-time augmentation: predict multiple augmented versions and average."""
    global model, metadata

    # Use per-crop model if available and its accuracy is better than the main model
    local_model = model
    if crop_type and crop_type in crop_models:
        cm_acc = crop_metas.get(crop_type, {}).get("test_accuracy", 0)
        main_acc = metadata.get("test_accuracy", 0)
        if cm_acc > main_acc:
            local_model = crop_models[crop_type]

    image_size = int(metadata["image_size"])
    arr = img.resize((image_size, image_size), Image.Resampling.BILINEAR)
    base = np.asarray(arr, dtype=np.float32) / 255.0

    versions = [base]
    versions.append(np.fliplr(base))
    versions.append(np.flipud(base))
    versions.append(np.fliplr(np.flipud(base)))

    for factor in [0.9, 1.1]:
        v = np.clip(base * factor, 0, 1)
        versions.append(v)
        versions.append(np.fliplr(v))

    for factor in [0.9, 1.1]:
        mean = np.mean(base, axis=(0, 1), keepdims=True)
        v = np.clip(mean + (base - mean) * factor, 0, 1)
        versions.append(v)

    batch = np.stack(versions, axis=0)
    preds = local_model(batch, training=False).numpy()
    y = np.mean(preds, axis=0)
    return y


def _predict(img: Image.Image, crop_type: str = None) -> Dict:
    global model, metadata

    if use_fallback or model is None or metadata is None:
        return _fallback_predict(img)

    idx_to_class = metadata["idx_to_class"]
    idx_to_class_int = {int(k): v for k, v in idx_to_class.items()}

    y = _predict_tta(img, crop_type)
    pred_idx = int(np.argmax(y))
    confidence = float(np.max(y)) * 100.0
    deficiency = idx_to_class_int[pred_idx].lower().strip().replace("-", "_")
    for d in DEFICIENCIES:
        if d in deficiency:
            deficiency = d
            break
    return _make_result(deficiency, confidence)


def _rebuild_model(backbone: str, image_size: int):
    import tensorflow as tf
    from tensorflow.keras import layers, regularizers
    num_classes = 4

    if backbone == "local_cnn":
        inputs = layers.Input(shape=(image_size, image_size, 3))
        x = layers.Conv2D(32, 3, padding="same", activation="relu")(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D()(x)
        x = layers.Conv2D(64, 3, padding="same", activation="relu")(x)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D()(x)
        x = layers.Conv2D(128, 3, padding="same", activation="relu")(x)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D()(x)
        x = layers.Conv2D(192, 3, padding="same", activation="relu")(x)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.25)(x)
        x = layers.Dense(128, activation="relu")(x)
        outputs = layers.Dense(num_classes, activation="softmax")(x)
        m = tf.keras.models.Model(inputs, outputs, name="npk_local_cnn")
        m.compile(optimizer="adam", loss="sparse_categorical_crossentropy")
        return m

    base_map = {
        "resnet50": (tf.keras.applications.ResNet50, tf.keras.applications.resnet50.preprocess_input),
        "mobilenetv2": (tf.keras.applications.MobileNetV2, tf.keras.applications.mobilenet_v2.preprocess_input),
        "efficientnetb0": (tf.keras.applications.EfficientNetB0, tf.keras.applications.efficientnet.preprocess_input),
        "densenet169": (tf.keras.applications.DenseNet169, tf.keras.applications.densenet.preprocess_input),
        "inceptionv3": (tf.keras.applications.InceptionV3, tf.keras.applications.inception_v3.preprocess_input),
        "vgg16": (tf.keras.applications.VGG16, tf.keras.applications.vgg16.preprocess_input),
        "vgg19": (tf.keras.applications.VGG19, tf.keras.applications.vgg19.preprocess_input),
    }
    if backbone not in base_map:
        print(f"Unknown backbone {backbone}, falling back to local_cnn")
        return _rebuild_model("local_cnn", image_size)

    base_cls, preprocess_fn = base_map[backbone]
    base = base_cls(include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3), pooling="avg")
    base.trainable = False

    inputs = layers.Input(shape=(image_size, image_size, 3))
    x = layers.Lambda(lambda t: t * 255.0)(inputs)
    x = layers.Lambda(lambda t: preprocess_fn(t))(x)
    feats = base(x, training=False)
    x = layers.Dropout(0.5)(feats)
    x = layers.Dense(256, kernel_regularizer=regularizers.l2(5e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax",
                           kernel_regularizer=regularizers.l2(5e-4))(x)

    m = tf.keras.models.Model(inputs, outputs, name=f"npk_{backbone}")
    m.compile(optimizer="adam", loss="sparse_categorical_crossentropy")
    return m


def load_model_once() -> None:
    global model, metadata, use_fallback, crop_models, crop_metas

    if model is not None and metadata is not None:
        return

    if not os.path.exists(MODEL_DIR) or not os.path.exists(META_PATH):
        use_fallback = True
        print("Model artifacts not found — using fallback prediction mode")
        return

    try:
        import tensorflow as tf
        tf.config.threading.set_inter_op_parallelism_threads(1)
    except ImportError:
        use_fallback = True
        print("TensorFlow not installed — using fallback prediction mode")
        return
    except (AttributeError, RuntimeError):
        pass

    if not hasattr(tf, "keras"):
        use_fallback = True
        print("TensorFlow incomplete — using fallback prediction mode")
        return

    with open(META_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    image_size = int(metadata.get("image_size", 224))
    backbone = metadata.get("model", "resnet50").strip().lower()

    try:
        model = tf.keras.models.load_model(MODEL_DIR, compile=False)
    except Exception:
        print(f"Direct load failed, using meta.json backbone: {backbone}")
        model = _rebuild_model(backbone, image_size)
        ckpt_path = os.path.join(MODEL_DIR, "variables", "variables")
        model.load_weights(ckpt_path)

    warmup = np.zeros((1, image_size, image_size, 3), dtype=np.float32)
    _ = model(warmup, training=False).numpy()
    print(f"Loaded ML model from {MODEL_DIR}")

    # Load per-crop models if available
    for crop_name, crop_dir in CROP_MODEL_DIRS.items():
        crop_meta_path = os.path.join(crop_dir, "meta.json")
        if os.path.exists(crop_dir) and os.path.exists(crop_meta_path):
            try:
                cm = tf.keras.models.load_model(crop_dir, compile=False)
                with open(crop_meta_path) as f:
                    cm_meta = json.load(f)
                _ = cm(warmup, training=False).numpy()
                crop_models[crop_name] = cm
                crop_metas[crop_name] = cm_meta
                print(f"Loaded per-crop model: {crop_name} (acc={cm_meta.get('test_accuracy', '?'):.4f})")
            except Exception as e:
                print(f"Failed to load per-crop model {crop_name}: {e}")


@app.route("/health", methods=["GET"])
def health():
    ready = model is not None and metadata is not None
    return jsonify({
        "ok": True,
        "modelReady": ready,
        "fallbackMode": use_fallback,
        "modelPath": MODEL_DIR,
        "cropModels": list(crop_models.keys()),
    })


def _bearer_token() -> str:
    auth = request.headers.get("Authorization", "")
    prefix = "Bearer "
    if auth.startswith(prefix):
        return auth[len(prefix):].strip()
    return ""


@app.route("/auth/register", methods=["POST"])
def auth_register():
    payload = request.get_json(force=True, silent=True) or {}
    name = payload.get("name")
    username = payload.get("username")
    email = payload.get("email")
    password = payload.get("password")
    role = payload.get("role", "farmer")
    user, err = register_user(name, username, email, password, role)
    if err:
        return jsonify({"error": err}), 400
    token = create_session(int(user["id"]))
    return jsonify({"token": token, "user": user}), 201


@app.route("/auth/login", methods=["POST"])
def auth_login():
    payload = request.get_json(force=True, silent=True) or {}
    user, err = authenticate_user(
        payload.get("email") or payload.get("username") or "",
        payload.get("password") or "",
    )
    if err:
        return jsonify({"error": err}), 401
    token = create_session(int(user["id"]))
    return jsonify({"token": token, "user": user})


@app.route("/auth/me", methods=["GET"])
def auth_me():
    user, err = get_user_by_token(_bearer_token())
    if err:
        return jsonify({"error": err}), 401
    return jsonify({"user": user})


@app.route("/auth/logout", methods=["POST"])
def auth_logout():
    revoke_session(_bearer_token())
    return jsonify({"ok": True})


@app.route("/auth/change-password", methods=["POST"])
def auth_change_password():
    user, err = get_user_by_token(_bearer_token())
    if err:
        return jsonify({"error": err}), 401
    payload = request.get_json(force=True, silent=True) or {}
    ok, msg = change_user_password(
        int(user["id"]),
        payload.get("currentPassword") or "",
        payload.get("newPassword") or "",
    )
    if not ok:
        return jsonify({"error": msg}), 400
    return jsonify({"ok": True})


@app.route("/auth/profile", methods=["PUT"])
def auth_profile():
    user, err = get_user_by_token(_bearer_token())
    if err:
        return jsonify({"error": err}), 401
    payload = request.get_json(force=True, silent=True) or {}
    updated = update_user_profile(int(user["id"]), payload)
    return jsonify({"user": updated})


# Admin-only user management
@app.route("/auth/users", methods=["GET"])
def auth_users():
    user, err = get_user_by_token(_bearer_token())
    if err:
        return jsonify({"error": err}), 401
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403
    return jsonify({"users": list_users()})


@app.route("/auth/users/<int:user_id>", methods=["DELETE"])
def auth_delete_user(user_id):
    user, err = get_user_by_token(_bearer_token())
    if err:
        return jsonify({"error": err}), 401
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403
    delete_user(user_id)
    return jsonify({"ok": True})


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(force=True)
    image_data = payload.get("imageData")
    crop_type = payload.get("cropType")

    if not image_data:
        return jsonify({"error": "Missing imageData"}), 400

    try:
        img = _decode_base64_image(image_data)
        if not crop_type and crop_centroids is not None:
            crop_result = _detect_crop(img)
            crop_type = crop_result.get("cropType")
        return jsonify(_predict(img, crop_type))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


CROP_CLASSIFIER_DIR = os.path.join(ARTIFACTS_DIR, "crop_classifier")
CENTROIDS_PATH = os.path.join(CROP_CLASSIFIER_DIR, "centroids.json")
REJECT_MODEL_PATH = os.path.join(CROP_CLASSIFIER_DIR, "crop_classifier_3class")
REJECT_META_PATH = os.path.join(CROP_CLASSIFIER_DIR, "classifier_meta.json")
REJECT_CLASS_NAMES = ("maize", "beans", "unknown")
UNKNOWN_LABEL = "unknown"
REJECT_THRESHOLD = 0.25  # min cosine sim to closest known crop centroid
crop_centroids = None
crop_feature_extractor = None
reject_model = None
reject_model_loaded = False
CROP_FEAT_DIM = 1280


def _load_crop_centroids():
    global crop_centroids
    if crop_centroids is not None:
        return
    if os.path.exists(CENTROIDS_PATH):
        with open(CENTROIDS_PATH, "r") as f:
            crop_centroids = json.load(f)
        print(f"Loaded crop centroids ({len(crop_centroids['maize_centroid'])} dims)")


def _load_crop_feature_extractor():
    global crop_feature_extractor
    if crop_feature_extractor is not None:
        return
    try:
        import tensorflow as tf
        crop_feature_extractor = tf.keras.applications.EfficientNetB0(
            include_top=False, weights="imagenet",
            input_shape=(224, 224, 3), pooling="avg"
        )
        print("Loaded EfficientNetB0 crop feature extractor")
    except Exception as e:
        print(f"Failed to load crop feature extractor: {e}")
        crop_feature_extractor = False


def _load_reject_model():
    global reject_model, reject_model_loaded
    if reject_model_loaded:
        return
    reject_model_loaded = True
    if not os.path.isdir(REJECT_MODEL_PATH) or not os.path.exists(REJECT_META_PATH):
        print("3-class crop reject classifier not found — skipping")
        return
    try:
        import tensorflow as tf
        reject_model = tf.keras.models.load_model(REJECT_MODEL_PATH, compile=False)
        print("Loaded 3-class crop reject classifier (maize/beans/unknown)")
    except Exception as e:
        print(f"Failed to load reject classifier: {e}")
        reject_model = False


def _classify_crop_reject(feats) -> str:
    """Returns 'maize', 'beans', or 'unknown' using the trained 3-class head."""
    global reject_model
    if reject_model is None or reject_model is False or feats is None:
        return None
    import tensorflow as tf
    x = np.asarray(feats, dtype=np.float32).reshape(1, -1)
    probs = reject_model(x, training=False).numpy()[0]
    idx = int(np.argmax(probs))
    return REJECT_CLASS_NAMES[idx] if idx < len(REJECT_CLASS_NAMES) else None


def _extract_crop_features(img: Image.Image):
    _load_crop_feature_extractor()
    if crop_feature_extractor is False:
        return None
    import tensorflow as tf
    arr = img.resize((224, 224), Image.Resampling.BILINEAR)
    x = tf.keras.applications.efficientnet.preprocess_input(
        np.expand_dims(np.asarray(arr, dtype=np.float32), axis=0)
    )
    feats = crop_feature_extractor(x, training=False).numpy()[0]
    return feats


def _cosine_sim(a, b):
    a_np = np.array(a, dtype=np.float64)
    b_np = np.array(b, dtype=np.float64)
    na = np.linalg.norm(a_np)
    nb = np.linalg.norm(b_np)
    if na < 1e-10 or nb < 1e-10:
        return 0.0
    return float(np.dot(a_np, b_np) / (na * nb))


def _detect_crop(img: Image.Image) -> Dict:
    _load_crop_centroids()
    _load_reject_model()

    arr_np = np.asarray(img.resize((80, 80), Image.Resampling.BILINEAR), dtype=np.float32)
    r, g, b = arr_np[:,:,0], arr_np[:,:,1], arr_np[:,:,2]
    green_ratio = float(np.mean((g > r * 0.75) & (g > b * 0.75)))

    if green_ratio < 0.04 or float(np.std(np.mean(arr_np, axis=2))) < 8:
        return {
            "valid": False,
            "cropType": None,
            "confidence": 0.0,
            "error": "This does not look like a crop leaf. Please upload a clear photo of a maize or bean leaf against a natural background.",
        }

    feats = _extract_crop_features(img)
    if feats is None:
        if crop_centroids is None:
            return {"valid": True, "cropType": "maize", "confidence": 50.0, "error": None}
    else:
        # 1) Trained 3-class rejection: if the head says 'unknown', reject.
        predicted = _classify_crop_reject(feats)
        if predicted == UNKNOWN_LABEL:
            return {
                "valid": False,
                "cropType": None,
                "confidence": 0.0,
                "error": "This does not look like a maize or bean leaf. Please upload a clear photo of a maize or bean leaf.",
            }
        # 2) Similarity gate: reject images far from both known crop centroids.
        if crop_centroids is not None:
            m_sim = _cosine_sim(feats, crop_centroids.get("maize_centroid"))
            b_sim = _cosine_sim(feats, crop_centroids.get("bean_centroid"))
            if max(m_sim, b_sim) < REJECT_THRESHOLD:
                return {
                    "valid": False,
                    "cropType": None,
                    "confidence": 0.0,
                    "error": "This does not look like a maize or bean leaf. Please upload a clear photo of a maize or bean leaf.",
                }

    if crop_centroids is None:
        return {"valid": True, "cropType": "maize", "confidence": 50.0, "error": None}

    if feats is not None:
        m_sim = _cosine_sim(feats, crop_centroids["maize_centroid"])
        b_sim = _cosine_sim(feats, crop_centroids["bean_centroid"])
        total = m_sim + b_sim

        if total < 0.01:
            return {"valid": True, "cropType": "maize", "confidence": 40.0, "error": None}

        conf = round(max(m_sim, b_sim) / total * 100, 1)
        crop_type = "maize" if m_sim >= b_sim else "beans"
        return {"valid": True, "cropType": crop_type, "confidence": conf, "error": None}

    return {"valid": True, "cropType": "maize", "confidence": 50.0, "error": None}


@app.route("/detect-crop", methods=["POST"])
def detect_crop():
    payload = request.get_json(force=True)
    image_data = payload.get("imageData")
    if not image_data:
        return jsonify({"error": "Missing imageData"}), 400
    try:
        img = _decode_base64_image(image_data)
        return jsonify(_detect_crop(img))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


CROP_DB_PATH = os.path.join(CROP_CLASSIFIER_DIR, "crop_features.json")
crop_db = None


def _load_crop_db():
    global crop_db
    if crop_db is not None:
        return
    if os.path.exists(CROP_DB_PATH):
        with open(CROP_DB_PATH, "r") as f:
            crop_db = json.load(f)
        print(f"Loaded crop DB ({len(crop_db.get('maize', []))} maize, {len(crop_db.get('beans', []))} beans)")


def _save_crop_db():
    global crop_db
    if crop_db is not None:
        with open(CROP_DB_PATH, "w") as f:
            json.dump(crop_db, f)


def _update_centroids():
    global crop_centroids, crop_db
    _load_crop_db()
    if crop_db is None:
        return
    maize_all = crop_db.get("maize", [])
    beans_all = crop_db.get("beans", [])
    if not maize_all or not beans_all:
        return
    m_centroid = np.mean([s["features"] for s in maize_all], axis=0).tolist()
    b_centroid = np.mean([s["features"] for s in beans_all], axis=0).tolist()
    crop_centroids = {"maize_centroid": m_centroid, "bean_centroid": b_centroid}
    if os.path.exists(CENTROIDS_PATH):
        try:
            with open(CENTROIDS_PATH, "r") as f:
                old = json.load(f)
            if "unknown_centroid" in old:
                crop_centroids["unknown_centroid"] = old["unknown_centroid"]
            if "feature_dim" in old:
                crop_centroids["feature_dim"] = old["feature_dim"]
        except Exception:
            pass
    with open(CENTROIDS_PATH, "w") as f:
        json.dump(crop_centroids, f)
    print(f"Updated centroids from crop DB ({len(maize_all)} maize, {len(beans_all)} beans)")


@app.route("/train-crop", methods=["POST"])
def train_crop():
    global crop_db
    payload = request.get_json(force=True)
    image_data = payload.get("imageData")
    confirmed_crop = payload.get("cropType")

    if not image_data or not confirmed_crop:
        return jsonify({"error": "Missing imageData or cropType"}), 400
    if confirmed_crop not in ("maize", "beans"):
        return jsonify({"error": "Invalid cropType"}), 400

    try:
        img = _decode_base64_image(image_data)
        feats = _extract_crop_features(img)
        if feats is None:
            return jsonify({"error": "Feature extraction failed"}), 500

        _load_crop_db()
        if crop_db is None:
            crop_db = {"maize": [], "beans": []}
        crop_db[confirmed_crop].append({
            "features": feats.tolist() if hasattr(feats, 'tolist') else feats,
            "timestamp": time.time(),
        })
        max_store = 50
        if len(crop_db[confirmed_crop]) > max_store:
            crop_db[confirmed_crop] = crop_db[confirmed_crop][-max_store:]
        _save_crop_db()
        _update_centroids()
        total = len(crop_db["maize"]) + len(crop_db["beans"])
        return jsonify({"ok": True, "totalSamples": total})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


load_model_once()

@app.route("/")
def index():
    try:
        return send_from_directory(FRONTEND_DIST, "index.html")
    except Exception:
        return jsonify({"ok": True, "name": "Smart Vision NPK API", "note": "Frontend not built"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    init_db()
    app.run(host="0.0.0.0", port=port, debug=False)

