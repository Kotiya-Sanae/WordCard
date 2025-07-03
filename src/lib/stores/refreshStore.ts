import { create } from 'zustand';

interface RefreshState {
  refresher: number;
  triggerRefresh: () => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
  refresher: 0,
  triggerRefresh: () => set((state) => ({ refresher: state.refresher + 1 })),
}));