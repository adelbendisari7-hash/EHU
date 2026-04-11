-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1B4F8A',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "etablissement_id" TEXT,
    "wilaya_id" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME,
    CONSTRAINT "users_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifiant" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATETIME NOT NULL,
    "sex" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "commune_id" TEXT,
    "phone" TEXT,
    "photo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patients_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cas_declares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code_cas" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "maladie_id" TEXT NOT NULL,
    "date_debut_symptomes" DATETIME NOT NULL,
    "date_diagnostic" DATETIME NOT NULL,
    "mode_confirmation" TEXT,
    "resultat_labo" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'nouveau',
    "etablissement_id" TEXT,
    "service" TEXT NOT NULL,
    "medecin_id" TEXT,
    "notes_cliniques" TEXT,
    "commune_id" TEXT,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "nin" TEXT,
    "age_ans" INTEGER,
    "age_mois" INTEGER,
    "age_jours" INTEGER,
    "profession" TEXT,
    "email_patient" TEXT,
    "lieu_travail" TEXT,
    "est_etranger" BOOLEAN,
    "nationalite" TEXT,
    "symptomes_texte" TEXT,
    "observation" TEXT,
    "atcd" TEXT,
    "lieux_frequentes" TEXT,
    "cas_similaire" BOOLEAN,
    "est_hospitalise" BOOLEAN,
    "date_hospitalisation" DATETIME,
    "est_evacue" BOOLEAN,
    "date_evacuation" DATETIME,
    "structure_evacuation" TEXT,
    "type_prelevement" TEXT,
    "date_prelevement" DATETIME,
    "destinataire_prelevements" TEXT,
    "evolution" TEXT,
    "date_sortie" DATETIME,
    "date_deces" DATETIME,
    "service_declarant" TEXT,
    "mois_declaration" INTEGER,
    "annee_declaration" INTEGER,
    "donnees_specifiques" JSONB,
    "fiche_specifique_type" TEXT,
    "nationalite_code" TEXT,
    "cas_similaire_id" TEXT,
    "evaluation_clinique" JSONB,
    "structure_hospitalisation_id" TEXT,
    "service_hospitalisation" TEXT,
    CONSTRAINT "cas_declares_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cas_declares_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cas_declares_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cas_declares_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cas_declares_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cas_declares_cas_similaire_id_fkey" FOREIGN KEY ("cas_similaire_id") REFERENCES "cas_declares" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cas_declares_structure_hospitalisation_id_fkey" FOREIGN KEY ("structure_hospitalisation_id") REFERENCES "etablissements" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "symptomes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categorie" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "cas_symptomes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cas_id" TEXT NOT NULL,
    "symptome_id" TEXT NOT NULL,
    "intensite" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cas_symptomes_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cas_symptomes_symptome_id_fkey" FOREIGN KEY ("symptome_id") REFERENCES "symptomes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cas_lieux" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cas_id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT,
    "adresse" TEXT,
    "commune_id" TEXT,
    "date_debut" DATETIME,
    "date_fin" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cas_lieux_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cas_lieux_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "germes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "resultats_labo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cas_id" TEXT NOT NULL,
    "type_prelevement" TEXT NOT NULL,
    "date_prelevement" DATETIME NOT NULL,
    "date_resultat" DATETIME,
    "germe_id" TEXT,
    "resultat" TEXT,
    "antibiogramme" TEXT,
    "laboratoire" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resultats_labo_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "resultats_labo_germe_id_fkey" FOREIGN KEY ("germe_id") REFERENCES "germes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fiches_specifiques_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "schema_json" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cas_id" TEXT NOT NULL,
    "epidemiologiste_id" TEXT,
    "date_debut" DATETIME NOT NULL,
    "date_fin" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "conclusion" TEXT,
    "mesures_controle" JSONB,
    "zone_geographique" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "investigations_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investigations_epidemiologiste_id_fkey" FOREIGN KEY ("epidemiologiste_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigation_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "relation" TEXT,
    "statut_suivi" TEXT NOT NULL DEFAULT 'a_contacter',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contacts_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alertes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maladie_id" TEXT,
    "commune_id" TEXT,
    "nombre_cas" INTEGER NOT NULL,
    "recommandations" JSONB,
    "statut" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    CONSTRAINT "alertes_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "alertes_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "alertes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maladies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "code_cim10" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "nom_court" TEXT,
    "seuil_defaut" INTEGER,
    "periode_defaut_jours" INTEGER DEFAULT 30,
    "categorie_gravite" TEXT,
    "delai_notification_heures" INTEGER,
    "has_fiche_specifique" BOOLEAN NOT NULL DEFAULT false,
    "fiche_specifique_slug" TEXT,
    "groupe_epidemiologique" TEXT,
    "seuil_alerte_texte" TEXT,
    "delai_declaration_texte" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "commune_id" TEXT,
    "wilaya_id" TEXT,
    "adresse" TEXT,
    CONSTRAINT "etablissements_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "etablissements_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wilayas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "communes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "wilaya_id" TEXT NOT NULL,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    CONSTRAINT "communes_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fichiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cas_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fichiers_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocoles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maladie_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "conduite_medicale" JSONB NOT NULL,
    "actions_administratives" JSONB NOT NULL,
    "investigation_steps" JSONB NOT NULL,
    "posologies" JSONB,
    "mesures_prevention" JSONB,
    "duree_surveillance" INTEGER,
    "pdf_url" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "protocoles_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocoles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocoles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "seuils_alerte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maladie_id" TEXT NOT NULL,
    "perimetre" TEXT NOT NULL,
    "commune_id" TEXT,
    "wilaya_id" TEXT,
    "seuil_nombre" INTEGER NOT NULL,
    "periode_jours" INTEGER NOT NULL DEFAULT 30,
    "gravite" TEXT NOT NULL,
    "auto_alerte" BOOLEAN NOT NULL DEFAULT true,
    "auto_notification" BOOLEAN NOT NULL DEFAULT true,
    "configured_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seuils_alerte_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "seuils_alerte_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "seuils_alerte_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "seuils_alerte_configured_by_fkey" FOREIGN KEY ("configured_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocole_declenchements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocole_id" TEXT NOT NULL,
    "seuil_id" TEXT NOT NULL,
    "alerte_id" TEXT,
    "cas_declencheur_id" TEXT NOT NULL,
    "nombre_cas_actuel" INTEGER NOT NULL,
    "commune_id" TEXT,
    "maladie_id" TEXT NOT NULL,
    "vu_par_medecin" BOOLEAN NOT NULL DEFAULT false,
    "pdf_telecharge" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "protocole_declenchements_protocole_id_fkey" FOREIGN KEY ("protocole_id") REFERENCES "protocoles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocole_declenchements_seuil_id_fkey" FOREIGN KEY ("seuil_id") REFERENCES "seuils_alerte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocole_declenchements_cas_declencheur_id_fkey" FOREIGN KEY ("cas_declencheur_id") REFERENCES "cas_declares" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocole_declenchements_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rapports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date_debut" DATETIME NOT NULL,
    "date_fin" DATETIME NOT NULL,
    "donnees" JSONB NOT NULL,
    "pdf_url" TEXT,
    "excel_url" TEXT,
    "genere_par" TEXT NOT NULL DEFAULT 'utilisateur',
    "created_by" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'genere',
    "wilaya_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rapports_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rapports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_identifiant_key" ON "patients"("identifiant");

-- CreateIndex
CREATE UNIQUE INDEX "cas_declares_code_cas_key" ON "cas_declares"("code_cas");

-- CreateIndex
CREATE UNIQUE INDEX "symptomes_nom_key" ON "symptomes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "symptomes_code_key" ON "symptomes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cas_symptomes_cas_id_symptome_id_key" ON "cas_symptomes"("cas_id", "symptome_id");

-- CreateIndex
CREATE UNIQUE INDEX "cas_lieux_cas_id_ordre_key" ON "cas_lieux"("cas_id", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "germes_nom_key" ON "germes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "germes_code_key" ON "germes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fiches_specifiques_templates_slug_key" ON "fiches_specifiques_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_cas_id_key" ON "investigations"("cas_id");

-- CreateIndex
CREATE UNIQUE INDEX "maladies_code_cim10_key" ON "maladies"("code_cim10");

-- CreateIndex
CREATE UNIQUE INDEX "wilayas_code_key" ON "wilayas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "protocoles_maladie_id_key" ON "protocoles"("maladie_id");
