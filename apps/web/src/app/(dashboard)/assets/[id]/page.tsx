'use client';

import { useTranslation } from '@dhanam-core/shared';
import { formatDistanceToNow } from 'date-fns';
import {
  Building2,
  Car,
  Globe,
  TrendingUp,
  Gem,
  Palette,
  Coins,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { DocumentList } from '@/components/assets/document-list';
import { DocumentUpload } from '@/components/assets/document-upload';
import { ManualAssetForm, type ManualAssetData } from '@/components/assets/manual-asset-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { documentsApi, type DocumentMetadata, type DocumentConfig } from '@/lib/api/documents';
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
  // Asset metadata varies by asset type
  metadata?: Record<string, unknown>;
  notes?: string;
  documents?: DocumentMetadata[];
  createdAt: string;
  updatedAt: string;
}

interface AssetTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const DEFAULT_ASSET_CONFIG: AssetTypeConfig = {
  label: 'Other',
  icon: Plus,
  color: 'text-gray-600 bg-gray-100',
};

const ASSET_TYPE_CONFIG: Record<string, AssetTypeConfig> = {
  real_estate: { label: 'Real Estate', icon: Building2, color: 'text-blue-600 bg-blue-100' },
  vehicle: { label: 'Vehicle', icon: Car, color: 'text-green-600 bg-green-100' },
  domain: { label: 'Web Domain', icon: Globe, color: 'text-purple-600 bg-purple-100' },
  private_equity: {
    label: 'Private Equity',
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-100',
  },
  angel_investment: {
    label: 'Angel Investment',
    icon: TrendingUp,
    color: 'text-red-600 bg-red-100',
  },
  collectible: { label: 'Collectible', icon: Gem, color: 'text-pink-600 bg-pink-100' },
  art: { label: 'Art', icon: Palette, color: 'text-indigo-600 bg-indigo-100' },
  jewelry: { label: 'Jewelry', icon: Coins, color: 'text-yellow-600 bg-yellow-100' },
  other: DEFAULT_ASSET_CONFIG,
};

