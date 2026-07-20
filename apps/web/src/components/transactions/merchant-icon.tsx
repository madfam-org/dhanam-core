'use client';

import { useMemo } from 'react';

// Map well-known merchants to their domain for logo lookup
const MERCHANT_DOMAINS: Record<string, string> = {
  starbucks: 'starbucks.com',
  uber: 'uber.com',
  'uber eats': 'ubereats.com',
  netflix: 'netflix.com',
  spotify: 'spotify.com',
  amazon: 'amazon.com',
  'amazon mx': 'amazon.com.mx',
  walmart: 'walmart.com',
  'walmart mx': 'walmart.com.mx',
  liverpool: 'liverpool.com.mx',
  oxxo: 'oxxo.com',
  costco: 'costco.com',
  'home depot': 'homedepot.com',
  'mercado libre': 'mercadolibre.com',
  rappi: 'rappi.com',
  didi: 'didiglobal.com',
  apple: 'apple.com',
  google: 'google.com',
  microsoft: 'microsoft.com',
  adobe: 'adobe.com',
  paypal: 'paypal.com',
  'at&t': 'att.com',
  telmex: 'telmex.com',
  telcel: 'telcel.com',
  coppel: 'coppel.com',
  soriana: 'soriana.com',
  'coca-cola': 'coca-cola.com',
  mcdonalds: 'mcdonalds.com',
  "mcdonald's": 'mcdonalds.com',
  zara: 'zara.com',
  hbo: 'hbomax.com',
  'hbo max': 'hbomax.com',
  steam: 'steampowered.com',
  airbnb: 'airbnb.com',
  github: 'github.com',
  openai: 'openai.com',
  notion: 'notion.so',
  figma: 'figma.com',
  slack: 'slack.com',
  zoom: 'zoom.us',
  coinbase: 'coinbase.com',
  binance: 'binance.com',
};

function hashToHSL(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 55%, 45%)`;
}

function normalizeForLookup(name: string): string {
  return name.toLowerCase().trim().replace(/['']/g, "'");
}

interface MerchantIconProps {
  merchant: string | null | undefined;
  description: string;
  size?: number;
}

export function MerchantIcon({ merchant, description, size = 32 }: MerchantIconProps) {
  const displayName = merchant || description;
  const normalized = normalizeForLookup(displayName);

  const domain = useMemo(() => {
    // Direct match
    if (MERCHANT_DOMAINS[normalized]) return MERCHANT_DOMAINS[normalized];
    // Partial match — check if any known merchant is in the name
    for (const [key, val] of Object.entries(MERCHANT_DOMAINS)) {
      if (normalized.includes(key)) return val;
    }
    return null;
  }, [normalized]);

  const initial = displayName.charAt(0).toUpperCase();
  const bgColor = useMemo(() => hashToHSL(displayName), [displayName]);

  if (domain) {
    return (
      <div className="shrink-0" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Reason: External Clearbit logo URLs cannot use next/image without configuring remote domains for every merchant */}
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={displayName}
          width={size}
          height={size}
          className="rounded-full object-cover bg-muted"
          onError={(e) => {
            // Fall back to letter circle on load failure
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div
          className="hidden rounded-full flex items-center justify-center text-white font-semibold"
          style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, backgroundColor: bgColor, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
