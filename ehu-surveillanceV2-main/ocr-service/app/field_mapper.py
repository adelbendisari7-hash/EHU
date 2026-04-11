import re
from typing import Optional
from rapidfuzz import fuzz

# ═══ Labels connus des formulaires MDO algériens ═══
FIELD_LABELS = {
    'nom': ['nom', 'nom et prenom', 'nom et prénom', 'patient', 'identite', 'identité', 'nom complet'],
    'prenom': ['prenom', 'prénom', 'prenoms', 'prénoms'],
    'date_naissance': ['date de naissance', 'né le', 'née le', 'ddn', 'date naiss', 'date naissance', 'né(e) le'],
    'sexe': ['sexe', 'genre', 's', 'sex'],
    'adresse': ['adresse', 'adr', 'résidence', 'domicile', 'residence', 'adresse domicile'],
    'commune': ['commune', 'com', 'commune de residence', 'commune de résidence', 'commune résidence'],
    'wilaya': ['wilaya', 'w', 'wilaya de residence', 'wilaya de résidence'],
    'telephone': ['telephone', 'téléphone', 'tel', 'tél', 'n tel', 'n° tel', 'n° téléphone', 'phone'],
    'maladie': ['maladie', 'diagnostic', 'pathologie', 'maladie declaree', 'maladie déclarée', 'mdo'],
    'date_symptomes': ['date debut symptomes', 'date début symptômes', 'debut sympt', 'onset', 'date apparition'],
    'date_diagnostic': ['date diagnostic', 'date diag', 'diagnostic le', 'date du diagnostic'],
    'mode_confirmation': ['mode de confirmation', 'confirmation', 'mode', 'type confirmation', 'mode confirmation'],
    'etablissement': ['etablissement', 'établissement', 'ets', 'hopital', 'hôpital', 'structure sanitaire', 'clinique'],
    'service': ['service', 'serv', 'département', 'departement', 'unite', 'unité'],
    'medecin': ['medecin', 'médecin', 'dr', 'declarant', 'déclarant', 'medecin declarant', 'médecin déclarant'],
}

# Modes de confirmation valides
MODE_CONFIRMATION_MAP = {
    'clinique': 'clinique',
    'clin': 'clinique',
    'cl': 'clinique',
    'epidemiologique': 'epidemiologique',
    'épidémiologique': 'epidemiologique',
    'epi': 'epidemiologique',
    'ep': 'epidemiologique',
    'laboratoire': 'laboratoire',
    'labo': 'laboratoire',
    'lab': 'laboratoire',
    'biologique': 'laboratoire',
}


