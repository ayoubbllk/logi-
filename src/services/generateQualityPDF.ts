// ============================================================================
// SERVICE — Génération de PDF pour fiche de contrôle qualité
// Utilise jsPDF + jspdf-autotable
// Mise en page A4 professionnelle, multi-pages, sections dynamiques
// ============================================================================

import jsPDF from 'jspdf';
import autoTable, { type UserOptions, type RowInput } from 'jspdf-autotable';
import { SECTIONS_FIELDS } from '@/config/sections-fields';
import type { FicheValidationDetail } from '@/types/validation.types';
import type { FicheComplete } from '@/types/fiche.types';

// ── Types internes ──

type FicheForPDF = FicheValidationDetail | FicheComplete;

interface PDFConfig {
  margin: { top: number; right: number; bottom: number; left: number };
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  colors: {
    primary: [number, number, number];
    primaryLight: [number, number, number];
    headerBg: [number, number, number];
    headerText: [number, number, number];
    sectionBg: [number, number, number];
    textDark: [number, number, number];
    textMuted: [number, number, number];
    border: [number, number, number];
    success: [number, number, number];
    danger: [number, number, number];
    warning: [number, number, number];
    white: [number, number, number];
  };
  fontSize: {
    title: number;
    subtitle: number;
    sectionTitle: number;
    normal: number;
    small: number;
    tiny: number;
  };
  entreprise: {
    nom: string;
    sousTitre: string;
  };
}

// ── Configuration par défaut ──

const CONFIG: PDFConfig = {
  margin: { top: 20, right: 20, bottom: 30, left: 20 },
  pageWidth: 210,   // A4 mm
  pageHeight: 297,
  contentWidth: 170, // 210 - 20 - 20
  colors: {
    primary:      [37, 99, 235],     // blue-600
    primaryLight: [219, 234, 254],   // blue-100
    headerBg:     [30, 41, 59],      // slate-800
    headerText:   [255, 255, 255],
    sectionBg:    [241, 245, 249],   // slate-100
    textDark:     [15, 23, 42],      // slate-900
    textMuted:    [100, 116, 139],   // slate-500
    border:       [203, 213, 225],   // slate-300
    success:      [22, 163, 74],     // green-600
    danger:       [220, 38, 38],     // red-600
    warning:      [217, 119, 6],     // amber-600
    white:        [255, 255, 255],
  },
  fontSize: {
    title: 18,
    subtitle: 11,
    sectionTitle: 12,
    normal: 10,
    small: 9,
    tiny: 7,
  },
  entreprise: {
    nom: 'NAFTAL — Division Bitumes',
    sousTitre: 'Système de Gestion de la Qualité',
  },
};

// ── Map des titres vers sectionId ──

const SECTION_TITLE_TO_ID: Record<string, string> = {
  'Bitumes oxydés': 'bitumes_oxydes',
  'Bitumes fluidifiés': 'bitumes_fluidifies',
  'Bitumes modifiés': 'bitumes_modifies',
  'Produits finis traditionnels': 'produits_finis_traditionnels',
  'Produits finis membranes': 'produits_finis_membranes',
  'Émulsions stabilisées': 'emulsions_stabilisees',
};

// ── Labels de statut ──

const STATUT_LABELS: Record<string, { label: string; color: [number, number, number] }> = {
  EN_ATTENTE: { label: 'En attente de validation', color: CONFIG.colors.warning },
  VALIDE:     { label: 'Validée',                  color: CONFIG.colors.success },
  REFUSE:     { label: 'Refusée',                  color: CONFIG.colors.danger },
  BROUILLON:  { label: 'Brouillon',                color: CONFIG.colors.textMuted },
};

// ============================================================================
// FONCTION PRINCIPALE — generateQualityControlPDF
// ============================================================================

export async function generateQualityControlPDF(fiche: FicheForPDF): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = CONFIG.margin.top;

  // ── 1. EN-TÊTE ──
  y = drawHeader(doc, fiche, y);

  // ── 2. INFORMATIONS GÉNÉRALES ──
  y = drawGeneralInfo(doc, fiche, y);

  // ── 3. SECTIONS DE DONNÉES ──
  y = drawSections(doc, fiche, y);

  // ── 4. PIED DE PAGE (signature / validation) ──
  y = drawFooterBlock(doc, fiche, y);

  // ── 5. Numéros de pages ──
  drawPageNumbers(doc);

  // ── 6. Téléchargement ──
  const filename = `${sanitizeFilename(fiche.numero)}_${formatDateFile(new Date())}.pdf`;
  doc.save(filename);
}

