"""
Résolution des noms (communes, maladies, établissements) vers leurs UUIDs PostgreSQL.
Utilise rapidfuzz pour le matching approximatif.
"""
import psycopg2
import psycopg2.extras
from rapidfuzz import process, fuzz
from typing import Optional
from .config import DATABASE_URL

# Cache en mémoire pour éviter les requêtes répétées
_cache: dict = {
    'communes': [],
    'maladies': [],
    'etablissements': [],
}
_cache_loaded = False


def _load_cache():
    global _cache_loaded
    if _cache_loaded or not DATABASE_URL:
        return
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("SELECT id, nom FROM communes ORDER BY nom")
        _cache['communes'] = [{'id': r['id'], 'nom': r['nom']} for r in cur.fetchall()]

        cur.execute("SELECT id, nom FROM maladies WHERE is_active = true ORDER BY nom")
        _cache['maladies'] = [{'id': r['id'], 'nom': r['nom']} for r in cur.fetchall()]

        cur.execute("SELECT id, nom FROM etablissements ORDER BY nom")
        _cache['etablissements'] = [{'id': r['id'], 'nom': r['nom']} for r in cur.fetchall()]

        cur.close()
        conn.close()
        _cache_loaded = True
        print(f"Cache chargé: {len(_cache['communes'])} communes, {len(_cache['maladies'])} maladies")
    except Exception as e:
        print(f"Impossible de charger le cache BD: {e}")


def _fuzzy_match(query: str, items: list, threshold: int = 70) -> Optional[dict]:
    """Trouver le meilleur match fuzzy dans une liste."""
    if not items or not query:
        return None
    names = [item['nom'] for item in items]
    result = process.extractOne(query, names, scorer=fuzz.token_sort_ratio)
    if result and result[1] >= threshold:
        matched_name = result[0]
        matched_item = next((i for i in items if i['nom'] == matched_name), None)
        return matched_item
    return None


async def resolve_ids(fields: dict) -> dict:
    """Résoudre les noms vers leurs UUIDs dans la base de données."""
    _load_cache()
    resolved = dict(fields)

    # Résoudre commune
    commune_value = fields.get('commune', {}).get('value')
    if commune_value and _cache['communes']:
        match = _fuzzy_match(commune_value, _cache['communes'])
        if match:
            resolved['commune_id'] = {
                'value': match['id'],
                'confidence': 'high',
                'raw': commune_value,
                'source': 'db_fuzzy',
            }

    # Résoudre maladie
    maladie_value = fields.get('maladie', {}).get('value')
    if maladie_value and _cache['maladies']:
        match = _fuzzy_match(maladie_value, _cache['maladies'])
        if match:
            resolved['maladie_id'] = {
                'value': match['id'],
                'confidence': 'high',
                'raw': maladie_value,
                'source': 'db_fuzzy',
            }

    # Résoudre établissement
    etab_value = fields.get('etablissement', {}).get('value')
    if etab_value and _cache['etablissements']:
        match = _fuzzy_match(etab_value, _cache['etablissements'])
        if match:
            resolved['etablissement_id'] = {
                'value': match['id'],
                'confidence': 'high',
                'raw': etab_value,
                'source': 'db_fuzzy',
            }

    return resolved
