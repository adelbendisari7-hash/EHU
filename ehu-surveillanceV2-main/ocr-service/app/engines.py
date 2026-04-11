"""
Moteur OCR — EasyOCR
Note: EasyOCR ne supporte pas fr+ar simultanément — on utilise fr+en
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from .config import USE_GPU

print("Chargement EasyOCR...")

paddle_ocr_fr = None
paddle_ocr_ar = None
PADDLE_AVAILABLE = False

easy_reader = None
easy_reader_ar = None
EASYOCR_AVAILABLE = False

try:
    import easyocr
    # fr+en pour les formulaires francophones
    easy_reader = easyocr.Reader(['fr', 'en'], gpu=USE_GPU, verbose=False)
    EASYOCR_AVAILABLE = True
    print("EasyOCR pret (fr + en)")
except Exception as e:
    print(f"EasyOCR echec: {e}")
