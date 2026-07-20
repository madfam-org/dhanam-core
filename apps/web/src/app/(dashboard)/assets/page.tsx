'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Building2,
  Car,
  Globe,
  TrendingUp,
  Gem,
  Palette,
  Coins,
  Plus,
  FileText,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { ManualAssetForm, type ManualAssetData } from '@/components/assets/manual-asset-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api/client';
import { useSpaceStore } from '@/stores/space';

interface ManualAsset {
  id: string;
  name: string;
  type: string;
  description?: string;
  currentValue: number;
  currency: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  documents?: { key: string }[];
  createdAt: string;
  updatedAt: string;
}

interface AssetTypeStaticConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  labelKey: string;
}

const DEFAULT_ASSET_STATIC: AssetTypeStaticConfig = {
  icon: Plus,
  color: 'text-gray-600 bg-gray-100',
  labelKey: 'page.typeOther',
};

const ASSET_TYPE_STATIC: Record<string, AssetTypeStaticConfig> = {
  real_estate: {
    icon: Building2,
    color: 'text-blue-600 bg-blue-100',
    labelKey: 'page.typeRealEstate',
  },
  vehicle: { icon: Car, color: 'text-green-600 bg-green-100', labelKey: 'page.typeVehicle' },
  domain: { icon: Globe, color: 'text-purple-600 bg-purple-100', labelKey: 'page.typeDomain' },
  private_equity: {
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-100',
    labelKey: 'page.typePrivateEquity',
  },
  angel_investment: {
    icon: TrendingUp,
    color: 'text-red-600 bg-red-100',
    labelKey: 'page.typeAngelInvestment',
  },
  collectible: { icon: Gem, color: 'text-pink-600 bg-pink-100', labelKey: 'page.typeCollectible' },
  art: { icon: Palette, color: 'text-indigo-600 bg-indigo-100', labelKey: 'page.typeArt' },
  jewelry: { icon: Coins, color: 'text-yellow-600 bg-yellow-100', labelKey: 'page.typeJewelry' },
  other: DEFAULT_ASSET_STATIC,
};

function getAssetTypeStatic(type: string): AssetTypeStaticConfig {
  return ASSET_TYPE_STATIC[type] ?? DEFAULT_ASSET_STATIC;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AssetsPage() {
  const { t } = useTranslation('assets');
  const { t: tCommon } = useTranslation('common');
  const currentSpaceId = useSpaceStore((state) => state.currentSpace?.id);
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchAssets = useCallback(async () => {
    if (!currentSpaceId) return;
    try {
      setHasError(false);
      const data = await apiClient.get<ManualAsset[]>(`/spaces/${currentSpaceId}/manual-assets`);
      setAssets(data);
    } catch (error) {
      setHasError(true);
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpaceId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCreateAsset = async (data: ManualAssetData) => {
    if (!currentSpaceId) return;
    await apiClient.post(`/spaces/${currentSpaceId}/manual-assets`, data);
    setIsCreateDialogOpen(false);
    fetchAssets();
  };

  const totalValue = assets.reduce((sum, asset) => {
    // Simple aggregation - in production would need currency conversion
    return sum + asset.currentValue;
  }, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
            <Button onClick={() => fetchAssets()}>{tCommon('tryAgain')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('page.addAsset')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('page.addManualAsset')}</DialogTitle>
              <DialogDescription>{t('page.trackIlliquid')}</DialogDescription>
            </DialogHeader>
            <ManualAssetForm
              onSubmit={handleCreateAsset}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('page.portfolioSummary')}</CardTitle>
          <CardDescription>{t('page.portfolioDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(totalValue, 'USD')}</div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('page.assetsTracked', { count: assets.length })}
          </p>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('empty.description')}</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('empty.addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const typeConfig = getAssetTypeStatic(asset.type);
            const Icon = typeConfig.icon;
            const documentCount = asset.documents?.length || 0;

            return (
              <Link key={asset.id} href={`/assets/${asset.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-2 rounded-lg ${typeConfig.color.split(' ')[1]} inline-flex`}
                      >
                        <Icon className={`h-5 w-5 ${typeConfig.color.split(' ')[0]}`} />
                      </div>
                      <Badge variant="secondary">{t(typeConfig.labelKey)}</Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{asset.name}</CardTitle>
                    {asset.description && (
                      <CardDescription className="line-clamp-2">
                        {asset.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(asset.currentValue, asset.currency)}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>
                          {documentCount !== 1
                            ? t('page.documents', { count: documentCount })
                            : t('page.document', { count: documentCount })}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
