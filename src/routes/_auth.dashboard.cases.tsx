import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ActiveCasesList } from '../modules/cases/components/ActiveCasesList';
import { CaseDetailModal } from '../modules/cases/components/CaseDetailModal';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';
import { useWatchlistStore } from '../modules/watchlist/stores/watchlist.store';
import { CaseState } from '../types/engine';

export const Route = createFileRoute('/_auth/dashboard/cases')({
  component: CasesPage,
});

function CasesPage() {
  const { activeCases, caseEvents, caseTemplates } = useWorkflowStore();
  const watchlist = useWatchlistStore((state) => state.watchlist);
  const [selectedCase, setSelectedCase] = useState<CaseState | null>(null);

  const currentSelectedCase = selectedCase ? activeCases.get(selectedCase.symbol) || null : null;
  const activeCasesArray = Array.from(activeCases.values()).filter((c) => watchlist.includes(c.symbol));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="">
      <div className="mb-5 rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">Evaluasi otomatis pukul <strong className="text-text-main">07.00 WIB · Senin–Jumat</strong>, menggunakan sesi perdagangan terakhir. Saham dan IHSG harus berasal dari tanggal yang sama. Jika sumber belum lengkap, kasus menunggu data; status kasus tetap dipertahankan.</div>
      <ActiveCasesList
        cases={activeCasesArray}
        eventCounts={new Map(activeCasesArray.map((c) => [c.caseId, (caseEvents.get(c.symbol) || []).filter((event) => event.caseId === c.caseId).length]))}
        waitingCaseIds={new Set(activeCasesArray.filter((c) => (caseEvents.get(c.symbol) || []).find((event) => event.caseId === c.caseId)?.newStatus === 'DATA_INCOMPLETE').map((c) => c.caseId))}
        onSelectCase={(c) => setSelectedCase(c)}
      />

      <CaseDetailModal
        caseItem={currentSelectedCase}
        events={currentSelectedCase ? (caseEvents.get(currentSelectedCase.symbol) || []).filter((event) => event.caseId === currentSelectedCase.caseId) : []}
        template={selectedCase ? caseTemplates.get(selectedCase.symbol) || null : null}
        onClose={() => setSelectedCase(null)}
      />
    </motion.div>
  );
}
