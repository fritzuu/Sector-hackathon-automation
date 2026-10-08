import { createFileRoute } from '@tanstack/react-router';
import { AutomationPage } from '../modules/automation/components/AutomationPage';

export const Route = createFileRoute('/_auth/dashboard/automation')({ component: AutomationPage });
