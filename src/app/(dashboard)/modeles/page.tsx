import Link from 'next/link';
import { SECTIONS_META } from '@/types/fiche.types';

export default function ModelesPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modèles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Référentiel des sections standards utilisées pour créer les fiches de contrôle.
          </p>
        </div>
        <Link
          href="/fiches/new"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Créer une fiche
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Catalogue des modèles actifs</h2>
          <p className="text-xs text-slate-500 mt-1">{SECTIONS_META.length} modèles disponibles</p>
        </div>

        <div className="divide-y divide-slate-200">
          {SECTIONS_META.map((section) => (
            <div key={section.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{section.icon} {section.titre}</p>
                <p className="text-sm text-slate-600 mt-1">{section.description}</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                Ordre {section.ordre + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
