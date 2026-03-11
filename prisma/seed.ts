// ============================================================================
// SEED PRISMA — Données initiales pour le développement
// Exécuter avec : npx prisma db seed
// ============================================================================

import { PrismaClient, Role, StatutControle, ActionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation des données...\n');

  // ────────────────────────────────────────────
  // 1. UTILISATEURS
  // ────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('Admin@2026', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@entreprise.com' },
    update: {},
    create: {
      email: 'admin@entreprise.com',
      password: passwordHash,
      nom: 'Dupont',
      prenom: 'Jean',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin créé : ${admin.prenom} ${admin.nom} (${admin.email})`);

  const controleur = await prisma.user.upsert({
    where: { email: 'controleur@entreprise.com' },
    update: {},
    create: {
      email: 'controleur@entreprise.com',
      password: await bcrypt.hash('Ctrl@2026', 12),
      nom: 'Martin',
      prenom: 'Sophie',
      role: Role.CONTROLEUR,
    },
  });
  console.log(`✅ Contrôleur créé : ${controleur.prenom} ${controleur.nom} (${controleur.email})`);

  const controleur2 = await prisma.user.upsert({
    where: { email: 'labo@entreprise.com' },
    update: {},
    create: {
      email: 'labo@entreprise.com',
      password: await bcrypt.hash('Labo@2026', 12),
      nom: 'Bernard',
      prenom: 'Karim',
      role: Role.CONTROLEUR,
    },
  });
  console.log(`✅ Contrôleur créé : ${controleur2.prenom} ${controleur2.nom} (${controleur2.email})`);

  // ────────────────────────────────────────────
  // 2. FICHES DE CONTRÔLE QUALITÉ
  // ────────────────────────────────────────────

  // Fiche 1 — VALIDÉE
  const fiche1 = await prisma.qualityControl.create({
    data: {
      numero: 'FC-2026-00001',
      titre: 'Contrôle Bitume Routier 50/70 — Lot B2026-001',
      produit: 'BITUME_ROUTIER',
      statut: StatutControle.VALIDE,
      commentaire: 'Tous les essais sont conformes. Lot libéré.',
      createdById: controleur.id,
      validatedById: admin.id,
      dateSoumission: new Date('2026-01-15T09:00:00Z'),
      dateDecision: new Date('2026-01-15T14:30:00Z'),

      sections: {
        create: [
          {
            titre: 'Identification de l\'échantillon',
            ordre: 0,
            donnees: {
              champs: [
                { label: 'Référence lot', type: 'TEXT', valeur: 'B2026-001' },
                { label: 'Date de prélèvement', type: 'DATE', valeur: '2026-01-15' },
                { label: 'Lieu de prélèvement', type: 'TEXT', valeur: 'Cuve stockage N°3' },
                { label: 'Grade', type: 'SELECT', valeur: '50/70', options: ['35/50', '50/70', '70/100'] },
                { label: 'Température de stockage', type: 'NUMBER', valeur: 155, unite: '°C' },
              ],
            },
          },
          {
            titre: 'Essais physiques',
            ordre: 1,
            donnees: {
              champs: [
                { label: 'Pénétrabilité à 25°C', type: 'NUMBER', valeur: 58, unite: '1/10 mm', min: 50, max: 70, conforme: true },
                { label: 'Point de ramollissement TBA', type: 'NUMBER', valeur: 49, unite: '°C', min: 46, max: 54, conforme: true },
                { label: 'Point d\'éclair', type: 'NUMBER', valeur: 260, unite: '°C', min: 230, max: null, conforme: true },
                { label: 'Densité relative 25/25', type: 'NUMBER', valeur: 1.03, unite: '', min: 1.00, max: 1.10, conforme: true },
              ],
            },
          },
          {
            titre: 'Conclusion',
            ordre: 2,
            donnees: {
              champs: [
                { label: 'Conformité globale', type: 'BOOLEAN', valeur: true },
                { label: 'Observations', type: 'TEXT', valeur: 'Échantillon conforme à la norme EN 12591.' },
              ],
            },
          },
        ],
      },

      validationLogs: {
        create: [
          { action: ActionType.CREATION, userId: controleur.id, details: { message: 'Création de la fiche' } },
          { action: ActionType.SOUMISSION, userId: controleur.id, details: { message: 'Soumission pour validation' } },
          { action: ActionType.VALIDATION, userId: admin.id, details: { message: 'Fiche validée', commentaire: 'Lot libéré.' } },
        ],
      },
    },
  });
  console.log(`✅ Fiche créée : ${fiche1.numero} (${fiche1.statut})`);

  // Fiche 2 — EN ATTENTE
  const fiche2 = await prisma.qualityControl.create({
    data: {
      numero: 'FC-2026-00002',
      titre: 'Contrôle Émulsion Cationique — Lot E2026-010',
      produit: 'EMULSION',
      statut: StatutControle.EN_ATTENTE,
      createdById: controleur2.id,
      dateSoumission: new Date('2026-02-10T08:30:00Z'),

      sections: {
        create: [
          {
            titre: 'Identification',
            ordre: 0,
            donnees: {
              champs: [
                { label: 'Référence lot', type: 'TEXT', valeur: 'E2026-010' },
                { label: 'Type d\'émulsion', type: 'SELECT', valeur: 'ECR 65', options: ['ECR 65', 'ECR 69', 'ECL 65'] },
                { label: 'Date de fabrication', type: 'DATE', valeur: '2026-02-09' },
              ],
            },
          },
          {
            titre: 'Essais',
            ordre: 1,
            donnees: {
              champs: [
                { label: 'Teneur en liant', type: 'NUMBER', valeur: 65.2, unite: '%', min: 64, max: 66, conforme: true },
                { label: 'pH', type: 'NUMBER', valeur: 3.5, unite: '', min: 2.0, max: 5.0, conforme: true },
                { label: 'Viscosité STV', type: 'NUMBER', valeur: 45, unite: 's', min: 15, max: 60, conforme: true },
              ],
            },
          },
        ],
      },

      validationLogs: {
        create: [
          { action: ActionType.CREATION, userId: controleur2.id, details: { message: 'Création de la fiche' } },
          { action: ActionType.SOUMISSION, userId: controleur2.id, details: { message: 'Soumission pour validation' } },
        ],
      },
    },
  });
  console.log(`✅ Fiche créée : ${fiche2.numero} (${fiche2.statut})`);

  // Fiche 3 — REFUSÉE
  const fiche3 = await prisma.qualityControl.create({
    data: {
      numero: 'FC-2026-00003',
      titre: 'Contrôle Bitume Modifié — Lot BM2026-005',
      produit: 'BITUME_MODIFIE',
      statut: StatutControle.REFUSE,
      commentaire: 'Pénétrabilité hors tolérance. Reprendre les essais après ajustement.',
      createdById: controleur.id,
      validatedById: admin.id,
      dateSoumission: new Date('2026-02-08T10:00:00Z'),
      dateDecision: new Date('2026-02-08T16:00:00Z'),

      sections: {
        create: [
          {
            titre: 'Identification',
            ordre: 0,
            donnees: {
              champs: [
                { label: 'Référence lot', type: 'TEXT', valeur: 'BM2026-005' },
                { label: 'Grade', type: 'SELECT', valeur: '25/55-55A', options: ['25/55-55A', '45/80-65', '40/100-65'] },
              ],
            },
          },
          {
            titre: 'Essais physiques',
            ordre: 1,
            donnees: {
              champs: [
                { label: 'Pénétrabilité à 25°C', type: 'NUMBER', valeur: 22, unite: '1/10 mm', min: 25, max: 55, conforme: false },
                { label: 'Point de ramollissement TBA', type: 'NUMBER', valeur: 58, unite: '°C', min: 55, max: 63, conforme: true },
                { label: 'Retour élastique', type: 'NUMBER', valeur: 72, unite: '%', min: 70, max: null, conforme: true },
              ],
            },
          },
        ],
      },

      validationLogs: {
        create: [
          { action: ActionType.CREATION, userId: controleur.id, details: { message: 'Création de la fiche' } },
          { action: ActionType.SOUMISSION, userId: controleur.id, details: { message: 'Soumission pour validation' } },
          { action: ActionType.REJET, userId: admin.id, details: { commentaire: 'Pénétrabilité hors tolérance.' } },
        ],
      },
    },
  });
  console.log(`✅ Fiche créée : ${fiche3.numero} (${fiche3.statut})`);

  // Fiche 4 — BROUILLON
  const fiche4 = await prisma.qualityControl.create({
    data: {
      numero: 'FC-2026-00004',
      titre: 'Contrôle Membrane Bitumineuse — Lot M2026-018',
      produit: 'MEMBRANE',
      statut: StatutControle.BROUILLON,
      createdById: controleur.id,

      sections: {
        create: [
          {
            titre: 'Identification',
            ordre: 0,
            donnees: {
              champs: [
                { label: 'Référence lot', type: 'TEXT', valeur: 'M2026-018' },
                { label: 'Type de membrane', type: 'SELECT', valeur: 'APP', options: ['APP', 'SBS'] },
              ],
            },
          },
        ],
      },

      validationLogs: {
        create: [
          { action: ActionType.CREATION, userId: controleur.id, details: { message: 'Création de la fiche — brouillon' } },
        ],
      },
    },
  });
  console.log(`✅ Fiche créée : ${fiche4.numero} (${fiche4.statut})`);

  // ────────────────────────────────────────────
  // Résumé
  // ────────────────────────────────────────────
  console.log('\n────────────────────────────────────');
  console.log('🎉 Seed terminé avec succès !');
  console.log('────────────────────────────────────');
  console.log(`   Utilisateurs : 3`);
  console.log(`   Fiches       : 4`);
  console.log('────────────────────────────────────');
  console.log('\n📧 Comptes de test :');
  console.log('   Admin       → admin@entreprise.com      / Admin@2026');
  console.log('   Contrôleur  → controleur@entreprise.com / Ctrl@2026');
  console.log('   Contrôleur  → labo@entreprise.com       / Labo@2026');
  console.log('────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
