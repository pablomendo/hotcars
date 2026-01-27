import { create } from 'zustand';

interface PublishModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const usePublishModal = create<PublishModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));