import { getGeoDefaults, type GeoDefaults } from '@dhanam-core/shared';
import { useMemo } from 'react';

function getGeoCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith('dhanam_geo='));
  return match?.split('=')[1] ?? null;
}

export function useGeoDefaults(): GeoDefaults {
  return useMemo(() => getGeoDefaults(getGeoCookie()), []);
}
