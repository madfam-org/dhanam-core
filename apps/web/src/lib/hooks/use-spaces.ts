import { Space, CreateSpaceDto, UpdateSpaceDto } from '@dhanam-core/shared';
import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';

import { useSpaceStore } from '@/stores/space';

import { apiClient } from '../api/client';

import { useAuth } from './use-auth';

const SPACES_KEY = ['spaces'] as const;

function spacesQueryOptions(persistedSpaces: Space[]) {
  return queryOptions({
    queryKey: SPACES_KEY,
    queryFn: async (): Promise<Space[]> => {
      const { setSpaces, setCurrentSpace } = useSpaceStore.getState();
      const spaces = await apiClient.get<Space[]>('/spaces');
      setSpaces(spaces);
      const currentSpace = useSpaceStore.getState().currentSpace;
      if (spaces.length > 0) {
        const currentStillValid = currentSpace && spaces.some((s) => s.id === currentSpace.id);
        if (!currentStillValid) {
          setCurrentSpace(spaces[0] ?? null);
        }
      } else {
        setCurrentSpace(null);
      }
      return spaces;
    },
    placeholderData: persistedSpaces.length > 0 ? persistedSpaces : [],
  });
}

export function useSpaces() {
  const { isAuthenticated, _hasHydrated } = useAuth();
  const { spaces: persistedSpaces } = useSpaceStore();
  return useQuery({
    ...spacesQueryOptions(persistedSpaces),
    enabled: _hasHydrated && isAuthenticated,
  });
}

export function useSpace(spaceId: string): UseQueryResult<Space, Error> {
  return useQuery({
    queryKey: [...SPACES_KEY, spaceId],
    queryFn: async () => {
      return apiClient.get<Space>(`/spaces/${spaceId}`);
    },
    enabled: !!spaceId,
  });
}

export function useCreateSpace(): UseMutationResult<Space, Error, CreateSpaceDto> {
  const queryClient = useQueryClient();
  const { setCurrentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (data: CreateSpaceDto) => {
      return apiClient.post<Space>('/spaces', data);
    },
    onSuccess: (space) => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      setCurrentSpace(space);
    },
  });
}

export function useUpdateSpace(spaceId: string): UseMutationResult<Space, Error, UpdateSpaceDto> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSpaceDto) => {
      return apiClient.patch<Space>(`/spaces/${spaceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      queryClient.invalidateQueries({ queryKey: [...SPACES_KEY, spaceId] });
    },
  });
}

export function useDeleteSpace(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  const { currentSpace, setCurrentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: (spaceId: string) => apiClient.delete(`/spaces/${spaceId}`),
    onSuccess: (_, deletedSpaceId) => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      if (currentSpace?.id === deletedSpaceId) {
        setCurrentSpace(null);
      }
    },
  });
}
