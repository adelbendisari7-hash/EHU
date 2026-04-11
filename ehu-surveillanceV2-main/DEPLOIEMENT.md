# Guide de Déploiement — EHU Oran Surveillance Épidémiologique

## Vue d'ensemble

Ce guide est destiné à l'équipe informatique de l'EHU Oran pour installer l'application sur le serveur de l'hôpital.

**Architecture:**
```
Internet / Réseau local
        |
     Nginx :80          ← Reverse proxy, fichiers statiques
        |
  Next.js :3000         ← Application (géré par PM2)
        |
  PostgreSQL :5432       ← Base de données locale
```

---

## Pré-requis Serveur

- **OS:** Ubuntu 22.04 LTS (recommandé) ou Windows Server 2019+
- **RAM:** minimum 2 Go (4 Go recommandé)
- **Disque:** minimum 20 Go
- **Réseau:** accès local au réseau de l'hôpital

---

## Étape 1 — Installer Node.js

```bash
# Ubuntu/Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version   # doit afficher v20.x.x
npm --version    # doit afficher 10.x.x
```

---

## Étape 2 — Installer PostgreSQL

### Ubuntu/Linux
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql   # démarrage automatique

# Créer la base de données et l'utilisateur
sudo -u postgres psql << 'EOF'
CREATE USER ehu_user WITH PASSWORD 'MotDePasseSecurise123!';
CREATE DATABASE ehu_surveillance OWNER ehu_user;
GRANT ALL PRIVILEGES ON DATABASE ehu_surveillance TO ehu_user;
\q
EOF
```

### Windows Server
1. Télécharger PostgreSQL 16 depuis https://www.postgresql.org/download/windows/
2. Installer avec pgAdmin
3. Ouvrir pgAdmin, créer:
   - Utilisateur: `ehu_user` avec mot de passe sécurisé
   - Base de données: `ehu_surveillance` propriétaire `ehu_user`

---

## Étape 3 — Installer PM2

```bash
sudo npm install -g pm2

# Vérifier
pm2 --version
```

---

## Étape 4 — Installer Nginx

```bash
# Ubuntu/Linux
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Étape 5 — Copier l'Application

Transférer les fichiers du projet sur le serveur. **IMPORTANT:** Ne pas inclure `node_modules/` ni `.next/` dans le transfert.

### Option A — Via clé USB / Réseau local
```bash
# Sur le serveur
sudo mkdir -p /opt/ehu-surveillance
sudo chown $USER:$USER /opt/ehu-surveillance

# Copier les fichiers (sans node_modules et .next)
# Depuis votre machine Windows:
#   C:\Users\Lenovo\Videos\ehu_project\ehu-surveillance\  -->  /opt/ehu-surveillance/
```

### Option B — Via Git (si git est configuré)
```bash
cd /opt
git clone <url-du-repo> ehu-surveillance
```

**Fichiers à inclure dans le transfert:**
```
ehu-surveillance/
├── src/
├── prisma/
├── public/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── middleware.ts
├── ecosystem.config.js
├── nginx.conf
└── .env.production    ← à renommer en .env.local
```

---

## Étape 6 — Configurer l'Environnement

```bash
cd /opt/ehu-surveillance

# Copier et éditer le fichier d'environnement
cp .env.production .env.local
nano .env.local
```

Remplir les valeurs dans `.env.local`:

```env
# Remplacer CHANGE_PASSWORD_HERE par le mot de passe PostgreSQL créé à l'étape 2
DATABASE_URL="postgresql://ehu_user:CHANGE_PASSWORD_HERE@localhost:5432/ehu_surveillance?sslmode=disable"

# Générer un secret sécurisé:
# Linux: openssl rand -base64 32
# Windows: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="VOTRE_SECRET_GENERE_ICI"

# Adresse IP ou nom de domaine du serveur hôpital
NEXTAUTH_URL="http://192.168.1.100"   # exemple d'IP locale

RESEND_API_KEY="re_votre_cle_resend"  # optionnel
FROM_EMAIL="alertes@ehu-oran.dz"
```

---

## Étape 7 — Installer les Dépendances et Compiler

```bash
cd /opt/ehu-surveillance

# Installer les packages Node.js
npm install

# Générer le client Prisma
npx prisma generate

# Créer les tables dans la base de données
npx prisma migrate deploy

# Remplir les données initiales (wilayas, maladies MDO, utilisateurs démo)
npx prisma db seed

# Compiler l'application en production
npm run build
```

