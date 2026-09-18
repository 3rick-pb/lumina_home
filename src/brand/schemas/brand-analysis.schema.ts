/**
 * BRAND ANALYSIS SCHEMA & VALIDATION HELPERS
 * 
 * Ensures that brand-analysis.json conforms to strict validation rules
 * and does NOT hallucinate or present inferences as confirmed facts.
 */

export function validateBrandAnalysis(input: unknown): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['El análisis debe ser un objeto JSON válido.'], warnings: [] };
  }

  const data = input as Record<string, unknown>;

  if (!data.brandId || typeof data.brandId !== 'string') {
    errors.push('Campo obligatorio faltante: brandId (slug).');
  }

  // Identity checks
  const identity = data.identity as Record<string, { value?: string }> | undefined;
  if (!identity || typeof identity !== 'object') {
    errors.push('Sección obligatoria faltante: identity.');
  } else {
    if (!identity.name || !identity.name.value) {
      errors.push('identity.name.value es obligatorio.');
    }
    if (!identity.shortName || !identity.shortName.value) {
      warnings.push('identity.shortName.value no especificado; se derivará de name.');
    }
  }

  // Visual checks
  const visual = data.visual as Record<string, { value?: string }> | undefined;
  if (!visual || typeof visual !== 'object') {
    errors.push('Sección obligatoria faltante: visual.');
  } else {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!visual.primaryColor || !visual.primaryColor.value || !hexRegex.test(visual.primaryColor.value)) {
      errors.push('visual.primaryColor.value debe ser un código HEX válido (#rrggbb).');
    }
    if (!visual.accentColor || !visual.accentColor.value || !hexRegex.test(visual.accentColor.value)) {
      errors.push('visual.accentColor.value debe ser un código HEX válido (#rrggbb).');
    }
  }

  // Missing info check
  const missingInfo = data.missingInfo;
  if (Array.isArray(missingInfo) && missingInfo.length > 0) {
    warnings.push(`Información pendiente requerida (${missingInfo.length} ítems): ${missingInfo.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
