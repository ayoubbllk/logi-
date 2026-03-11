-- ============================================================================
-- SCRIPT SQL ÉQUIVALENT AU SCHÉMA PRISMA
-- Base de données : MySQL 8.x
-- Application : Gestion des Fiches de Contrôle Qualité
-- ============================================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS controle_qualite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE controle_qualite;

-- ============================================================================
-- TABLE : users
-- ============================================================================

CREATE TABLE `users` (
  `id`        VARCHAR(30)  NOT NULL,
  `email`     VARCHAR(191) NOT NULL,
  `password`  VARCHAR(191) NOT NULL,
  `nom`       VARCHAR(191) NOT NULL,
  `prenom`    VARCHAR(191) NOT NULL,
  `role`      ENUM('ADMIN', 'CONTROLEUR') NOT NULL DEFAULT 'CONTROLEUR',
  `estActif`  BOOLEAN      NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_key` (`email`),
  INDEX `users_role_estActif_idx` (`role`, `estActif`),
  INDEX `users_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE : quality_controls
-- ============================================================================

CREATE TABLE `quality_controls` (
  `id`              VARCHAR(30)  NOT NULL,
  `numero`          VARCHAR(191) NOT NULL,
  `titre`           VARCHAR(191) NOT NULL,
  `produit`         VARCHAR(191) NOT NULL,
  `statut`          ENUM('EN_ATTENTE', 'VALIDE', 'REFUSE', 'BROUILLON') NOT NULL DEFAULT 'BROUILLON',
  `commentaire`     TEXT         NULL,
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL,
  `dateSoumission`  DATETIME(3)  NULL,
  `dateDecision`    DATETIME(3)  NULL,
  `createdById`     VARCHAR(30)  NOT NULL,
  `validatedById`   VARCHAR(30)  NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `quality_controls_numero_key` (`numero`),
  INDEX `quality_controls_statut_createdById_createdAt_idx` (`statut`, `createdById`, `createdAt`),
  INDEX `quality_controls_createdById_idx` (`createdById`),
  INDEX `quality_controls_validatedById_idx` (`validatedById`),
  INDEX `quality_controls_produit_idx` (`produit`),
  INDEX `quality_controls_createdAt_idx` (`createdAt`),

  CONSTRAINT `quality_controls_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `quality_controls_validatedById_fkey`
    FOREIGN KEY (`validatedById`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE : section_data
-- ============================================================================

CREATE TABLE `section_data` (
  `id`                 VARCHAR(30)  NOT NULL,
  `titre`              VARCHAR(191) NOT NULL,
  `ordre`              INT          NOT NULL,
  `donnees`            JSON         NOT NULL,
  `createdAt`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`          DATETIME(3)  NOT NULL,
  `qualityControlId`   VARCHAR(30)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `section_data_qualityControlId_ordre_idx` (`qualityControlId`, `ordre`),
  INDEX `section_data_qualityControlId_idx` (`qualityControlId`),

  CONSTRAINT `section_data_qualityControlId_fkey`
    FOREIGN KEY (`qualityControlId`) REFERENCES `quality_controls` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE : validation_logs
-- ============================================================================

CREATE TABLE `validation_logs` (
  `id`                 VARCHAR(30)  NOT NULL,
  `action`             ENUM('CREATION', 'MODIFICATION', 'SOUMISSION', 'VALIDATION', 'REJET') NOT NULL,
  `details`            JSON         NULL,
  `createdAt`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `qualityControlId`   VARCHAR(30)  NOT NULL,
  `userId`             VARCHAR(30)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `validation_logs_qualityControlId_createdAt_idx` (`qualityControlId`, `createdAt`),
  INDEX `validation_logs_userId_idx` (`userId`),
  INDEX `validation_logs_action_idx` (`action`),

  CONSTRAINT `validation_logs_qualityControlId_fkey`
    FOREIGN KEY (`qualityControlId`) REFERENCES `quality_controls` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `validation_logs_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DONNÉES INITIALES (seed)
-- ============================================================================

-- Administrateur par défaut
-- Mot de passe : Admin@2026 (hash bcrypt 12 rounds)
INSERT INTO `users` (`id`, `email`, `password`, `nom`, `prenom`, `role`, `estActif`, `createdAt`, `updatedAt`)
VALUES (
  'admin_initial_001',
  'admin@entreprise.com',
  '$2b$12$LJ3m4ys3GZhkF8OhQ1PxzuUVm5E9f3q4N6vKjRk8Y7wX2cA0S1dKe',
  'Administrateur',
  'Système',
  'ADMIN',
  TRUE,
  NOW(3),
  NOW(3)
);

-- Contrôleur de test
INSERT INTO `users` (`id`, `email`, `password`, `nom`, `prenom`, `role`, `estActif`, `createdAt`, `updatedAt`)
VALUES (
  'ctrl_initial_001',
  'controleur@entreprise.com',
  '$2b$12$LJ3m4ys3GZhkF8OhQ1PxzuUVm5E9f3q4N6vKjRk8Y7wX2cA0S1dKe',
  'Martin',
  'Sophie',
  'CONTROLEUR',
  TRUE,
  NOW(3),
  NOW(3)
);

-- ============================================================================
-- VUES UTILES (optionnel)
-- ============================================================================

-- Vue : fiches avec informations utilisateur
CREATE OR REPLACE VIEW `v_fiches_avec_utilisateurs` AS
SELECT
  qc.id,
  qc.numero,
  qc.titre,
  qc.produit,
  qc.statut,
  qc.createdAt,
  qc.dateSoumission,
  qc.dateDecision,
  qc.commentaire,
  CONCAT(uc.prenom, ' ', uc.nom) AS createur,
  uc.email AS email_createur,
  CONCAT(uv.prenom, ' ', uv.nom) AS validateur,
  uv.email AS email_validateur,
  (SELECT COUNT(*) FROM section_data sd WHERE sd.qualityControlId = qc.id) AS nb_sections
FROM quality_controls qc
  LEFT JOIN users uc ON qc.createdById = uc.id
  LEFT JOIN users uv ON qc.validatedById = uv.id
ORDER BY qc.createdAt DESC;

-- Vue : statistiques par statut
CREATE OR REPLACE VIEW `v_statistiques_statut` AS
SELECT
  statut,
  COUNT(*) AS nombre,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM quality_controls), 1) AS pourcentage
FROM quality_controls
GROUP BY statut;

-- Vue : activité récente (journal)
CREATE OR REPLACE VIEW `v_activite_recente` AS
SELECT
  vl.id,
  vl.action,
  vl.createdAt,
  qc.numero,
  qc.titre,
  CONCAT(u.prenom, ' ', u.nom) AS utilisateur,
  u.role
FROM validation_logs vl
  JOIN quality_controls qc ON vl.qualityControlId = qc.id
  JOIN users u ON vl.userId = u.id
ORDER BY vl.createdAt DESC
LIMIT 100;
