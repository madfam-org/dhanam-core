'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Building2, Car, Globe, TrendingUp, Gem, Palette, Coins, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ManualAssetFormProps {
  onSubmit: (asset: ManualAssetData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ManualAssetData>;
}

export interface ManualAssetData {
  name: string;
  type: string;
  description?: string;
  currentValue: number;
  currency: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Asset metadata varies by asset type; values accessed dynamically for form binding
  metadata?: Record<string, any>;
  notes?: string;
}

const ASSET_TYPE_CONFIG = [
  {
    value: 'real_estate',
    labelKey: 'form.types.realEstate' as const,
    icon: Building2,
    color: 'text-blue-600',
  },
  { value: 'vehicle', labelKey: 'form.types.vehicle' as const, icon: Car, color: 'text-green-600' },
  {
    value: 'domain',
    labelKey: 'form.types.webDomain' as const,
    icon: Globe,
    color: 'text-purple-600',
  },
  {
    value: 'private_equity',
    labelKey: 'form.types.privateEquity' as const,
    icon: TrendingUp,
    color: 'text-orange-600',
  },
  {
    value: 'angel_investment',
    labelKey: 'form.types.angelInvestment' as const,
    icon: TrendingUp,
    color: 'text-red-600',
  },
  {
    value: 'collectible',
    labelKey: 'form.types.collectible' as const,
    icon: Gem,
    color: 'text-pink-600',
  },
  { value: 'art', labelKey: 'form.types.art' as const, icon: Palette, color: 'text-indigo-600' },
  {
    value: 'jewelry',
    labelKey: 'form.types.jewelry' as const,
    icon: Coins,
    color: 'text-yellow-600',
  },
  { value: 'other', labelKey: 'form.types.other' as const, icon: Plus, color: 'text-gray-600' },
];

export function ManualAssetForm({ onSubmit, onCancel, initialData }: ManualAssetFormProps) {
  const { t } = useTranslation('assets');
  const [formData, setFormData] = useState<ManualAssetData>({
    name: initialData?.name || '',
    type: initialData?.type || 'real_estate',
    description: initialData?.description || '',
    currentValue: initialData?.currentValue || 0,
    currency: initialData?.currency || 'USD',
    acquisitionDate: initialData?.acquisitionDate || '',
    acquisitionCost: initialData?.acquisitionCost || undefined,
    metadata: initialData?.metadata || {},
    notes: initialData?.notes || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showMetadata, setShowMetadata] = useState(!!initialData?.metadata);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to save asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
    }).format(amount);
  };

  const renderMetadataFields = () => {
    switch (formData.type) {
      case 'real_estate':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('form.realEstate.address')}</Label>
              <Input
                placeholder={t('form.realEstate.placeholders.address')}
                value={formData.metadata?.address || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, address: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.realEstate.city')}</Label>
              <Input
                placeholder={t('form.realEstate.placeholders.city')}
                value={formData.metadata?.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, city: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.realEstate.stateProvince')}</Label>
              <Input
                placeholder={t('form.realEstate.placeholders.state')}
                value={formData.metadata?.state || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, state: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.realEstate.squareFeet')}</Label>
              <Input
                type="number"
                placeholder={t('form.realEstate.placeholders.sqft')}
                value={formData.metadata?.sqft || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, sqft: parseInt(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('form.vehicle.make')}</Label>
              <Input
                placeholder={t('form.vehicle.placeholders.make')}
                value={formData.metadata?.make || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, make: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.vehicle.model')}</Label>
              <Input
                placeholder={t('form.vehicle.placeholders.model')}
                value={formData.metadata?.model || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, model: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.vehicle.year')}</Label>
              <Input
                type="number"
                placeholder={t('form.vehicle.placeholders.year')}
                value={formData.metadata?.year || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, year: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.vehicle.vin')}</Label>
              <Input
                placeholder={t('form.vehicle.placeholders.vin')}
                value={formData.metadata?.vin || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, vin: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      case 'private_equity':
      case 'angel_investment':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('form.investment.companyName')}</Label>
              <Input
                placeholder={t('form.investment.placeholders.companyName')}
                value={formData.metadata?.companyName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, companyName: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.investment.investmentDate')}</Label>
              <Input
                type="date"
                value={formData.metadata?.investmentDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, investmentDate: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.investment.ownershipPercent')}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={t('form.investment.placeholders.ownershipPercent')}
                value={formData.metadata?.ownershipPercentage || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      ownershipPercentage: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.investment.sharesOwned')}</Label>
              <Input
                type="number"
                placeholder={t('form.investment.placeholders.shares')}
                value={formData.metadata?.shares || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, shares: parseInt(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        );

      case 'domain':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('form.domain.domainName')}</Label>
              <Input
                placeholder={t('form.domain.placeholders.domain')}
                value={formData.metadata?.domain || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, domain: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.domain.registrar')}</Label>
              <Input
                placeholder={t('form.domain.placeholders.registrar')}
                value={formData.metadata?.registrar || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, registrar: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>{t('form.domain.expiryDate')}</Label>
              <Input
                type="date"
                value={formData.metadata?.expiryDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, expiryDate: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{initialData ? t('form.editTitle') : t('form.addTitle')}</CardTitle>
        <CardDescription>{t('form.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Type Selection */}
          <div className="space-y-2">
            <Label>{t('form.labels.assetType')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {ASSET_TYPE_CONFIG.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${type.color}`} />
                    <span className="text-sm">{t(type.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('form.labels.assetName')} *</Label>
              <Input
                required
                placeholder={t('form.placeholders.assetName')}
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t('form.labels.currentValue')} *</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.currentValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, currentValue: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Acquisition Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{t('form.labels.currency')}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.currency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
            <div>
              <Label>{t('form.labels.acquisitionDate')}</Label>
              <Input
                type="date"
                value={formData.acquisitionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, acquisitionDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t('form.labels.acquisitionCost')}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={t('form.placeholders.acquisitionCost')}
                value={formData.acquisitionCost || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    acquisitionCost: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Unrealized Gain/Loss */}
          {formData.acquisitionCost && formData.currentValue && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t('form.labels.unrealizedGainLoss')}:</span>
                <span
                  className={`text-lg font-bold ${
                    formData.currentValue - formData.acquisitionCost >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(formData.currentValue - formData.acquisitionCost)}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <Label>{t('form.labels.description')}</Label>
            <Textarea
              placeholder={t('form.placeholders.description')}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Type-Specific Metadata */}
          {showMetadata && (
            <div className="space-y-2">
              <Label className="font-semibold">{t('form.labels.assetDetails')}</Label>
              {renderMetadataFields()}
            </div>
          )}

          {!showMetadata && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowMetadata(true)}>
              {t('form.buttons.addDetails')}
            </Button>
          )}

          {/* Notes */}
          <div>
            <Label>{t('form.labels.notes')}</Label>
            <Textarea
              placeholder={t('form.placeholders.notes')}
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {t('form.buttons.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t('form.buttons.saving')
                : initialData
                  ? t('form.buttons.updateAsset')
                  : t('form.buttons.addAsset')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
