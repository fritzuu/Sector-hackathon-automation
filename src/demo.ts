import { evaluateDataset } from './engine/rules/index.js';
import { processCaseTransition } from './engine/caseEngine.js';
import { renderCaseTemplate } from './engine/templateRenderer.js';
import {
  normalDataset,
  abnormalVolumeDataset,
  relativeMovementDataset,
  newFilingDataset,
} from './fixtures/mockSectorsData.js';

console.log('='.repeat(60));
console.log('🚀 WATCHTOWER (SIBA) - DETERMINISTIC CORE ENGINE DEMO');
console.log('='.repeat(60));

const testScenarios = [
  { name: '1. Skenario Normal (BBCA)', dataset: normalDataset },
  { name: '2. Skenario Volume Abnormal (TLKM)', dataset: abnormalVolumeDataset },
  { name: '3. Skenario Pergerakan Harga Relatif (ASII)', dataset: relativeMovementDataset },
  { name: '4. Skenario Filing Baru (UNTR)', dataset: newFilingDataset },
];

let activeCase: any = null;

for (const scenario of testScenarios) {
  console.log(`\n▶ MENGEVALUASI: ${scenario.name}`);
  
  // 1. Evaluasi aturan deterministik
  const evalResult = evaluateDataset(scenario.dataset);
  console.log(`- Triggers Aktif: ${evalResult.activeTriggerCount}`);
  
  // 2. Transisi status kasus
  const transition = processCaseTransition(activeCase, evalResult, new Date().toISOString());
  activeCase = transition.nextCaseState;
  
  console.log(`- Status Kasus: ${transition.event.newStatus}`);
  
  // 3. Render Template Bahasa Indonesia
  const template = renderCaseTemplate(evalResult, transition.event.newStatus);
  console.log('\n--- OUTPUT TEMPLATE TERVERIFIKASI ---');
  console.log(template.plainText);
  console.log('------------------------------------');
}

console.log('\n✅ Demo Selesai. Semua evaluasi 100% deterministik tanpa LLM.');
