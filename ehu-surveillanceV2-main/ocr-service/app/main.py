from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .extractor import extract_text_dual
from .field_mapper import map_ocr_to_fields
from .id_resolver import resolve_ids
from .schemas import OcrResponse, OcrData, PatientFields, MaladieFields, MedicalFields, OcrField, OcrMeta, EnginesUsed
from .config import ALLOWED_ORIGINS, MAX_IMAGE_SIZE_MB
import time

app = FastAPI(
    title="EHU OCR Service",
    version="2.0",
    description="Microservice OCR pour formulaires MDO — PaddleOCR + EasyOCR",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    from .engines import PADDLE_AVAILABLE, EASYOCR_AVAILABLE
    return {
        "status": "ok",
        "engines": {
            "paddleocr": PADDLE_AVAILABLE,
            "easyocr": EASYOCR_AVAILABLE,
        }
    }


@app.post("/ocr/extract", response_model=OcrResponse)
async def extract_form_data(
    image: UploadFile = File(...),
    language_hint: str = Query(default="fr", pattern="^(fr|ar)$"),
):
    start_time = time.time()

    # 1. Validation du fichier
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(400, f"Format non supporté. Utilisez: {', '.join(allowed_types)}")

    image_bytes = await image.read()
    max_bytes = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(400, f"Image trop grande (max {MAX_IMAGE_SIZE_MB}MB).")

    # 2. Extraction OCR dual-engine
    try:
        ocr_result = extract_text_dual(image_bytes, language_hint)
    except Exception as e:
        raise HTTPException(422, f"OCR impossible: {str(e)}")

    # 3. Mapping vers les champs du formulaire
    try:
        fields = map_ocr_to_fields(ocr_result["lines"])
    except Exception as e:
        raise HTTPException(500, f"Erreur mapping: {str(e)}")

    # 4. Résolution des IDs (communes, maladies, etc.)
    try:
        resolved = await resolve_ids(fields)
    except Exception:
        resolved = fields  # Continuer sans résolution si BD indisponible

    # 5. Structurer la réponse
    def get_field(key: str) -> OcrField:
        f = resolved.get(key, {})
        if not f or not f.get("value"):
            return OcrField()
        return OcrField(
            value=f.get("value"),
            confidence=f.get("confidence", "low"),
            raw=f.get("raw"),
            source=f.get("source"),
        )

    data = OcrData(
        patient=PatientFields(
            nom=get_field("nom"),
            prenom=get_field("prenom"),
            date_naissance=get_field("date_naissance"),
            sexe=get_field("sexe"),
            adresse=get_field("adresse"),
            commune=get_field("commune"),
            commune_id=get_field("commune_id"),
            wilaya=get_field("wilaya"),
            telephone=get_field("telephone"),
        ),
        maladie=MaladieFields(
            nom_maladie=get_field("maladie"),
            maladie_id=get_field("maladie_id"),
            date_debut_symptomes=get_field("date_symptomes"),
            date_diagnostic=get_field("date_diagnostic"),
            mode_confirmation=get_field("mode_confirmation"),
        ),
        medical=MedicalFields(
            etablissement=get_field("etablissement"),
            etablissement_id=get_field("etablissement_id"),
            service=get_field("service"),
            medecin=get_field("medecin"),
        ),
    )

    # 6. Calculer les statistiques
    processing_time = int((time.time() - start_time) * 1000)
    total_fields = 15
    all_fields = [
        data.patient.nom, data.patient.prenom, data.patient.date_naissance,
        data.patient.sexe, data.patient.adresse, data.patient.commune,
        data.patient.telephone, data.maladie.nom_maladie,
        data.maladie.date_debut_symptomes, data.maladie.date_diagnostic,
        data.maladie.mode_confirmation, data.medical.etablissement,
        data.medical.service, data.medical.medecin, data.patient.wilaya,
    ]
    extracted = sum(1 for f in all_fields if f.value is not None)
    uncertain = sum(1 for f in all_fields if f.confidence in ["low", "medium"])

    ratio = extracted / total_fields
    quality = "good" if ratio >= 0.7 else "medium" if ratio >= 0.4 else "poor"

    return OcrResponse(
        success=True,
        data=data,
        meta=OcrMeta(
            overall_quality=quality,
            fields_extracted=extracted,
            fields_total=total_fields,
            fields_uncertain=uncertain,
            processing_time_ms=processing_time,
            engines_used=EnginesUsed(
                primary="paddleocr",
                fallback_used=ocr_result["easyocr_replacements"] > 0,
                fallback_replacements=ocr_result["easyocr_replacements"],
            ),
        ),
    )
