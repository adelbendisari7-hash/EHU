import numpy as np
from typing import Optional
from .preprocessing import preprocess_image
from .config import CONFIDENCE_THRESHOLD_MEDIUM


def extract_text_dual(image_bytes: bytes, language_hint: str = 'fr') -> dict:
    """
    Extraction OCR dual-engine.
    1. PaddleOCR comme moteur primaire
    2. EasyOCR en fallback pour les zones incertaines (confiance < 60%)
    """
    from .engines import (
        paddle_ocr_fr, paddle_ocr_ar, easy_reader,
        PADDLE_AVAILABLE, EASYOCR_AVAILABLE
    )

    processed = preprocess_image(image_bytes)
    results = []
    low_confidence_regions = []

    # ═══ ÉTAPE 1 : PaddleOCR (primaire) ═══
    if PADDLE_AVAILABLE:
        paddle_engine = paddle_ocr_ar if language_hint == 'ar' else paddle_ocr_fr
        try:
            paddle_result = paddle_engine.ocr(processed, cls=True)
            if paddle_result and paddle_result[0]:
                for line in paddle_result[0]:
                    bbox = line[0]
                    text = line[1][0]
                    confidence = float(line[1][1])
                    results.append({
                        'bbox': bbox,
                        'text': text,
                        'confidence': confidence,
                        'source': 'paddleocr'
                    })
                    if confidence < CONFIDENCE_THRESHOLD_MEDIUM:
                        low_confidence_regions.append({
                            'bbox': bbox,
                            'paddle_text': text,
                            'paddle_confidence': confidence,
                            'index': len(results) - 1
                        })
        except Exception as e:
            print(f"PaddleOCR error: {e}")

    # ═══ ÉTAPE 2 : EasyOCR (fallback) ═══
    easyocr_replacements = 0
    if EASYOCR_AVAILABLE and low_confidence_regions:
        try:
            easy_result = easy_reader.readtext(processed)
            easy_parsed = [
                {
                    'bbox': r[0],
                    'text': r[1],
                    'confidence': float(r[2])
                }
                for r in easy_result
            ]
            for region in low_confidence_regions:
                best_match = _find_closest_easy_result(region['bbox'], easy_parsed)
                if best_match and best_match['confidence'] > region['paddle_confidence']:
                    idx = region['index']
                    results[idx] = {
                        'bbox': region['bbox'],
                        'text': best_match['text'],
                        'confidence': best_match['confidence'],
                        'source': 'easyocr',
                        'paddle_original': region['paddle_text'],
                    }
                    easyocr_replacements += 1
        except Exception as e:
            print(f"EasyOCR error: {e}")

    # Si PaddleOCR non disponible, utiliser uniquement EasyOCR
    if not PADDLE_AVAILABLE and EASYOCR_AVAILABLE:
        try:
            easy_result = easy_reader.readtext(processed)
            results = [
                {
                    'bbox': r[0],
                    'text': r[1],
                    'confidence': float(r[2]),
                    'source': 'easyocr'
                }
                for r in easy_result
            ]
        except Exception as e:
            print(f"EasyOCR only error: {e}")

    return {
        'lines': results,
        'total_lines': len(results),
        'low_confidence_count': sum(1 for r in results if r['confidence'] < CONFIDENCE_THRESHOLD_MEDIUM),
        'easyocr_replacements': easyocr_replacements,
    }


def _find_closest_easy_result(paddle_bbox, easy_results: list) -> Optional[dict]:
    """Trouver le résultat EasyOCR le plus proche d'une bbox PaddleOCR."""
    if not easy_results:
        return None

    # Calculer le centre de la bbox PaddleOCR
    paddle_center = _bbox_center(paddle_bbox)
    best = None
    best_dist = float('inf')

    for r in easy_results:
        easy_center = _bbox_center(r['bbox'])
        dist = np.sqrt(
            (paddle_center[0] - easy_center[0]) ** 2 +
            (paddle_center[1] - easy_center[1]) ** 2
        )
        if dist < best_dist:
            best_dist = dist
            best = r

    # Seulement si la correspondance est proche (moins de 50px)
    return best if best_dist < 50 else None


def _bbox_center(bbox) -> tuple:
    """Calculer le centre d'une bounding box."""
    try:
        pts = np.array(bbox)
        return (float(pts[:, 0].mean()), float(pts[:, 1].mean()))
    except Exception:
        return (0.0, 0.0)
