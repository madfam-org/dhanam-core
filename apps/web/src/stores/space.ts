import { Space } from '@dhanam-core/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SpaceStore {
  currentSpace: Space | null;
  spaces: Space[];
  _hasHydrated: boolean;
  setCurrentSpace: (space: Space | null) => void;
  setSpaces: (spaces: Space[]) => void;
  addSpace: (space: Space) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  removeSpace: (spaceId: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useSpaceStore = create<SpaceStore>()(
  persist(
    (set) => ({
      currentSpace: null,
      spaces: [],
      _hasHydrated: false,
      setCurrentSpace: (space) => set({ currentSpace: space }),
      setSpaces: (spaces) => set({ spaces }),
      addSpace: (space) => set((state) => ({ spaces: [...state.spaces, space] })),
      updateSpace: (spaceId, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) => (s.id === spaceId ? { ...s, ...updates } : s)),
          currentSpace:
            state.currentSpace?.id === spaceId
              ? { ...state.currentSpace, ...updates }
              : state.currentSpace,
        })),
      removeSpace: (spaceId) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== spaceId),
          currentSpace: state.currentSpace?.id === spaceId ? null : state.currentSpace,
        })),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'space-storage',
      onRehydrateStorage: () => () => {
        useSpaceStore.getState().setHasHydrated(true);
      },
    }
  )
);
