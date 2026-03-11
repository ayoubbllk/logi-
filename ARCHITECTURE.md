# Architecture Technique — Application de Gestion des Fiches de Contrôle Qualité

## Contexte métier

Application web interne destinée à une entreprise industrielle (produits bitumineux) pour créer, remplir, valider et archiver des fiches de contrôle qualité en production.

### Stack technique

| Technologie    | Rôle                          |
| -------------- | ----------------------------- |
| Next.js 14     | Framework fullstack (App Router) |
| TypeScript     | Langage principal             |
| MySQL 8.x      | Base de données relationnelle |
| Prisma         | ORM / Data Access Layer       |
| JWT            | Authentification              |
| TailwindCSS    | Styling                       |
| Zod            | Validation des données        |
| bcrypt         | Hashage des mots de passe     |

---

## 1) Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                     │
│           Next.js 14 App Router — SSR + CSR             │
│          TailwindCSS · React Server Components          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│              NEXT.JS API LAYER (Route Handlers)         │
│        /api/auth/*  ·  /api/fiches/*  ·  /api/users/*   │
│              Middleware JWT · Validation Zod             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  SERVICE LAYER                          │
│    AuthService · FicheService · UserService · PDFService│
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               DATA ACCESS LAYER (Prisma ORM)            │
│              Prisma Client · Transactions               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    MySQL 8.x                            │
│         Tables relationnelles · Index optimisés         │
└─────────────────────────────────────────────────────────┘
```

### Principes fondamentaux

- **Monorepo Next.js** : le frontend et le backend cohabitent dans le même projet (API Route Handlers)
- **Server Components** par défaut, Client Components uniquement pour l'interactivité (formulaires, modales)
- **Séparation en couches** : Présentation → API → Service → Data Access
- Pas de BFF séparé : les Route Handlers de Next.js servent d'API REST interne

---

## 2) Organisation des Dossiers

```
controle/
├── prisma/
│   ├── schema.prisma              # Schéma de la BDD
│   ├── migrations/                # Historique des migrations
│   └── seed.ts                    # Données initiales (admin, modèles)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout racine (providers, fonts)
│   │   ├── page.tsx               # Redirect → /dashboard ou /login
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Page de connexion
│   │   │   └── layout.tsx         # Layout sans sidebar
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Layout avec sidebar + header
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Tableau de bord
│   │   │   ├── fiches/
│   │   │   │   ├── page.tsx       # Liste des fiches
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # Création de fiche
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Détail / édition
│   │   │   │       └── pdf/
│   │   │   │           └── route.ts  # Génération PDF
│   │   │   ├── modeles/
│   │   │   │   ├── page.tsx       # Gestion des modèles (admin)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Éditeur de modèle
│   │   │   └── utilisateurs/
│   │   │       └── page.tsx       # Gestion utilisateurs (admin)
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── fiches/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts       # GET, PUT, DELETE
│   │       │       └── validate/route.ts  # POST validation
│   │       ├── modeles/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── users/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts              # Singleton Prisma Client
│   │   ├── auth.ts                # Fonctions JWT (sign, verify)
│   │   ├── constants.ts           # Constantes globales
│   │   └── utils.ts               # Helpers génériques
│   │
│   ├── services/
│   │   ├── auth.service.ts        # Logique d'authentification
│   │   ├── fiche.service.ts       # CRUD + logique métier fiches
│   │   ├── modele.service.ts      # Gestion modèles de fiches
│   │   ├── user.service.ts        # Gestion utilisateurs
│   │   └── pdf.service.ts         # Génération PDF
│   │
│   ├── middleware.ts              # Middleware Next.js (protection routes)
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── fiche.types.ts
│   │   ├── modele.types.ts
│   │   └── api.types.ts           # Types de réponse API
│   │
│   ├── validations/
│   │   ├── auth.schema.ts         # Schémas Zod pour auth
│   │   ├── fiche.schema.ts        # Schémas Zod pour fiches
│   │   └── user.schema.ts         # Schémas Zod pour users
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFiches.ts
│   │   └── useDebounce.ts
│   │
│   └── components/
│       ├── ui/                    # Composants génériques (Button, Input, Modal…)
│       ├── layout/                # Sidebar, Header, Breadcrumb
│       ├── fiches/                # Composants spécifiques aux fiches
│       │   ├── FicheForm.tsx
│       │   ├── FicheTable.tsx
│       │   ├── SectionRenderer.tsx    # Rendu dynamique des sections
│       │   └── FieldRenderer.tsx      # Rendu dynamique des champs
│       └── auth/
│           └── LoginForm.tsx
│
├── public/
│   └── logo.png
│
├── .env                           # Variables d'environnement
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3) Flux d'Authentification

### Diagramme de flux

```
┌──────────┐     POST /api/auth/login      ┌───────────┐
│  Client   │  ──── email + password ────▶  │  API Auth  │
│  (Login)  │                               │            │
│           │  ◀── httpOnly cookie (JWT) ──  │  bcrypt    │
└─────┬─────┘       + user payload          └───────────┘
      │
      │  Chaque requête suivante
      ▼
┌─────────────────────────────────┐
│   middleware.ts (Next.js)       │
│  1. Lit le cookie JWT           │
│  2. Vérifie la signature        │
│  3. Vérifie l'expiration        │
│  4. Injecte userId + role       │
│     dans les headers            │
│  5. Vérifie les permissions     │
│     par route                   │
└─────────────────────────────────┘
```

### Détails techniques

| Aspect                 | Choix                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Stockage du token**  | Cookie HttpOnly, Secure, SameSite=Strict                 |
| **Algorithme JWT**     | HS256 avec secret ≥ 64 caractères                        |
| **Durée de vie**       | Access token : 8h (journée de travail)                   |
| **Refresh**            | Pas de refresh token (app interne, re-login acceptable)  |
| **Hash mots de passe** | bcrypt, salt rounds = 12                                 |
| **Payload JWT**        | `{ sub: userId, role: "admin" \| "controleur", iat, exp }` |
| **Déconnexion**        | Suppression du cookie côté client                        |

### Variables d'environnement requises

```env
DATABASE_URL="mysql://user:password@localhost:3306/controle_qualite"
JWT_SECRET="votre_secret_jwt_64_caracteres_minimum_ici"
JWT_EXPIRATION="8h"
BCRYPT_SALT_ROUNDS=12
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Routes protégées dans middleware.ts

| Pattern              | Accès requis       |
| -------------------- | ------------------ |
| `/dashboard/**`      | Authentifié (tout rôle) |
| `/utilisateurs/**`   | Admin uniquement   |
| `/modeles/**`        | Admin uniquement   |
| `/api/users/**`      | Admin uniquement   |
| `/login`             | Redirige vers dashboard si déjà connecté |

---

## 4) Gestion des Rôles

### Définition des rôles

| Rôle         | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `ADMIN`      | Gestion complète : utilisateurs, modèles, validation des fiches |
| `CONTROLEUR` | Création et soumission de fiches, consultation de ses fiches     |

### Matrice de permissions

| Ressource / Action                    | Admin | Contrôleur |
| ------------------------------------- | :---: | :--------: |
| Voir le tableau de bord              |  ✅   |     ✅     |
| Créer une fiche de contrôle          |  ✅   |     ✅     |
| Remplir / éditer sa propre fiche     |  ✅   |     ✅     |
| Modifier une fiche d'un autre        |  ✅   |     ❌     |
| Valider / rejeter une fiche          |  ✅   |     ❌     |
| Supprimer une fiche                  |  ✅   |     ❌     |
| Exporter PDF                         |  ✅   |  ✅ (ses fiches) |
| Gérer les modèles de fiche           |  ✅   |     ❌     |
| Gérer les utilisateurs               |  ✅   |     ❌     |
| Voir toutes les fiches               |  ✅   |     ❌ (les siennes) |

### Implémentation

- **Enum Prisma** : `enum Role { ADMIN CONTROLEUR }`
- **Guard côté API** : fonction `requireRole(role: Role)` vérifiée dans chaque Route Handler
- **Filtrage côté UI** : les éléments de navigation et les boutons d'action sont conditionnés au rôle via le contexte Auth
- **Filtrage côté données** : les requêtes Prisma du contrôleur incluent systématiquement `where: { createdById: userId }`

---

## 5) Structure Logique des Sections Dynamiques

C'est le cœur métier. Les fiches de contrôle ont une structure **variable** selon le type de produit (bitume routier, émulsion, membrane, etc.). L'architecture supporte des modèles de fiches dynamiques.

### Modèle conceptuel

```
Modèle de Fiche (template)
 └── Sections (ordonnées)
      └── Champs (ordonnés, typés)

Fiche de Contrôle (instance)
 └── Valeurs des champs (liées au champ du modèle)
```

### Types de champs supportés

| Type      | Exemple métier                                           |
| --------- | -------------------------------------------------------- |
| `TEXT`    | Observations, remarques                                  |
| `NUMBER`  | Température de ramollissement, pénétrabilité             |
| `BOOLEAN` | Conformité oui/non                                       |
| `SELECT`  | Grade du produit (35/50, 50/70, 70/100)                  |
| `DATE`    | Date de prélèvement                                      |
| `RANGE`   | Valeur avec min/max tolérance (ex: pénétrabilité 50–70)  |
| `FILE`    | Photo d'échantillon (référence)                          |

### Schéma Prisma (conceptuel)

```prisma
// ──────────────── MODÈLES (Templates) ────────────────

model ModeleFiche {
  id          String   @id @default(cuid())
  nom         String                           // Ex: "Contrôle Bitume Routier"
  description String?  @db.Text
  produitType String                           // Ex: "BITUME_ROUTIER"
  estActif    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  sections    SectionModele[]
  fiches      FicheControle[]
}

model SectionModele {
  id          String   @id @default(cuid())
  titre       String                           // Ex: "Essais physiques"
  description String?
  ordre       Int                              // Ordre d'affichage
  modeleId    String

  modele      ModeleFiche   @relation(fields: [modeleId], references: [id], onDelete: Cascade)
  champs      ChampModele[]

  @@index([modeleId])
}

model ChampModele {
  id              String    @id @default(cuid())
  label           String                       // Ex: "Pénétrabilité à 25°C"
  type            FieldType                    // TEXT, NUMBER, BOOLEAN, SELECT, DATE, RANGE, FILE
  ordre           Int
  estObligatoire  Boolean   @default(false)
  unite           String?                      // °C, mm, %, g/cm³
  valeurMin       Float?                       // Tolérance min
  valeurMax       Float?                       // Tolérance max
  options         Json?                        // Options pour SELECT ["35/50", "50/70", "70/100"]
  valeurDefaut    String?
  sectionId       String

  section         SectionModele @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  valeurs         ValeurChamp[]

  @@index([sectionId])
}

enum FieldType {
  TEXT
  NUMBER
  BOOLEAN
  SELECT
  DATE
  RANGE
  FILE
}

// ──────────────── FICHES (Instances) ────────────────

model FicheControle {
  id                    String      @id @default(cuid())
  numero                String      @unique          // FC-2026-00001
  statut                FicheStatut @default(BROUILLON)
  commentaireValidation String?     @db.Text
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  dateValidation        DateTime?

  modeleId              String
  createdById           String
  validatedById         String?

  modele                ModeleFiche @relation(fields: [modeleId], references: [id])
  createdBy             User        @relation("FichesCreees", fields: [createdById], references: [id])
  validatedBy           User?       @relation("FichesValidees", fields: [validatedById], references: [id])
  valeurs               ValeurChamp[]
  historique            HistoriqueFiche[]

  @@index([statut, createdById, createdAt])
  @@index([modeleId])
}

model ValeurChamp {
  id            String   @id @default(cuid())
  valeurTexte   String?  @db.Text
  valeurNombre  Float?
  valeurBool    Boolean?
  valeurDate    DateTime?
  estConforme   Boolean?                       // null = non évalué

  ficheId       String
  champModeleId String

  fiche         FicheControle @relation(fields: [ficheId], references: [id], onDelete: Cascade)
  champModele   ChampModele   @relation(fields: [champModeleId], references: [id])

  @@unique([ficheId, champModeleId])
  @@index([ficheId])
}

enum FicheStatut {
  BROUILLON
  SOUMISE
  VALIDEE
  REJETEE
}

// ──────────────── UTILISATEURS ────────────────

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String                             // Hash bcrypt
  nom       String
  prenom    String
  role      Role     @default(CONTROLEUR)
  estActif  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  fichesCreees   FicheControle[] @relation("FichesCreees")
  fichesValidees FicheControle[] @relation("FichesValidees")
  historique     HistoriqueFiche[]
}

enum Role {
  ADMIN
  CONTROLEUR
}

// ──────────────── AUDIT ────────────────

model HistoriqueFiche {
  id        String       @id @default(cuid())
  action    ActionType
  details   Json?                              // Champs modifiés
  createdAt DateTime     @default(now())

  ficheId   String
  userId    String

  fiche     FicheControle @relation(fields: [ficheId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id])

  @@index([ficheId])
  @@index([userId])
}

enum ActionType {
  CREATION
  MODIFICATION
  SOUMISSION
  VALIDATION
  REJET
}
```

### Moteur de rendu dynamique

Le composant `SectionRenderer` itère sur les sections du modèle, et `FieldRenderer` instancie le bon composant d'input selon `champ.type`. Cela permet d'ajouter de nouveaux types de contrôle **sans modifier le code**, uniquement via l'interface admin des modèles.

```
SectionRenderer (props: sections[])
  └── pour chaque section :
       ├── Titre + Description
       └── FieldRenderer (props: champ)
            ├── type TEXT     → <TextInput />
            ├── type NUMBER   → <NumberInput /> (avec min/max)
            ├── type BOOLEAN  → <Checkbox /> ou <Toggle />
            ├── type SELECT   → <Select /> (options dynamiques)
            ├── type DATE     → <DatePicker />
            ├── type RANGE    → <RangeInput /> (valeur + indicateur conformité)
            └── type FILE     → <FileUpload />
```

---

## 6) Stratégie de Stockage des Données

### Volumétrie estimée

| Table              | Rôle                    | Volume estimé   |
| ------------------ | ----------------------- | --------------- |
| `users`            | Utilisateurs de l'app   | ~50             |
| `modeles_fiche`    | Templates de fiches     | ~10-20          |
| `sections_modele`  | Sections par template   | ~50-100         |
| `champs_modele`    | Champs par section      | ~200-500        |
| `fiches_controle`  | Fiches remplies         | ~10 000/an      |
| `valeurs_champ`    | Valeurs saisies         | ~200 000/an     |
| `historique_fiche` | Audit trail             | ~50 000/an      |

### Indexation

| Table / Colonne(s)                                    | Type d'index     | Justification                     |
| ----------------------------------------------------- | ---------------- | --------------------------------- |
| `fiches_controle(statut, createdById, createdAt)`     | Composite        | Filtrage liste + tri              |
| `valeurs_champ(ficheId, champModeleId)`               | Unique composite | Lookup principal                  |
| `fiches_controle.numero`                              | Unique           | Recherche rapide par numéro       |
| `historique_fiche(ficheId)`                           | Simple           | Historique d'une fiche            |
| `sections_modele(modeleId)`                           | Simple           | Chargement sections par modèle    |
| `champs_modele(sectionId)`                            | Simple           | Chargement champs par section     |

### Numérotation automatique des fiches

- **Format** : `FC-{ANNÉE}-{SÉQUENCE_5_CHIFFRES}`
- **Exemple** : `FC-2026-00042`
- **Implémentation** : compteur atomique en transaction Prisma

```typescript
// Pseudo-code de génération du numéro
async function genererNumero(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    const derniere = await tx.ficheControle.findFirst({
      where: { numero: { startsWith: `FC-${annee}-` } },
      orderBy: { numero: 'desc' },
    });
    const sequence = derniere ? parseInt(derniere.numero.split('-')[2]) + 1 : 1;
    return `FC-${annee}-${sequence.toString().padStart(5, '0')}`;
  });
}
```

### Fichiers uploadés

| Aspect       | Stratégie                                                |
| ------------ | -------------------------------------------------------- |
| Stockage     | Système de fichiers local : `/uploads/{ficheId}/`        |
| En base      | Seule la référence (chemin relatif) est stockée          |
| Taille max   | 10 Mo par fichier                                        |
| Types        | Images (jpg, png), PDF                                    |
| Évolution    | Migration future vers stockage objet (S3/MinIO)          |

### Audit trail

Table `historique_fiche` enregistrant chaque changement :

```json
{
  "ficheId": "clx...",
  "userId": "clx...",
  "action": "MODIFICATION",
  "details": {
    "champsModifies": [
      {
        "champId": "clx...",
        "label": "Pénétrabilité à 25°C",
        "ancienneValeur": 55,
        "nouvelleValeur": 58
      }
    ]
  },
  "createdAt": "2026-02-12T10:30:00Z"
}
```

---

## 7) Stratégie Sécurité

### Mesures par couche

| Couche                    | Mesure                                                        |
| ------------------------- | ------------------------------------------------------------- |
| **Transport**             | HTTPS obligatoire (TLS 1.2+)                                 |
| **Authentification**      | JWT en cookie HttpOnly/Secure/SameSite=Strict                 |
| **Autorisation**          | Vérification rôle ET propriété de la ressource par endpoint   |
| **Validation entrées**    | Zod sur chaque payload API (types, longueurs, formats)        |
| **Injection SQL**         | Impossible via Prisma (requêtes paramétrées)                  |
| **XSS**                   | React échappe par défaut + CSP headers                        |
| **CSRF**                  | Cookie SameSite=Strict + vérification Origin header           |
| **Rate limiting**         | Limite sur `/api/auth/login` (5 tentatives / minute / IP)     |
| **Mots de passe**         | bcrypt (12 rounds), politique de complexité minimale           |
| **Données sensibles**     | `.env` hors du repo, secrets jamais exposés côté client        |
| **Headers de sécurité**   | Via `next.config.js` (voir ci-dessous)                        |

### Headers de sécurité (next.config.js)

```javascript
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

### Pipeline de sécurité (ordre d'exécution)

```
Requête entrante
  │
  ├─ 1. Vérification des headers de sécurité
  ├─ 2. Rate limiting (routes /api/auth/*)
  ├─ 3. Extraction + vérification JWT depuis le cookie
  ├─ 4. Résolution du rôle utilisateur
  ├─ 5. Vérification ACL par pattern de route
  ├─ 6. Validation Zod du body de la requête
  └─ 7. Exécution du Route Handler
```

### Politique des mots de passe

| Règle              | Valeur                  |
| ------------------ | ----------------------- |
| Longueur minimale  | 8 caractères            |
| Majuscule          | Au moins 1              |
| Minuscule          | Au moins 1              |
| Chiffre            | Au moins 1              |
| Caractère spécial  | Au moins 1              |
| Hash               | bcrypt, 12 salt rounds  |

---

## 8) Évolutivité Future

### Court terme (prévu dans l'architecture)

| Fonctionnalité                   | Préparation                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| **Export PDF**                    | Service isolé `pdf.service.ts`, template React-PDF          |
| **Tableaux de bord statistiques**| Requêtes agrégées Prisma, composants Chart séparés           |
| **Notifications**                | Table `notifications` prête, polling ou Server-Sent Events   |
| **Multi-produits**               | Champ `produitType` sur le modèle permet le filtrage         |

### Moyen terme (extensible sans refactoring majeur)

| Fonctionnalité                            | Approche                                           |
| ----------------------------------------- | -------------------------------------------------- |
| **Workflow d'approbation multi-niveaux**  | Machine à états sur le statut (xstate)              |
| **API mobile**                            | Les Route Handlers servent déjà de REST API         |
| **Import/export Excel**                   | Service dédié avec `exceljs`                        |
| **Signature électronique**                | Champ signature (base64 canvas) sur la validation   |
| **Multi-sites**                           | Entité `Site` + `siteId` sur fiches et utilisateurs |

### Long terme (migration possible)

| Évolution              | Chemin                                                          |
| ---------------------- | --------------------------------------------------------------- |
| **Microservices**      | Extraire PDF, notifications en services indépendants            |
| **Stockage objet**     | Remplacer filesystem par MinIO/S3 via interface abstraite        |
| **SSO / LDAP**         | Ajouter un provider d'auth sans toucher à la logique métier      |
| **Internationalisation** | `next-intl`, labels de champs déjà dynamiques en base          |

---

## 9) Diagramme de Flux Principal

### Cycle de vie d'une fiche de contrôle

```
                    ┌─────────────┐
                    │  BROUILLON  │
                    └──────┬──────┘
                           │ Contrôleur soumet
                           ▼
                    ┌─────────────┐
        ┌───────── │   SOUMISE   │ ─────────┐
        │          └─────────────┘          │
        │ Admin rejette              Admin valide
        ▼                                   ▼
 ┌─────────────┐                    ┌─────────────┐
 │   REJETÉE   │                    │   VALIDÉE   │
 └──────┬──────┘                    └─────────────┘
        │ Contrôleur                    (archivée,
        │ corrige et                  export PDF OK)
        │ re-soumet
        ▼
 ┌─────────────┐
 │   SOUMISE   │ ──── (cycle reprend)
 └─────────────┘
```

### Flux utilisateur complet

```
Contrôleur                              Admin
    │                                     │
    ├── Se connecte                       ├── Se connecte
    │                                     │
    ├── Crée une fiche                    ├── Gère les modèles de fiches
    │   (sélection du modèle)             │   (créer, modifier, activer/désactiver)
    │                                     │
    ├── Remplit les sections              ├── Gère les utilisateurs
    │   (sauvegarde brouillon auto)       │   (créer, modifier, désactiver)
    │                                     │
    ├── Soumet la fiche ───────────────▶  │
    │                                     ├── Revoit la fiche soumise
    │                                     ├── Valide OU Rejette
    │   ◀──── Notification ────────────── │   (avec commentaire)
    │                                     │
    ├── Si rejetée : corrige              │
    │   et re-soumet                      │
    │                                     │
    └── Fiche validée = archivée          ├── Consulte les statistiques
        (PDF exportable)                  └── Exporte les données
```

---

## 10) Résumé des Choix Architecturaux

| Décision                        | Justification                                                    |
| ------------------------------- | ---------------------------------------------------------------- |
| Monorepo Next.js                | App interne, équipe réduite, pas besoin de découpler front/back  |
| Modèles dynamiques en BDD      | Évite de modifier le code à chaque nouveau type de fiche         |
| Cookie HttpOnly vs localStorage | Sécurité contre XSS, adapté à une app interne                   |
| Zod pour la validation          | Partage de schémas entre front et back, inférence TypeScript     |
| Service layer séparé            | Testabilité, réutilisabilité, séparation des responsabilités     |
| Audit trail                     | Traçabilité exigée dans un contexte qualité industrielle (ISO 9001) |
| Prisma comme ORM                | Type-safety, migrations automatiques, requêtes paramétrées       |
| TailwindCSS                     | Prototypage rapide, design system cohérent, pas de CSS custom    |

---

## 11) Dépendances du Projet

### Dependencies principales

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@prisma/client": "^5.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "zod": "^3.x",
  "tailwindcss": "^3.x"
}
```

### DevDependencies

```json
{
  "typescript": "^5.x",
  "prisma": "^5.x",
  "@types/node": "^20.x",
  "@types/react": "^18.x",
  "@types/jsonwebtoken": "^9.x",
  "@types/bcryptjs": "^2.x",
  "autoprefixer": "^10.x",
  "postcss": "^8.x"
}
```

---

> **Ce document sert de référence technique pour l'implémentation.**
> Phase suivante : génération du code en commençant par le schéma Prisma et la configuration du projet.
