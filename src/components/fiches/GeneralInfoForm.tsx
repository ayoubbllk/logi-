'use client';

import React from 'react';

interface GeneralInfoFormProps {
  titre: string;
  referenceDocument: string;
  versionDocument: string;
  dateApplication: string;
  dateFiche: string;
  errors: Record<string, string>;
  onChange: (field: 'titre' | 'produit' | 'dateApplication' | 'dateFiche', value: string) => void;
}

export default function GeneralInfoForm({
  titre,
  referenceDocument,
  versionDocument,
  dateApplication,
  dateFiche,
  errors,
  onChange,
}: GeneralInfoFormProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-slate-800 bg-white">
          <tbody>
            <tr>
              <td className="border border-slate-500 px-3 py-2 w-1/4 font-semibold bg-slate-100">ENREGISTREMENT</td>
              <td className="border border-slate-500 px-3 py-2 text-center font-bold text-base" colSpan={3}>{titre}</td>
            </tr>
            <tr>
              <td className="border border-slate-500 px-3 py-2 bg-slate-100 font-medium">Date d'application</td>
              <td className="border border-slate-500 px-3 py-2">
                <input
                  type="date"
                  value={dateApplication}
                  onChange={(e) => onChange('dateApplication', e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
                {errors.dateApplication && <p className="text-xs text-red-600 mt-1">{errors.dateApplication}</p>}
              </td>
              <td className="border border-slate-500 px-3 py-2 bg-slate-100 font-medium">Référence</td>
              <td className="border border-slate-500 px-3 py-2 font-semibold">{referenceDocument}</td>
            </tr>
            <tr>
              <td className="border border-slate-500 px-3 py-2 bg-slate-100 font-medium">Version</td>
              <td className="border border-slate-500 px-3 py-2 font-semibold">{versionDocument}</td>
              <td className="border border-slate-500 px-3 py-2 bg-slate-100 font-medium">Page</td>
              <td className="border border-slate-500 px-3 py-2 font-semibold">1 / 1</td>
            </tr>
            <tr>
              <td className="border border-slate-500 px-3 py-2 bg-slate-100 font-medium">Fiche N°</td>
              <td className="border border-slate-500 px-3 py-2 text-slate-600 italic">Auto-généré à l'enregistrement</td>
              <td className="border border-slate-500 px-3 py-2 bg-slate-100 font-medium">Date</td>
              <td className="border border-slate-500 px-3 py-2">
                <input
                  type="date"
                  value={dateFiche}
                  onChange={(e) => onChange('dateFiche', e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
                {errors.dateFiche && <p className="text-xs text-red-600 mt-1">{errors.dateFiche}</p>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
        <div className="border border-slate-300 px-3 py-2">Visa ingénieur : ____________________</div>
        <div className="border border-slate-300 px-3 py-2">Bloc signature : ____________________</div>
      </div>
    </div>
  );
}
