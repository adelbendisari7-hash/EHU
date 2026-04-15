-- CreateEnum
CREATE TYPE "CasStatut" AS ENUM ('nouveau', 'en_cours', 'confirme', 'infirme', 'cloture');

-- CreateEnum
CREATE TYPE "AlerteType" AS ENUM ('epidemique', 'seuil', 'information');

-- CreateEnum
CREATE TYPE "Perimetre" AS ENUM ('commune', 'wilaya', 'national');

-- CreateEnum
CREATE TYPE "Gravite" AS ENUM ('attention', 'urgent', 'critique');

-- CreateEnum
CREATE TYPE "RapportType" AS ENUM ('mensuel', 'trimestriel', 'semestriel', 'annuel', 'personnalise');

-- CreateEnum
CREATE TYPE "RapportStatut" AS ENUM ('en_cours', 'genere', 'erreur');

-- CreateEnum
CREATE TYPE "GenerePar" AS ENUM ('systeme', 'utilisateur');

-- CreateEnum
CREATE TYPE "AlerteStatut" AS ENUM ('active', 'resolue', 'archivee');

-- CreateEnum
CREATE TYPE "ContactStatut" AS ENUM ('a_contacter', 'contacte', 'sous_surveillance', 'libere');

-- CreateEnum
CREATE TYPE "InvestigationStatut" AS ENUM ('en_cours', 'terminee', 'en_attente');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('homme', 'femme');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#1B4F8A',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "etablissement_id" TEXT,
    "wilaya_id" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "sex" "Sexe" NOT NULL,
    "address" TEXT NOT NULL,
    "commune_id" TEXT,
    "phone" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cas_declares" (
    "id" TEXT NOT NULL,
    "code_cas" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "maladie_id" TEXT NOT NULL,
    "date_debut_symptomes" TIMESTAMP(3) NOT NULL,
    "date_diagnostic" TIMESTAMP(3) NOT NULL,
    "mode_confirmation" TEXT,
    "resultat_labo" TEXT,
    "statut" "CasStatut" NOT NULL DEFAULT 'nouveau',
    "etablissement_id" TEXT,
    "service" TEXT,
    "medecin_id" TEXT,
    "notes_cliniques" TEXT,
    "commune_id" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
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
    "date_hospitalisation" TIMESTAMP(3),
    "est_evacue" BOOLEAN,
    "date_evacuation" TIMESTAMP(3),
    "structure_evacuation" TEXT,
    "type_prelevement" TEXT,
    "date_prelevement" TIMESTAMP(3),
    "destinataire_prelevements" TEXT,
    "evolution" TEXT,
    "date_sortie" TIMESTAMP(3),
    "date_deces" TIMESTAMP(3),
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

    CONSTRAINT "cas_declares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptomes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "categorie" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "symptomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cas_symptomes" (
    "id" TEXT NOT NULL,
    "cas_id" TEXT NOT NULL,
    "symptome_id" TEXT NOT NULL,
    "intensite" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cas_symptomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cas_lieux" (
    "id" TEXT NOT NULL,
    "cas_id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT,
    "adresse" TEXT,
    "commune_id" TEXT,
    "date_debut" TIMESTAMP(3),
    "date_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cas_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "germes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "germes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultats_labo" (
    "id" TEXT NOT NULL,
    "cas_id" TEXT NOT NULL,
    "type_prelevement" TEXT NOT NULL,
    "date_prelevement" TIMESTAMP(3) NOT NULL,
    "date_resultat" TIMESTAMP(3),
    "germe_id" TEXT,
    "resultat" TEXT,
    "antibiogramme" TEXT,
    "laboratoire" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultats_labo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiches_specifiques_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "schema_json" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiches_specifiques_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "cas_id" TEXT NOT NULL,
    "epidemiologiste_id" TEXT,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3),
    "statut" "InvestigationStatut" NOT NULL DEFAULT 'en_cours',
    "conclusion" TEXT,
    "mesures_controle" JSONB,
    "zone_geographique" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "investigation_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "relation" TEXT,
    "statut_suivi" "ContactStatut" NOT NULL DEFAULT 'a_contacter',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertes" (
    "id" TEXT NOT NULL,
    "type" "AlerteType" NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maladie_id" TEXT,
    "commune_id" TEXT,
    "nombre_cas" INTEGER NOT NULL,
    "recommandations" JSONB,
    "statut" "AlerteStatut" NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "alertes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maladies" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maladies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "commune_id" TEXT,
    "wilaya_id" TEXT,
    "adresse" TEXT,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wilayas" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "wilayas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "wilaya_id" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichiers" (
    "id" TEXT NOT NULL,
    "cas_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocoles" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seuils_alerte" (
    "id" TEXT NOT NULL,
    "maladie_id" TEXT NOT NULL,
    "perimetre" "Perimetre" NOT NULL,
    "commune_id" TEXT,
    "wilaya_id" TEXT,
    "seuil_nombre" INTEGER NOT NULL,
    "periode_jours" INTEGER NOT NULL DEFAULT 30,
    "gravite" "Gravite" NOT NULL,
    "auto_alerte" BOOLEAN NOT NULL DEFAULT true,
    "auto_notification" BOOLEAN NOT NULL DEFAULT true,
    "configured_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seuils_alerte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocole_declenchements" (
    "id" TEXT NOT NULL,
    "protocole_id" TEXT NOT NULL,
    "seuil_id" TEXT NOT NULL,
    "alerte_id" TEXT,
    "cas_declencheur_id" TEXT NOT NULL,
    "nombre_cas_actuel" INTEGER NOT NULL,
    "commune_id" TEXT,
    "maladie_id" TEXT NOT NULL,
    "vu_par_medecin" BOOLEAN NOT NULL DEFAULT false,
    "pdf_telecharge" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocole_declenchements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports" (
    "id" TEXT NOT NULL,
    "type" "RapportType" NOT NULL,
    "titre" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "donnees" JSONB NOT NULL,
    "pdf_url" TEXT,
    "excel_url" TEXT,
    "genere_par" "GenerePar" NOT NULL DEFAULT 'utilisateur',
    "created_by" TEXT,
    "statut" "RapportStatut" NOT NULL DEFAULT 'genere',
    "wilaya_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapports_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_cas_similaire_id_fkey" FOREIGN KEY ("cas_similaire_id") REFERENCES "cas_declares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_declares" ADD CONSTRAINT "cas_declares_structure_hospitalisation_id_fkey" FOREIGN KEY ("structure_hospitalisation_id") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_symptomes" ADD CONSTRAINT "cas_symptomes_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_symptomes" ADD CONSTRAINT "cas_symptomes_symptome_id_fkey" FOREIGN KEY ("symptome_id") REFERENCES "symptomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_lieux" ADD CONSTRAINT "cas_lieux_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_lieux" ADD CONSTRAINT "cas_lieux_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_labo" ADD CONSTRAINT "resultats_labo_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_labo" ADD CONSTRAINT "resultats_labo_germe_id_fkey" FOREIGN KEY ("germe_id") REFERENCES "germes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_epidemiologiste_id_fkey" FOREIGN KEY ("epidemiologiste_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes" ADD CONSTRAINT "alertes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etablissements" ADD CONSTRAINT "etablissements_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etablissements" ADD CONSTRAINT "etablissements_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communes" ADD CONSTRAINT "communes_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichiers" ADD CONSTRAINT "fichiers_cas_id_fkey" FOREIGN KEY ("cas_id") REFERENCES "cas_declares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocoles" ADD CONSTRAINT "protocoles_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocoles" ADD CONSTRAINT "protocoles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocoles" ADD CONSTRAINT "protocoles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuils_alerte" ADD CONSTRAINT "seuils_alerte_maladie_id_fkey" FOREIGN KEY ("maladie_id") REFERENCES "maladies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuils_alerte" ADD CONSTRAINT "seuils_alerte_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuils_alerte" ADD CONSTRAINT "seuils_alerte_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seuils_alerte" ADD CONSTRAINT "seuils_alerte_configured_by_fkey" FOREIGN KEY ("configured_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocole_declenchements" ADD CONSTRAINT "protocole_declenchements_protocole_id_fkey" FOREIGN KEY ("protocole_id") REFERENCES "protocoles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocole_declenchements" ADD CONSTRAINT "protocole_declenchements_seuil_id_fkey" FOREIGN KEY ("seuil_id") REFERENCES "seuils_alerte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocole_declenchements" ADD CONSTRAINT "protocole_declenchements_cas_declencheur_id_fkey" FOREIGN KEY ("cas_declencheur_id") REFERENCES "cas_declares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocole_declenchements" ADD CONSTRAINT "protocole_declenchements_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_wilaya_id_fkey" FOREIGN KEY ("wilaya_id") REFERENCES "wilayas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
