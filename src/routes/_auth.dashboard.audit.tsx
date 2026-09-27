import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { RunAuditHistory } from '../modules/cases/components/RunAuditHistory';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';

export const Route = createFileRoute('/_auth/dashboard/audit')({
  component: AuditPage,
});

function AuditPage() {
  const { auditRuns } = useWorkflowStore();

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="">
      <RunAuditHistory runs={auditRuns} />
    </motion.div>
  );
}
