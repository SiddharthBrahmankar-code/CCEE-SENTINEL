import { create } from 'zustand';

interface ChatContextState {
  currentPageTitle: string;
  pageContent: any; // Flexible content payload
  isChatOpen: boolean;
  setContext: (title: string, content: any) => void;
  clearContext: () => void;
  setChatOpen: (isOpen: boolean) => void;
}

export const useChatContextStore = create<ChatContextState>((set) => ({
  currentPageTitle: 'Home',
  pageContent: null,
  isChatOpen: false,
  setContext: (title, content) => set({ currentPageTitle: title, pageContent: content }),
  clearContext: () => set({ currentPageTitle: 'Home', pageContent: null }),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
}));
