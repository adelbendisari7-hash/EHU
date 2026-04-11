import cv2
import numpy as np


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Pipeline complet de pré-traitement pour formulaires MDO."""
    # 1. Décoder l'image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Impossible de décoder l'image")

    # 2. Redimensionner si trop grand
    h, w = img.shape[:2]
    if w > 2000:
        scale = 2000 / w
        img = cv2.resize(img, (2000, int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]

    # 3. Conversion en niveaux de gris
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 4. Correction d'inclinaison (deskew)
    gray = _deskew(gray)

    # 5. Réduction du bruit
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)

    # 6. Amélioration du contraste (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # 7. Binarisation adaptive
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15, 11
    )

    return binary


def _deskew(gray: np.ndarray) -> np.ndarray:
    """Détecter et corriger l'inclinaison."""
    h, w = gray.shape
    coords = np.column_stack(np.where(gray < 200))
    if len(coords) < 100:
        return gray
    try:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) > 0.5:
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            gray = cv2.warpAffine(
                gray, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
    except Exception:
        pass
    return gray


def detect_form_region(img: np.ndarray) -> np.ndarray:
    """Détecter et isoler le formulaire dans l'image (correction perspective)."""
    edges = cv2.Canny(img, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for cnt in contours[:5]:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            pts = approx.reshape(4, 2).astype(np.float32)
            # Ordonner les points: top-left, top-right, bottom-right, bottom-left
            rect = _order_points(pts)
            (tl, tr, br, bl) = rect
            w = int(max(
                np.linalg.norm(br - bl),
                np.linalg.norm(tr - tl)
            ))
            h = int(max(
                np.linalg.norm(tr - br),
                np.linalg.norm(tl - bl)
            ))
            dst = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype=np.float32)
            M = cv2.getPerspectiveTransform(rect, dst)
            warped = cv2.warpPerspective(img, M, (w, h))
            return warped

    return img


def _order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect
