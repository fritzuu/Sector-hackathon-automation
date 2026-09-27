import { describe, it, expect } from 'vitest';
import { renderCaseTemplate, TEMPLATE_VERSION, STANDARD_DISCLAIMER } from '../src/engine/templateRenderer.js';
import { evaluateDataset } from '../src/engine/rules/index.js';
import {
  abnormalVolumeDataset,
  newFilingDataset,
  incompleteDataDataset,
} from '../src/fixtures/mockSectorsData.js';

describe('Versioned Deterministic Template Renderer', () => {
  it('should render structured output with facts, interpretations, unknowns and disclaimer', () => {
    const evalVolume = evaluateDataset(abnormalVolumeDataset);
    const template = renderCaseTemplate(evalVolume, 'OPEN');

    expect(template.version).toBe(TEMPLATE_VERSION);
    expect(template.status).toBe('OPEN');
    expect(template.symbol).toBe('TLKM');
    expect(template.facts.length).toBeGreaterThan(0);
    expect(template.limitedInterpretations.length).toBeGreaterThan(0);
    expect(template.unknowns.length).toBeGreaterThan(0);
    expect(template.disclaimer).toBe(STANDARD_DISCLAIMER);

    expect(template.plainText).toContain('📌 FAKTA');
    expect(template.plainText).toContain('🔍 INTERPRETASI TERBATAS');
    expect(template.plainText).toContain('❓ BELUM DIKETAHUI');
    expect(template.plainText).toContain('⚠️ DISCLAIMER');
    expect(template.plainText).toContain('TLKM');
  });

  it('should render new filing details when filing is detected', () => {
    const evalFiling = evaluateDataset(newFilingDataset);
    const template = renderCaseTemplate(evalFiling, 'UPDATED');

    expect(template.status).toBe('UPDATED');
    expect(template.facts.some((f) => f.toLowerCase().includes('keterbukaan informasi'))).toBe(true);
  });

  it('should clearly highlight incomplete data warning in facts', () => {
    const evalIncomplete = evaluateDataset(incompleteDataDataset);
    const template = renderCaseTemplate(evalIncomplete, 'DATA_INCOMPLETE');

    expect(template.status).toBe('DATA_INCOMPLETE');
    expect(template.facts.some((f) => f.includes('Status data: Data historis/benchmark tidak lengkap'))).toBe(true);
    expect(template.limitedInterpretations.some((i) => i.includes('Evaluasi aturan ditangguhkan'))).toBe(true);
  });
});
