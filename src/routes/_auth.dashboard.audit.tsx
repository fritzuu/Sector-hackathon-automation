import { createFileRoute } from '@tanstack/react-router';
import { RunAuditHistory } from '../modules/cases/components/RunAuditHistory';
import { useWorkflowStore } from '../modules/cases/stores/workflow.store';

export const Route = createFileRoute('/_auth/dashboard/audit')({
  component: AuditPage,
});

function AuditPage() {
  const { auditRuns } = useWorkflowStore();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RunAuditHistory runs={auditRuns} />
    </div>
  );
}
