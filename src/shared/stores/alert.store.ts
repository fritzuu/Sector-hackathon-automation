import { create } from 'zustand';

export type AlertType = 'warning' | 'error' | 'success' | 'info';

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface AlertState {
  alerts: AlertItem[];
  showAlert: (alert: Omit<AlertItem, 'id'>) => string;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  showAlert: (alert) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: AlertItem = {
      ...alert,
      id,
      durationMs: alert.durationMs ?? 6000,
    };

    set((state) => ({ alerts: [...state.alerts, newItem] }));

    if (newItem.durationMs && newItem.durationMs > 0) {
      setTimeout(() => {
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
      }, newItem.durationMs);
    }

    return id;
  },
  removeAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
  clearAlerts: () => set({ alerts: [] }),
}));

// Global helper function so any module can show custom alerts without hooks
export function showCustomAlert(alert: Omit<AlertItem, 'id'>): string {
  return useAlertStore.getState().showAlert(alert);
}
