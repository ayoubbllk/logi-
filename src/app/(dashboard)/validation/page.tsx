// ============================================================================
// PAGE — Validation des contrôles qualité (admin uniquement)
// Route : /validation
// ============================================================================

import { ValidationContent } from '@/components/validation';

export const metadata = {
  title: 'Validation | QC Manager',
  description: 'Interface de validation des fiches de contrôle qualité',
};

export default function ValidationPage() {
  return <ValidationContent />;
}
