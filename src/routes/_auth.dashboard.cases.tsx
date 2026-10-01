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

  const activeCasesArray = Array.from(activeCases.values()).filter((c) => watchlist.includes(c.symbol));

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="">
      <ActiveCasesList
        cases={activeCasesArray}
        onSelectCase={(c) => setSelectedCase(c)}
      />

      <CaseDetailModal
        caseItem={selectedCase}
        events={selectedCase ? caseEvents.get(selectedCase.symbol) || [] : []}
        template={selectedCase ? caseTemplates.get(selectedCase.symbol) || null : null}
        onClose={() => setSelectedCase(null)}
      />
    </motion.div>
  );
}
