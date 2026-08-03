@echo off
set NPK_BACKBONE=mobilenetv2
set NPK_EPOCHS=20
set NPK_MAX_TRAIN_PER_CLASS=500
set NPK_MAX_EVAL_PER_CLASS=200
set NPK_BATCH_SIZE=32
set NPK_IMAGE_SIZE=224
"C:\Users\This PC\Downloads\npk-detection-app\ml\.venv\Scripts\python.exe" "C:\Users\This PC\Downloads\npk-detection-app\ml\train_model.py"
