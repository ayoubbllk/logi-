'use client';

import React from 'react';
import type { SectionMeta, SectionFormData, FieldErrors } from '@/types/fiche.types';
import type { SectionFieldsDef } from '@/types/fiche.types';

interface SectionFormProps {
  meta: SectionMeta;
  fieldsDef: SectionFieldsDef;
  data: SectionFormData;
  errors: FieldErrors;
  onChange: (fieldName: string, value: string | number | boolean | null) => void;
}

const cellInputClass = 'w-full bg-transparent outline-none text-sm px-2 py-1';

function RadioOuiNon({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | number | boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 text-xs">
      <label className="inline-flex items-center gap-1">
        <input type="radio" name={name} checked={value === true} onChange={() => onChange(true)} /> Oui
      </label>
      <label className="inline-flex items-center gap-1">
        <input type="radio" name={name} checked={value === false} onChange={() => onChange(false)} /> Non
      </label>
    </div>
  );
}

function Err({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="text-[11px] text-red-600 px-2 pb-1">{text}</div>;
}

export default function SectionForm({ meta, data, errors, onChange }: SectionFormProps) {
  const renderNumber = (name: string, unit?: string, step = 0.1) => (
    <div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step={step}
          value={typeof data[name] === 'number' || typeof data[name] === 'string' ? String(data[name]) : ''}
          onChange={(e) => onChange(name, e.target.value === '' ? null : Number(e.target.value))}
          className={cellInputClass}
        />
        {unit && <span className="text-xs text-slate-500 pr-2">{unit}</span>}
      </div>
      <Err text={errors[name]} />
    </div>
  );

  const renderText = (name: string) => (
    <div>
      <input
        type="text"
        value={typeof data[name] === 'string' || typeof data[name] === 'number' ? String(data[name]) : ''}
        onChange={(e) => onChange(name, e.target.value)}
        className={cellInputClass}
      />
      <Err text={errors[name]} />
    </div>
  );

  const renderObs = (name: string) => (
    <div>
      <textarea
        rows={2}
        value={(data[name] as string) ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
        className={`${cellInputClass} resize-none`}
      />
      <Err text={errors[name]} />
    </div>
  );

  const renderConforme = (name: string) => (
    <div>
      <RadioOuiNon name={`${meta.id}-${name}`} value={data[name] ?? null} onChange={(v) => onChange(name, v)} />
      <Err text={errors[name]} />
    </div>
  );

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
        {meta.ordre + 1}️⃣ {meta.titre}
      </h2>

      {(meta.id === 'bitumes_oxydes' || meta.id === 'bitumes_fluidifies') && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm bg-white">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-500 px-2 py-2 text-left">{meta.id === 'bitumes_oxydes' ? 'Échantillon' : 'Mélange'}</th>
                <th className="border border-slate-500 px-2 py-2 text-left">TBA (°C)</th>
                <th className="border border-slate-500 px-2 py-2 text-left">IP (dmm)</th>
                <th className="border border-slate-500 px-2 py-2 text-left">Conforme</th>
                <th className="border border-slate-500 px-2 py-2 text-left">Observations</th>
              </tr>
            </thead>
            <tbody>
              {['01', '02'].map((row) => {
                const p = meta.id === 'bitumes_oxydes' ? 'ox' : 'fl';
                return (
                  <tr key={row}>
                    <td className="border border-slate-500 px-2 py-2 font-semibold">{row}</td>
                    <td className="border border-slate-500 p-0">{renderNumber(`${p}_${row}_tba`, '°C', 0.1)}</td>
                    <td className="border border-slate-500 p-0">{renderNumber(`${p}_${row}_ip`, 'dmm', 0.1)}</td>
                    <td className="border border-slate-500 p-0">{renderConforme(`${p}_${row}_conforme`)}</td>
                    <td className="border border-slate-500 p-0">{renderObs(`${p}_${row}_obs`)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.id === 'bitumes_modifies' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <label className="text-sm font-medium">N° Formule :</label>
            <div className="md:col-span-2 border border-slate-500">{renderText('formule_numero')}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm bg-white">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-500 px-2 py-2 text-left">Essai</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Résultat</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Conforme</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Observations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">TBA (°C)</td>
                  <td className="border border-slate-500 p-0">{renderNumber('mod_tba_resultat', '°C', 0.1)}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mod_tba_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mod_tba_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">IP (dmm)</td>
                  <td className="border border-slate-500 p-0">{renderNumber('mod_ip_resultat', 'dmm', 0.1)}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mod_ip_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mod_ip_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Souplesse T° ambiante</td>
                  <td className="border border-slate-500 p-0">{renderText('mod_souplesse_amb_resultat')}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mod_souplesse_amb_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mod_souplesse_amb_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Souplesse basse T°</td>
                  <td className="border border-slate-500 p-0">{renderText('mod_souplesse_basse_resultat')}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mod_souplesse_basse_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mod_souplesse_basse_obs')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.id === 'produits_finis_traditionnels' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <label className="text-sm font-medium">Identification Produit :</label>
            <div className="md:col-span-2 border border-slate-500">{renderText('trad_identification_produit')}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm bg-white">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-500 px-2 py-2 text-left">Essai</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Résultat</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Conforme</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Observations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Poids (Kg)</td>
                  <td className="border border-slate-500 p-0">{renderNumber('trad_poids_resultat', 'kg', 0.01)}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('trad_poids_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('trad_poids_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Adhérence Feuille Alu</td>
                  <td className="border border-slate-500 p-0">{renderText('trad_adherence_resultat')}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('trad_adherence_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('trad_adherence_obs')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.id === 'produits_finis_membranes' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <label className="text-sm font-medium">Identification Produit :</label>
            <div className="md:col-span-2 border border-slate-500">{renderText('mem_identification_produit')}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm bg-white">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-500 px-2 py-2 text-left">Essai</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Résultat</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Conforme</th>
                  <th className="border border-slate-500 px-2 py-2 text-left">Observations</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Épaisseur (mm)</td>
                  <td className="border border-slate-500 p-0">{renderNumber('mem_epaisseur_resultat', 'mm', 0.01)}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mem_epaisseur_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mem_epaisseur_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Poids (Kg)</td>
                  <td className="border border-slate-500 p-0">{renderNumber('mem_poids_resultat', 'kg', 0.01)}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mem_poids_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mem_poids_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Absorption NT</td>
                  <td className="border border-slate-500 p-0">{renderText('mem_absorption_resultat')}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mem_absorption_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mem_absorption_obs')}</td>
                </tr>
                <tr>
                  <td className="border border-slate-500 px-2 py-2">Adhérence des grains</td>
                  <td className="border border-slate-500 p-0">{renderText('mem_adherence_grains_resultat')}</td>
                  <td className="border border-slate-500 p-0">{renderConforme('mem_adherence_grains_conforme')}</td>
                  <td className="border border-slate-500 p-0">{renderObs('mem_adherence_grains_obs')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.id === 'emulsions_stabilisees' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm bg-white">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-500 px-2 py-2 text-left">Mélange</th>
                <th className="border border-slate-500 px-2 py-2 text-left">Aspect / Couleur</th>
                <th className="border border-slate-500 px-2 py-2 text-left">Conforme</th>
                <th className="border border-slate-500 px-2 py-2 text-left">Observations</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-500 px-2 py-2 font-semibold">01</td>
                <td className="border border-slate-500 p-0">{renderText('emu_01_aspect')}</td>
                <td className="border border-slate-500 p-0">{renderConforme('emu_01_conforme')}</td>
                <td className="border border-slate-500 p-0">{renderObs('emu_01_obs')}</td>
              </tr>
              <tr>
                <td className="border border-slate-500 px-2 py-2 font-semibold">02</td>
                <td className="border border-slate-500 p-0">{renderText('emu_02_aspect')}</td>
                <td className="border border-slate-500 p-0">{renderConforme('emu_02_conforme')}</td>
                <td className="border border-slate-500 p-0">{renderObs('emu_02_obs')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
