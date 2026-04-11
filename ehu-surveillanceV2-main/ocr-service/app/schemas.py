from pydantic import BaseModel
from typing import Optional, Literal

ConfidenceLevel = Literal["high", "medium", "low", "none"]

class OcrField(BaseModel):
    value: Optional[str] = None
    confidence: ConfidenceLevel = "none"
    raw: Optional[str] = None
    source: Optional[str] = None

class PatientFields(BaseModel):
    nom: OcrField = OcrField()
    prenom: OcrField = OcrField()
    date_naissance: OcrField = OcrField()
    sexe: OcrField = OcrField()
    adresse: OcrField = OcrField()
    commune: OcrField = OcrField()
    commune_id: OcrField = OcrField()
    wilaya: OcrField = OcrField()
    telephone: OcrField = OcrField()

class MaladieFields(BaseModel):
    nom_maladie: OcrField = OcrField()
    maladie_id: OcrField = OcrField()
    date_debut_symptomes: OcrField = OcrField()
    date_diagnostic: OcrField = OcrField()
    mode_confirmation: OcrField = OcrField()

class MedicalFields(BaseModel):
    etablissement: OcrField = OcrField()
    etablissement_id: OcrField = OcrField()
    service: OcrField = OcrField()
    medecin: OcrField = OcrField()

class OcrData(BaseModel):
    patient: PatientFields = PatientFields()
    maladie: MaladieFields = MaladieFields()
    medical: MedicalFields = MedicalFields()

class EnginesUsed(BaseModel):
    primary: str = "paddleocr"
    fallback_used: bool = False
    fallback_replacements: int = 0

class OcrMeta(BaseModel):
    overall_quality: Literal["good", "medium", "poor"]
    fields_extracted: int
    fields_total: int
    fields_uncertain: int
    processing_time_ms: int
    engines_used: EnginesUsed

class OcrResponse(BaseModel):
    success: bool
    data: OcrData
    meta: OcrMeta
