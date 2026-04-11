FROM python:3.10-slim

# Dépendances système pour OpenCV et PaddleOCR
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pré-télécharger les modèles OCR au build (évite le délai au premier démarrage)
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='fr', show_log=False, use_gpu=False)" || true
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='ar', show_log=False, use_gpu=False)" || true
RUN python -c "import easyocr; easyocr.Reader(['fr', 'ar'], gpu=False, verbose=False)" || true

# Copier le code
COPY app/ ./app/

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
