// ============================================================================
// COMPOSANT — FieldRenderer (rendu dynamique d'un champ de formulaire)
// Instancie le bon input selon le type du champ (text, number, select, etc.)
// ============================================================================

'use client';

import React from 'react';
import type { FieldDef } from '@/types/fiche.types';

interface FieldRendererProps {
  field: FieldDef;
  value: string | number | boolean | null;
  error?: string;
  onChange: (name: string, value: string | number | boolean | null) => void;
}

export default function FieldRenderer({ field, value, error, onChange }: FieldRendererProps) {
  const baseInputClass = `
    w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-400
    ${error
      ? 'border-red-300 bg-red-50/50 text-red-900 placeholder-red-300'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400'
    }
  `;

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  // ── Render par type ──

  const renderInput = () => {
    const decimalsFromStep =
      typeof field.step === 'number' && String(field.step).includes('.')
        ? String(field.step).split('.')[1].length
        : 0;

    switch (field.type) {
      // ── Texte simple ──
      case 'text':
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={(value as string) ?? ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={baseInputClass}
            maxLength={field.maxLength ?? 500}
          />
        );

      // ── Nombre ──
      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              id={field.name}
              name={field.name}
              value={value !== null && value !== undefined ? String(value) : ''}
              placeholder={field.placeholder ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange(field.name, val === '' ? null : Number(val));
              }}
              onBlur={(e) => {
                const raw = e.target.value;
                if (raw === '' || decimalsFromStep <= 0) return;
                const rounded = Number(Number(raw).toFixed(decimalsFromStep));
                if (!Number.isNaN(rounded)) {
                  onChange(field.name, rounded);
                }
              }}
              step={field.step ?? 'any'}
              className={`${baseInputClass} ${field.unite ? 'pr-16' : ''}`}
            />
            {field.unite && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {field.unite}
              </span>
            )}
          </div>
        );

      // ── Sélection ──
      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.name, e.target.value || null)}
            className={baseInputClass}
          >
            <option value="">— Sélectionner —</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      // ── Booléen ──
      case 'boolean':
        return (
          <div className="flex items-center gap-5 py-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                id={field.name}
                name={field.name}
                checked={value === true}
                onChange={() => onChange(field.name, true)}
                className="h-4 w-4 border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Oui</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.name}
                checked={value === false}
                onChange={() => onChange(field.name, false)}
                className="h-4 w-4 border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Non</span>
            </label>
          </div>
        );

      // ── Date ──
      case 'date':
        return (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.name, e.target.value || null)}
            className={baseInputClass}
          />
        );

      // ── Textarea ──
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={(value as string) ?? ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${baseInputClass} resize-none`}
            rows={3}
            maxLength={field.maxLength ?? 500}
          />
        );

      default:
        return <p className="text-red-500 text-sm">Type de champ inconnu : {field.type}</p>;
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={field.name} className={labelClass}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.unite && field.type !== 'number' && (
          <span className="text-gray-400 font-normal ml-1">({field.unite})</span>
        )}
      </label>

      {renderInput()}

      {/* Erreur */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
