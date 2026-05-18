-- Add frequence_declaration column to maladies table
ALTER TABLE "maladies" ADD COLUMN "frequence_declaration" TEXT;

-- Catégorie 1 — Urgence (délai < 4h, appel téléphonique obligatoire)
UPDATE "maladies" SET "frequence_declaration" = 'urgence', "delai_notification_heures" = 4, "delai_declaration_texte" = 'Déclaration en urgence (< 4h) + appel téléphonique'
WHERE "code_cim10" IN ('U82','Y62','G000','G01A39','G01','G03','G05','B54','G82','J95');

-- Catégorie 1 — Quotidienne (délai 24h)
UPDATE "maladies" SET "frequence_declaration" = 'quotidienne', "delai_notification_heures" = 24, "delai_declaration_texte" = 'Déclaration quotidienne (24h)'
WHERE "code_cim10" IN ('A05.1','A23','A22','A37','A36','A06','B67','A01','B15','A48','B551','B550','A30','A27','A32','A20','A82','A77','B05','B06','B65','A33','A35','A05.9','A71','A75');

-- Catégorie 1 — Hebdomadaire (délai 168h = 7 jours)
UPDATE "maladies" SET "frequence_declaration" = 'hebdomadaire', "delai_notification_heures" = 168, "delai_declaration_texte" = 'Déclaration hebdomadaire (7 jours)'
WHERE "code_cim10" IN ('B16','B17','A74','B24','A53','A54');

-- Catégorie 1 — Mensuelle (délai 720h = 30 jours)
UPDATE "maladies" SET "frequence_declaration" = 'mensuelle', "delai_notification_heures" = 720, "delai_declaration_texte" = 'Déclaration mensuelle (30 jours)'
WHERE "code_cim10" IN ('A15','A18');

-- Catégorie 2 — Urgence (Poliomyélite)
UPDATE "maladies" SET "frequence_declaration" = 'urgence', "delai_notification_heures" = 4, "delai_declaration_texte" = 'Déclaration en urgence (< 4h) + appel téléphonique'
WHERE "code_cim10" = 'A80';

-- Catégorie 2 — Quotidienne
UPDATE "maladies" SET "frequence_declaration" = 'quotidienne', "delai_notification_heures" = 24, "delai_declaration_texte" = 'Déclaration quotidienne (24h)'
WHERE "code_cim10" IN ('A92','A00','A90','A984','A924','A923','A95','A988','J10','U04','U07','U071','B03');