function getAssetTypeConfig(type: string): AssetTypeConfig {
  return ASSET_TYPE_CONFIG[type] ?? DEFAULT_ASSET_CONFIG;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export default function AssetDetailPage() {
  const { t } = useTranslation('assets');
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const currentSpaceId = useSpaceStore((state) => state.currentSpace?.id);

  const [asset, setAsset] = useState<ManualAsset | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [documentConfig, setDocumentConfig] = useState<DocumentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAsset = useCallback(async () => {
    if (!currentSpaceId || !assetId) return;
    try {
      const data = await apiClient.get<ManualAsset>(
        `/spaces/${currentSpaceId}/manual-assets/${assetId}`
      );
      setAsset(data);
    } catch (error) {
      console.error('Failed to fetch asset:', error);
      router.push('/assets');
    }
  }, [currentSpaceId, assetId, router]);

  const fetchDocuments = useCallback(async () => {
    if (!currentSpaceId || !assetId) return;
    try {
      const docs = await documentsApi.getDocuments(currentSpaceId, assetId);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  }, [currentSpaceId, assetId]);

  const fetchDocumentConfig = useCallback(async () => {
    if (!currentSpaceId) return;
    try {
      const config = await documentsApi.getConfig(currentSpaceId);
      setDocumentConfig(config);
    } catch (error) {
      console.error('Failed to fetch document config:', error);
    }
  }, [currentSpaceId]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchAsset(), fetchDocuments(), fetchDocumentConfig()]);
      setIsLoading(false);
    };
    init();
  }, [fetchAsset, fetchDocuments, fetchDocumentConfig]);

  const handleUpdateAsset = async (data: ManualAssetData) => {
    if (!currentSpaceId || !assetId) return;
    await apiClient.patch(`/spaces/${currentSpaceId}/manual-assets/${assetId}`, data);
    setIsEditDialogOpen(false);
    fetchAsset();
  };

  const handleDeleteAsset = async () => {
    if (!currentSpaceId || !assetId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/spaces/${currentSpaceId}/manual-assets/${assetId}`);
      router.push('/assets');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      setIsDeleting(false);
    }
  };

  const handleDocumentUploaded = (doc: DocumentMetadata) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const handleDocumentDeleted = (key: string) => {
    setDocuments((prev) => prev.filter((d) => d.key !== key));
  };

  if (isLoading || !asset) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const typeConfig = getAssetTypeConfig(asset.type);
  const Icon = typeConfig.icon;
  const unrealizedGain =
    asset.acquisitionCost !== undefined && asset.acquisitionCost !== null
      ? asset.currentValue - asset.acquisitionCost
      : null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeConfig.color.split(' ')[1]} inline-flex`}>
                <Icon className={`h-6 w-6 ${typeConfig.color.split(' ')[0]}`} />
              </div>
              <h1 className="text-3xl font-bold">{asset.name}</h1>
              <Badge variant="secondary">{typeConfig.label}</Badge>
            </div>
            {asset.description && <p className="text-muted-foreground mt-1">{asset.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t('detail.edit')}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('detail.delete')}
          </Button>
        </div>
      </div>

      {/* Value Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('detail.currentValue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(asset.currentValue, asset.currency)}
            </div>
          </CardContent>
        </Card>

        {asset.acquisitionCost !== undefined && asset.acquisitionCost !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('detail.acquisitionCost')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(asset.acquisitionCost, asset.currency)}
              </div>
              {asset.acquisitionDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Acquired{' '}
                  {formatDistanceToNow(new Date(asset.acquisitionDate), { addSuffix: true })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {unrealizedGain !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('detail.unrealizedGainLoss')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {unrealizedGain >= 0 ? '+' : ''}
                {formatCurrency(unrealizedGain, asset.currency)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('detail.return', {
                  percent: ((unrealizedGain / (asset.acquisitionCost ?? 1)) * 100).toFixed(1),
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Details and Documents */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">{t('detail.tabs.details')}</TabsTrigger>
          <TabsTrigger value="documents">
            {t('detail.tabs.documents')} {documents.length > 0 && `(${documents.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Metadata */}
          {asset.metadata && Object.keys(asset.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.assetDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(asset.metadata).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {asset.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{asset.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.activity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('detail.created')}</span>
                  <span>{formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('detail.lastUpdated')}</span>
                  <span>{formatDistanceToNow(new Date(asset.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {/* Document Upload */}
          {documentConfig && currentSpaceId && (
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.uploadDocuments')}</CardTitle>
                <CardDescription>{t('detail.uploadDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload
                  spaceId={currentSpaceId}
                  assetId={assetId}
                  config={documentConfig}
                  onUploadComplete={handleDocumentUploaded}
                />
              </CardContent>
            </Card>
          )}

          {/* Document List */}
          {currentSpaceId && (
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.uploadedDocuments')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList
                  spaceId={currentSpaceId}
                  assetId={assetId}
                  documents={documents}
                  onDocumentDeleted={handleDocumentDeleted}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('detail.editDialog.title')}</DialogTitle>
            <DialogDescription>{t('detail.editDialog.description')}</DialogDescription>
          </DialogHeader>
          <ManualAssetForm
            initialData={{
              name: asset.name,
              type: asset.type,
              description: asset.description,
              currentValue: asset.currentValue,
              currency: asset.currency,
              acquisitionDate: asset.acquisitionDate,
              acquisitionCost: asset.acquisitionCost,
              metadata: asset.metadata,
              notes: asset.notes,
            }}
            onSubmit={handleUpdateAsset}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('detail.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('detail.deleteDialog.description', { name: asset.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('detail.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAsset}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('detail.deleteDialog.deleting')}
                </>
              ) : (
                t('detail.deleteDialog.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
