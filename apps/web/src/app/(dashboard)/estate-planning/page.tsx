'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  FileText,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Users,
  ScrollText,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useWills, type Will, type ValidationResult } from '@/hooks/useWills';

export default function EstatePlanningPage() {
  const { t } = useTranslation('estatePlanning');
  const {
    createWill,
    getWillsByHousehold,
    getWill,
    activateWill,
    revokeWill,
    validateWill,
    loading,
    error,
  } = useWills();
  const { getHouseholds } = useHouseholds();

  const { t: tCommon } = useTranslation('common');
  const [loadError, setLoadError] = useState(false);
  const [households, setHouseholds] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [wills, setWills] = useState<Will[]>([]);
  const [selectedWill, setSelectedWill] = useState<Will | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWill, setNewWill] = useState({
    name: '',
    notes: '',
    legalDisclaimer: false,
  });

  useEffect(() => {
    loadHouseholds();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reason: Only load on mount; getHouseholds is stable from useHouseholds hook
  }, []);

  useEffect(() => {
    if (selectedHouseholdId) {
      loadWills(selectedHouseholdId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reason: loadWills depends on getWillsByHousehold which is stable; only re-run when household selection changes
  }, [selectedHouseholdId]);

  const loadHouseholds = async () => {
    setLoadError(false);
    try {
      const data = await getHouseholds();
      setHouseholds(data);
      if (data.length > 0 && !selectedHouseholdId && data[0]) {
        setSelectedHouseholdId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load households:', err);
      setLoadError(true);
    }
  };

  const loadWills = async (householdId: string) => {
    try {
      const data = await getWillsByHousehold(householdId);
      setWills(data);
    } catch (err) {
      console.error('Failed to load wills:', err);
    }
  };

  const handleCreateWill = async () => {
    if (!selectedHouseholdId) return;

    try {
      await createWill({
        householdId: selectedHouseholdId,
        name: newWill.name,
        notes: newWill.notes || undefined,
        legalDisclaimer: newWill.legalDisclaimer,
      });
      setIsCreateDialogOpen(false);
      setNewWill({ name: '', notes: '', legalDisclaimer: false });
      loadWills(selectedHouseholdId);
    } catch (err) {
      console.error('Failed to create will:', err);
    }
  };

  const handleViewWill = async (will: Will) => {
    try {
      const fullWill = await getWill(will.id);
      setSelectedWill(fullWill);

      // Also validate the will
      const validation = await validateWill(will.id);
      setValidationResult(validation);
    } catch (err) {
      console.error('Failed to load will details:', err);
    }
  };

  const handleActivateWill = async (willId: string) => {
    try {
      await activateWill(willId);
      if (selectedHouseholdId) {
        loadWills(selectedHouseholdId);
      }
      setSelectedWill(null);
    } catch (err) {
      console.error('Failed to activate will:', err);
    }
  };

  const handleRevokeWill = async (willId: string) => {
    try {
      await revokeWill(willId);
      if (selectedHouseholdId) {
        loadWills(selectedHouseholdId);
      }
      setSelectedWill(null);
    } catch (err) {
      console.error('Failed to revoke will:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'revoked':
        return <XCircle className="h-4 w-4" />;
      case 'executed':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'executed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('page.title')}</h1>
          <p className="text-muted-foreground">{t('page.description')}</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!selectedHouseholdId}>
              <Plus className="h-4 w-4 mr-2" />
              {t('page.createWill')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.createWill.title')}</DialogTitle>
              <DialogDescription>{t('dialog.createWill.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('fields.willName')}</Label>
                <Input
                  id="name"
                  value={newWill.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewWill({ ...newWill, name: e.target.value })
                  }
                  placeholder={t('fields.willNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="notes">{t('fields.notesOptional')}</Label>
                <Textarea
                  id="notes"
                  value={newWill.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewWill({ ...newWill, notes: e.target.value })
                  }
                  placeholder={t('fields.notesPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="disclaimer"
                  checked={newWill.legalDisclaimer}
                  onCheckedChange={(checked: boolean) =>
                    setNewWill({ ...newWill, legalDisclaimer: checked as boolean })
                  }
                />
                <label
                  htmlFor="disclaimer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('fields.legalDisclaimer')}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button onClick={handleCreateWill} disabled={!newWill.name}>
                {t('page.createDraft')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Household Selector */}
      {households.length > 0 && (
        <div className="flex gap-2">
          {households.map((household) => (
            <Button
              key={household.id}
              variant={selectedHouseholdId === household.id ? 'default' : 'outline'}
              onClick={() => setSelectedHouseholdId(household.id)}
            >
              {household.name}
            </Button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && wills.length === 0 && !loadError && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {loadError && wills.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
            <Button onClick={() => loadHouseholds()}>{tCommon('tryAgain')}</Button>
          </CardContent>
        </Card>
      )}

      {/* No Wills State */}
      {!loading && !loadError && wills.length === 0 && selectedHouseholdId && (
        <Card>
          <CardContent className="py-12 text-center">
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('page.noWills')}</h3>
            <p className="text-muted-foreground mb-4">{t('page.noWillsDescription')}</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('page.createWill')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wills List */}
      {wills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wills.map((will) => (
            <Card
              key={will.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewWill(will)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{will.name}</CardTitle>
                  <Badge className={getStatusColor(will.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(will.status)}
                      <span className="capitalize">{will.status}</span>
                    </div>
                  </Badge>
                </div>
                {will.notes && (
                  <CardDescription className="line-clamp-2">{will.notes}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('fields.beneficiaries')}</span>
                    <span className="font-medium">{will._count?.beneficiaries || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('fields.executors')}</span>
                    <span className="font-medium">{will._count?.executors || 0}</span>
                  </div>
                  {will.activatedAt && (
                    <div className="text-sm text-muted-foreground">
                      {t('fields.activated')} {new Date(will.activatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Will Details */}
      {selectedWill && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedWill.name}</CardTitle>
                <CardDescription>{t('page.willDetails')}</CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedWill.status === 'draft' && (
                  <Button
                    onClick={() => handleActivateWill(selectedWill.id)}
                    disabled={!validationResult?.isValid}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('actions.activate')}
                  </Button>
                )}
                {selectedWill.status === 'active' && (
                  <Button variant="destructive" onClick={() => handleRevokeWill(selectedWill.id)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('actions.revoke')}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedWill(null)}>
                  {t('actions.close')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Validation Errors */}
              {validationResult && !validationResult.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">{t('validation.cannotActivate')}</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Beneficiaries */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('fields.beneficiaries')} ({selectedWill.beneficiaries?.length || 0})
                </h3>
                {selectedWill.beneficiaries && selectedWill.beneficiaries.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWill.beneficiaries.map((beneficiary) => (
                      <div
                        key={beneficiary.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <div className="font-medium">{beneficiary.beneficiary?.user?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {beneficiary.assetType.replace('_', ' ')} - {beneficiary.percentage}%
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {beneficiary.beneficiary?.relationship}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('page.noBeneficiaries')}</p>
                )}
              </div>

              {/* Executors */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  {t('fields.executors')} ({selectedWill.executors?.length || 0})
                </h3>
                {selectedWill.executors && selectedWill.executors.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWill.executors.map((executor) => (
                      <div
                        key={executor.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <div className="font-medium">{executor.executor?.user?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('fields.order')} {executor.order}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {executor.isPrimary && (
                            <Badge variant="default">{t('fields.primary')}</Badge>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {executor.executor?.relationship}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t('page.noExecutors')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
