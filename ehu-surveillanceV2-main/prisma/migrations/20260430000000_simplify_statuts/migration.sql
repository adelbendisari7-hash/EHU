-- Simplify case statuses: keep only brouillon, confirme, suspect
-- Step 1: update based on observation field (most accurate)
UPDATE cas_declares
SET statut = 'confirme'::"CasStatut"
WHERE observation = 'cas_confirme'
  AND statut NOT IN ('confirme', 'brouillon', 'suspect');

UPDATE cas_declares
SET statut = 'suspect'::"CasStatut"
WHERE observation = 'cas_suspect'
  AND statut NOT IN ('confirme', 'brouillon', 'suspect');

-- Step 2: map remaining old statuses
UPDATE cas_declares
SET statut = 'confirme'::"CasStatut"
WHERE statut = 'cloture';

UPDATE cas_declares
SET statut = 'suspect'::"CasStatut"
WHERE statut IN ('nouveau', 'en_cours', 'infirme');
