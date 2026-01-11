import { create } from 'zustand';

interface PublishModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const usePublishModal = create<PublishModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default usePublishModal;