La compilation prend 2–3 minutes. À la fin, vous devriez voir:
```
Route (app)                Size    First Load JS
┌ ○ /login                 ...
├ ○ /dashboard             ...
...
✓ Compiled successfully
```

---

## Étape 8 — Démarrer l'Application avec PM2

```bash
cd /opt/ehu-surveillance

# Créer le dossier de logs
sudo mkdir -p /var/log/ehu
sudo chown $USER:$USER /var/log/ehu

# Démarrer l'application
pm2 start ecosystem.config.js

# Vérifier que l'application tourne
pm2 status
pm2 logs ehu-surveillance --lines 20
```

**Configurer PM2 pour démarrer automatiquement au reboot:**
```bash
pm2 startup
# Copier et exécuter la commande affichée par PM2
pm2 save
```

---

## Étape 9 — Configurer Nginx

```bash
# Copier la config Nginx
sudo cp /opt/ehu-surveillance/nginx.conf /etc/nginx/sites-available/ehu-surveillance

# Modifier server_name avec l'IP ou domaine du serveur
sudo nano /etc/nginx/sites-available/ehu-surveillance
# Changer: server_name ehu-surveillance.local;
# Mettre:  server_name 192.168.1.100;  (ou votre IP)

# Activer le site
sudo ln -s /etc/nginx/sites-available/ehu-surveillance /etc/nginx/sites-enabled/

# Désactiver le site par défaut
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## Étape 10 — Tester l'Installation

Ouvrir un navigateur et accéder à: `http://IP_DU_SERVEUR`

**Comptes de test:**
| Email | Mot de passe | Rôle |
|-------|-------------|------|
| medecin@ehu-oran.dz | password123 | Médecin |
| epidemio@ehu-oran.dz | password123 | Épidémiologiste |
| admin@ehu-oran.dz | password123 | Administrateur |

> **IMPORTANT:** Changer tous les mots de passe après la première connexion !

---

## Commandes de Maintenance

### Voir les logs en temps réel
```bash
pm2 logs ehu-surveillance
```

### Redémarrer l'application
```bash
pm2 restart ehu-surveillance
```

### Arrêter l'application
```bash
pm2 stop ehu-surveillance
```

### Mettre à jour l'application (après une nouvelle version)
```bash
cd /opt/ehu-surveillance
# Copier les nouveaux fichiers
npm install
npm run build
npx prisma migrate deploy
pm2 restart ehu-surveillance
```

### Sauvegarde de la base de données
```bash
# Créer une sauvegarde
pg_dump -U ehu_user ehu_surveillance > /backup/ehu_$(date +%Y%m%d).sql

# Restaurer une sauvegarde
psql -U ehu_user ehu_surveillance < /backup/ehu_20260316.sql
```

### Script de sauvegarde automatique (cron)
```bash
# Ajouter au crontab
crontab -e
# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin:
0 2 * * * pg_dump -U ehu_user ehu_surveillance > /backup/ehu_$(date +\%Y\%m\%d).sql
```

---

## Résolution de Problèmes

### L'application ne démarre pas
```bash
pm2 logs ehu-surveillance --err
# Vérifier le fichier .env.local (DATABASE_URL, AUTH_SECRET)
```

### Erreur de connexion à la base de données
```bash
# Tester la connexion PostgreSQL
psql -U ehu_user -d ehu_surveillance -h localhost
# Entrer le mot de passe quand demandé
```

### Page blanche ou erreur 502
```bash
# Vérifier que Next.js tourne sur le port 3000
pm2 status
curl http://127.0.0.1:3000   # doit retourner du HTML

# Vérifier Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Réinitialiser la base de données (ATTENTION: supprime toutes les données)
```bash
cd /opt/ehu-surveillance
npx prisma migrate reset
npx prisma db seed
```

---

## Sécurité — Checklist Post-Déploiement

- [ ] Changer le mot de passe PostgreSQL (`CHANGE_PASSWORD_HERE`)
- [ ] Générer un `AUTH_SECRET` unique (pas la valeur par défaut)
- [ ] Changer les mots de passe des 3 comptes démo
- [ ] Configurer un pare-feu (UFW) pour n'autoriser que les ports 80 et 22
- [ ] Configurer des sauvegardes automatiques de la base de données
- [ ] Restreindre l'accès au serveur au réseau interne de l'hôpital

```bash
# Configuration pare-feu (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw enable
sudo ufw status
```

---

## Support

Pour tout problème technique, contacter le développeur de l'application en fournissant:
1. La sortie de `pm2 logs ehu-surveillance --lines 50`
2. La sortie de `sudo tail -50 /var/log/nginx/error.log`
3. La description exacte de l'erreur observée