def map_ocr_to_fields(ocr_lines: list) -> dict:
    """Convertir les lignes OCR brutes en champs structurés."""
    fields = {}
    used_indices = set()

    # ═══ PASSE 1 : Label:Valeur parsing ═══
    for i, line in enumerate(ocr_lines):
        text = line['text'].strip()
        confidence = line['confidence']

        if ':' in text:
            parts = text.split(':', 1)
            label = parts[0].strip().lower()
            value = parts[1].strip()

            if not value:
                # La valeur est peut-être sur la ligne suivante
                if i + 1 < len(ocr_lines):
                    next_text = ocr_lines[i + 1]['text'].strip()
                    if next_text and ':' not in next_text:
                        value = next_text
                        used_indices.add(i + 1)

            field_name = _match_label_to_field(label)
            if field_name and value:
                fields[field_name] = {
                    'value': _clean_value(field_name, value),
                    'confidence': _confidence_to_level(confidence),
                    'raw': text,
                    'source': line.get('source', 'paddleocr'),
                }
                used_indices.add(i)

    # ═══ PASSE 2 : Regex pour dates, téléphones, codes ═══
    date_fields_assigned = []
    for i, line in enumerate(ocr_lines):
        if i in used_indices:
            continue
        text = line['text'].strip()
        confidence = line['confidence']

        # Dates : DD/MM/YYYY ou DD-MM-YYYY
        date_match = re.search(r'(\d{2})[/\-](\d{2})[/\-](\d{4})', text)
        if date_match:
            iso_date = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"
            _assign_date(fields, iso_date, text, confidence, date_fields_assigned, line)
            used_indices.add(i)
            continue

        # Téléphone algérien
        phone_match = re.search(r'0[567]\d{8}', text.replace(' ', '').replace('-', ''))
        if phone_match and 'telephone' not in fields:
            fields['telephone'] = {
                'value': phone_match.group(),
                'confidence': _confidence_to_level(confidence),
                'raw': text,
                'source': line.get('source', 'paddleocr'),
            }
            used_indices.add(i)
            continue

        # Sexe isolé
        if text.lower() in ['m', 'f', 'h', 'masculin', 'féminin', 'feminin', 'homme', 'femme'] and 'sexe' not in fields:
            fields['sexe'] = {
                'value': _clean_value('sexe', text),
                'confidence': _confidence_to_level(confidence),
                'raw': text,
                'source': line.get('source', 'paddleocr'),
            }
            used_indices.add(i)

    # ═══ PASSE 3 : Keyword proximity (label sur une ligne, valeur sur la suivante) ═══
    for i, line in enumerate(ocr_lines):
        if i in used_indices:
            continue
        text = line['text'].strip().lower()
        field_name = _match_label_to_field(text)
        if field_name and field_name not in fields:
            # Chercher la valeur dans les prochaines lignes (1-3 lignes)
            for j in range(i + 1, min(i + 4, len(ocr_lines))):
                if j in used_indices:
                    continue
                next_text = ocr_lines[j]['text'].strip()
                next_label = _match_label_to_field(next_text.lower())
                if next_label:
                    break  # C'est un autre label, pas une valeur
                if next_text and len(next_text) > 1:
                    fields[field_name] = {
                        'value': _clean_value(field_name, next_text),
                        'confidence': _confidence_to_level(ocr_lines[j]['confidence']),
                        'raw': next_text,
                        'source': ocr_lines[j].get('source', 'paddleocr'),
                    }
                    used_indices.add(i)
                    used_indices.add(j)
                    break

    return fields


def _match_label_to_field(label: str) -> Optional[str]:
    """Fuzzy match d'un label vers un nom de champ."""
    label = label.strip().lower()
    if not label or len(label) < 2:
        return None

    best_score = 0
    best_field = None
    for field_name, variants in FIELD_LABELS.items():
        for variant in variants:
            score = fuzz.ratio(label, variant)
            if score > best_score and score >= 70:
                best_score = score
                best_field = field_name

    return best_field


def _confidence_to_level(score: float) -> str:
    if score >= 0.80:
        return 'high'
    if score >= 0.50:
        return 'medium'
    return 'low'


def _clean_value(field: str, value: str) -> str:
    value = value.strip()

    if field == 'sexe':
        v = value.lower().strip('.')
        if v in ['m', 'masculin', 'homme', 'h', 'male']:
            return 'homme'
        if v in ['f', 'feminin', 'féminin', 'femme', 'female']:
            return 'femme'
        return value

    if field in ['nom', 'prenom']:
        return value.title()

    if 'date' in field:
        # Normaliser au format ISO YYYY-MM-DD
        m = re.match(r'(\d{2})[/\-](\d{2})[/\-](\d{4})', value)
        if m:
            return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
        # Déjà au format ISO
        m2 = re.match(r'(\d{4})[/\-](\d{2})[/\-](\d{2})', value)
        if m2:
            return value
        return value

    if field == 'mode_confirmation':
        v = value.lower().strip()
        return MODE_CONFIRMATION_MAP.get(v, value)

    return value


def _assign_date(fields, iso_date, raw_text, confidence, assigned_list, line):
    """Assigner une date trouvée au bon champ selon l'ordre de découverte."""
    date_order = ['date_naissance', 'date_symptomes', 'date_diagnostic']
    for field in date_order:
        if field not in fields and field not in assigned_list:
            fields[field] = {
                'value': iso_date,
                'confidence': _confidence_to_level(confidence),
                'raw': raw_text,
                'source': line.get('source', 'paddleocr'),
            }
            assigned_list.append(field)
            break