// ============================================================================
// DESSIN — En-tête
// ============================================================================

function drawHeader(doc: jsPDF, fiche: FicheForPDF, startY: number): number {
  let y = startY;
  const { margin, contentWidth, colors, fontSize, entreprise } = CONFIG;

  // Bande colorée en haut
  doc.setFillColor(...colors.headerBg);
  doc.rect(0, 0, CONFIG.pageWidth, 42, 'F');

  // Logo placeholder (carré arrondi)
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin.left, 8, 12, 12, 2, 2, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('QC', margin.left + 6, 16, { align: 'center' });

  // Nom entreprise
  doc.setTextColor(...colors.headerText);
  doc.setFontSize(fontSize.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(entreprise.nom, margin.left + 16, 12);

  // Sous-titre
  doc.setFontSize(fontSize.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 190, 210);
  doc.text(entreprise.sousTitre, margin.left + 16, 17);

  // Titre principal
  doc.setTextColor(...colors.headerText);
  doc.setFontSize(fontSize.title);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHE DE CONTROLE QUALITE', margin.left, 32);

  // Numéro en haut à droite
  doc.setFontSize(fontSize.normal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primaryLight);
  doc.text(fiche.numero, margin.left + contentWidth, 12, { align: 'right' });

  // Date
  doc.setFontSize(fontSize.tiny);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Edite le ${formatDateFull(new Date())}`,
    margin.left + contentWidth,
    17,
    { align: 'right' }
  );

  // Statut badge
  const statutInfo = STATUT_LABELS[fiche.statut] ?? STATUT_LABELS.BROUILLON;
  const statutText = statutInfo.label;
  const statusWidth = doc.getTextWidth(statutText) + 8;
  const statusX = margin.left + contentWidth - statusWidth;

  doc.setFillColor(...statutInfo.color);
  doc.roundedRect(statusX, 24, statusWidth, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(fontSize.small);
  doc.setFont('helvetica', 'bold');
  doc.text(statutText, statusX + statusWidth / 2, 29, { align: 'center' });

  y = 50;
  return y;
}

// ============================================================================
// DESSIN — Informations générales (tableau récap)
// ============================================================================

function drawGeneralInfo(doc: jsPDF, fiche: FicheForPDF, startY: number): number {
  let y = startY;
  const { margin, colors, fontSize } = CONFIG;

  // Titre de section
  y = drawSectionTitle(doc, 'INFORMATIONS GENERALES', y);

  const controleur = `${fiche.createdBy.prenom} ${fiche.createdBy.nom}`;
  const dateSoumission = fiche.dateSoumission
    ? formatDateFull(new Date(fiche.dateSoumission))
    : '—';
  const dateCreation = formatDateFull(new Date(fiche.createdAt));

  const infoRows: RowInput[] = [
    ['Titre de la fiche', fiche.titre],
    ['Produit', fiche.produit],
    ['Numero de fiche', fiche.numero],
    ['Controleur', controleur],
    ['Date de creation', dateCreation],
    ['Date de soumission', dateSoumission],
    ['Statut', (STATUT_LABELS[fiche.statut] ?? STATUT_LABELS.BROUILLON).label],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: infoRows,
    theme: 'plain',
    margin: { left: margin.left, right: margin.right },
    styles: {
      fontSize: fontSize.normal,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      textColor: colors.textDark,
      lineColor: colors.border,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 55,
        fillColor: colors.sectionBg,
        textColor: colors.textDark,
      },
      1: {
        cellWidth: 'auto',
      },
    },
    didParseCell: (data) => {
      // Coloriser le statut
      if (data.row.index === 6 && data.column.index === 1) {
        const statutInfo = STATUT_LABELS[fiche.statut];
        if (statutInfo) {
          data.cell.styles.textColor = statutInfo.color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  return y;
}

// ============================================================================
// DESSIN — Sections dynamiques (AutoTable par section)
// ============================================================================

function drawSections(doc: jsPDF, fiche: FicheForPDF, startY: number): number {
  let y = startY;

  // Trier les sections par ordre
  const sortedSections = [...fiche.sections].sort((a, b) => a.ordre - b.ordre);

  for (const section of sortedSections) {
    const sectionId = SECTION_TITLE_TO_ID[section.titre] ?? null;
    const fieldsDef = sectionId ? SECTIONS_FIELDS[sectionId] : null;
    const donnees = section.donnees as Record<string, unknown>;

    // Filtrer les entrées non vides
    const entries = Object.entries(donnees).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );

    if (entries.length === 0) continue;

    // Vérification espace restant — saut de page si nécessaire
    if (y + 30 > CONFIG.pageHeight - CONFIG.margin.bottom) {
      doc.addPage();
      y = CONFIG.margin.top;
    }

    // Titre de section
    y = drawSectionTitle(doc, section.titre.toUpperCase(), y);

    // Construire les lignes du tableau
    const tableBody: RowInput[] = entries.map(([key, value]) => {
      const field = fieldsDef?.fields.find((f) => f.name === key);
      const label = field?.label ?? formatFieldName(key);
      const unite = field?.unite;
      const displayValue = formatValue(value, field?.type, unite);

      return [label, displayValue];
    });

    autoTable(doc, {
      startY: y,
      head: [['Parametre', 'Valeur']],
      body: tableBody,
      theme: 'striped',
      margin: { left: CONFIG.margin.left, right: CONFIG.margin.right },
      headStyles: {
        fillColor: CONFIG.colors.primary,
        textColor: CONFIG.colors.white,
        fontStyle: 'bold',
        fontSize: CONFIG.fontSize.small,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        halign: 'left',
      },
      bodyStyles: {
        fontSize: CONFIG.fontSize.normal,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        textColor: CONFIG.colors.textDark,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: {
          cellWidth: 70,
          fontStyle: 'bold',
        },
        1: {
          cellWidth: 'auto',
        },
      },
      didParseCell: (data) => {
        // Coloriser le résultat de conformité
        if (data.section === 'body' && data.column.index === 1) {
          const rawValue = entries[data.row.index]?.[1];
          if (rawValue === 'Conforme' || rawValue === 'Oui' || rawValue === true) {
            data.cell.styles.textColor = CONFIG.colors.success;
            data.cell.styles.fontStyle = 'bold';
          } else if (rawValue === 'Non conforme' || rawValue === 'Non' || rawValue === false) {
            data.cell.styles.textColor = CONFIG.colors.danger;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    } as UserOptions);

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  return y;
}

// ============================================================================
// DESSIN — Bloc de validation et signature
// ============================================================================

function drawFooterBlock(doc: jsPDF, fiche: FicheForPDF, startY: number): number {
  let y = startY;
  const { margin, contentWidth, colors, fontSize } = CONFIG;

  // Vérification espace — saut de page si nécessaire
  if (y + 55 > CONFIG.pageHeight - CONFIG.margin.bottom) {
    doc.addPage();
    y = CONFIG.margin.top;
  }

  // Séparateur
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + contentWidth, y);
  y += 6;

  // Titre
  y = drawSectionTitle(doc, 'VALIDATION ET SIGNATURE', y);

  const hasValidation = fiche.validatedBy !== null && fiche.validatedBy !== undefined;

  if (hasValidation) {
    const validateur = `${fiche.validatedBy!.prenom} ${fiche.validatedBy!.nom}`;
    const dateDecision = fiche.dateDecision
      ? formatDateFull(new Date(fiche.dateDecision))
      : '—';
    const statutInfo = STATUT_LABELS[fiche.statut] ?? STATUT_LABELS.BROUILLON;

    const validationRows: RowInput[] = [
      ['Decision', statutInfo.label],
      ['Validateur', validateur],
      ['Date de decision', dateDecision],
    ];

    if (fiche.commentaire) {
      validationRows.push(['Commentaire', fiche.commentaire]);
    }

    autoTable(doc, {
      startY: y,
      head: [],
      body: validationRows,
      theme: 'plain',
      margin: { left: margin.left, right: margin.right },
      styles: {
        fontSize: fontSize.normal,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        textColor: colors.textDark,
        lineColor: colors.border,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: {
          fontStyle: 'bold',
          cellWidth: 55,
          fillColor: colors.sectionBg,
        },
        1: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.row.index === 0 && data.column.index === 1) {
          data.cell.styles.textColor = statutInfo.color;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    // Pas encore validé — afficher les emplacements signature
    doc.setFontSize(fontSize.small);
    doc.setTextColor(...colors.textMuted);
    doc.text('Cette fiche n\'a pas encore ete validee.', margin.left, y);
    y += 10;
  }

  // Bloc signature (toujours affiché)
  const sigBoxWidth = contentWidth / 2 - 5;
  const sigBoxHeight = 25;

  // Signature contrôleur
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.rect(margin.left, y, sigBoxWidth, sigBoxHeight);
  doc.setFontSize(fontSize.tiny);
  doc.setTextColor(...colors.textMuted);
  doc.text('Signature du controleur', margin.left + 3, y + 4);
  doc.setFontSize(fontSize.small);
  doc.setTextColor(...colors.textDark);
  doc.text(
    `${fiche.createdBy.prenom} ${fiche.createdBy.nom}`,
    margin.left + 3,
    y + 10
  );

  // Signature validateur
  const sigBoxX2 = margin.left + sigBoxWidth + 10;
  doc.setDrawColor(...colors.border);
  doc.rect(sigBoxX2, y, sigBoxWidth, sigBoxHeight);
  doc.setFontSize(fontSize.tiny);
  doc.setTextColor(...colors.textMuted);
  doc.text('Signature du validateur', sigBoxX2 + 3, y + 4);
  if (hasValidation) {
    doc.setFontSize(fontSize.small);
    doc.setTextColor(...colors.textDark);
    doc.text(
      `${fiche.validatedBy!.prenom} ${fiche.validatedBy!.nom}`,
      sigBoxX2 + 3,
      y + 10
    );
  }

  y += sigBoxHeight + 8;

  // Mention légale
  doc.setFontSize(CONFIG.fontSize.tiny);
  doc.setTextColor(...colors.textMuted);
  doc.text(
    'Document genere automatiquement par le systeme QC Manager. Ce document est confidentiel.',
    CONFIG.pageWidth / 2,
    y,
    { align: 'center' }
  );

  return y + 5;
}

// ============================================================================
// DESSIN — Numéros de page
// ============================================================================

function drawPageNumbers(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(CONFIG.fontSize.tiny);
    doc.setTextColor(...CONFIG.colors.textMuted);

    // Page X/Y à droite
    doc.text(
      `Page ${i}/${totalPages}`,
      CONFIG.pageWidth - CONFIG.margin.right,
      CONFIG.pageHeight - 10,
      { align: 'right' }
    );

    // Ligne de séparation pied de page
    doc.setDrawColor(...CONFIG.colors.border);
    doc.setLineWidth(0.2);
    doc.line(
      CONFIG.margin.left,
      CONFIG.pageHeight - 15,
      CONFIG.pageWidth - CONFIG.margin.right,
      CONFIG.pageHeight - 15
    );

    // Nom entreprise à gauche
    doc.setFontSize(CONFIG.fontSize.tiny);
    doc.text(
      CONFIG.entreprise.nom,
      CONFIG.margin.left,
      CONFIG.pageHeight - 10
    );
  }
}

// ============================================================================
// DESSIN — Titre de section (bandeau coloré)
// ============================================================================

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  const { margin, contentWidth, colors, fontSize } = CONFIG;

  doc.setFillColor(...colors.sectionBg);
  doc.roundedRect(margin.left, y, contentWidth, 8, 1, 1, 'F');

  // Petite bande latérale
  doc.setFillColor(...colors.primary);
  doc.rect(margin.left, y, 2, 8, 'F');

  doc.setFontSize(fontSize.sectionTitle);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textDark);
  doc.text(title, margin.left + 5, y + 5.5);

  return y + 12;
}

// ============================================================================
// HELPERS — Formatting
// ============================================================================

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateFile(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function formatValue(
  value: unknown,
  fieldType?: string,
  unite?: string
): string {
  if (value === null || value === undefined || value === '') return '—';

  if (fieldType === 'date' && typeof value === 'string') {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    } catch {
      // fallthrough
    }
  }

  if (fieldType === 'boolean') {
    return value === true || value === 'true' ? 'Oui' : 'Non';
  }

  const str = String(value);
  return unite ? `${str} ${unite}` : str;
}

function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}
