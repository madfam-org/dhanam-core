'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam-core/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  FileSpreadsheet,
  FileType,
  TrendingUp,
  PiggyBank,
  Plus,
  FileJson,
  Share2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { InvestorReportPanel } from '@/components/reports/investor-report-panel';
import { ReportHistoryPanel } from '@/components/reports/report-history-panel';
import { SavedReportCard } from '@/components/reports/saved-report-card';
import { ShareLinkPanel } from '@/components/reports/share-link-panel';
import { ShareManagementPanel } from '@/components/reports/share-management-panel';
import { ShareReportDialog } from '@/components/reports/share-report-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { reportsApi, type SavedReport } from '@/lib/api/reports';
import { useSpaceStore } from '@/stores/space';

function getDefaultStartDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0] as string;
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export default function ReportsPage() {
  const { currentSpace } = useSpaceStore();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate);
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel' | 'json'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useTranslation('reports');
  const { t: tCommon } = useTranslation('common');

  // Saved report detail panels
  const [shareDialogReport, setShareDialogReport] = useState<SavedReport | null>(null);
  const [historyReportId, setHistoryReportId] = useState<string | null>(null);

  // Create report dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: 'monthly_spending',
    format: 'pdf' as 'pdf' | 'csv' | 'excel' | 'json',
  });
  const [isCreating, setIsCreating] = useState(false);

  const reportTemplates = [
    {
      id: 'financial-summary',
      name: t('templates.financialSummary'),
      description: t('templates.financialSummaryDesc'),
      icon: FileText,
      format: 'pdf',
    },
    {
      id: 'transaction-export',
      name: t('templates.transactionExport'),
      description: t('templates.transactionExportDesc'),
      icon: FileSpreadsheet,
      format: 'csv',
    },
    {
      id: 'budget-performance',
      name: t('templates.budgetPerformance'),
      description: t('templates.budgetPerformanceDesc'),
      icon: PiggyBank,
      format: 'pdf',
    },
    {
      id: 'net-worth-trend',
      name: t('templates.netWorthTrend'),
      description: t('templates.netWorthTrendDesc'),
      icon: TrendingUp,
      format: 'pdf',
    },
  ];

  const {
    data: availableReports,
    isLoading,
    isError: isErrorReports,
  } = useQuery({
    queryKey: ['available-reports', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return reportsApi.getAvailableReports(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const {
    data: savedReports,
    isLoading: loadingSaved,
    isError: isErrorSaved,
  } = useQuery({
    queryKey: ['saved-reports', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return reportsApi.getSavedReports(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const {
    data: sharedWithMe,
    isLoading: loadingShared,
    isError: isErrorShared,
  } = useQuery({
    queryKey: ['shared-reports'],
    queryFn: () => reportsApi.getSharedWithMe(),
    enabled: !!currentSpace,
  });

  const refreshSavedReports = () => {
    queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
  };

  const handleGenerateReport = async () => {
    if (!currentSpace?.id) {
      toast.error(t('toast.selectSpaceFirst'));
      return;
    }

    setIsGenerating(true);

    try {
      let blob: Blob;
      const spaceId = currentSpace.id;

      if (exportFormat === 'csv') {
        blob = await reportsApi.downloadCsvExport(spaceId, startDate, endDate);
      } else if (exportFormat === 'excel') {
        blob = await reportsApi.downloadExcelExport(spaceId, startDate, endDate);
      } else if (exportFormat === 'json') {
        blob = await reportsApi.downloadJsonExport(spaceId, startDate, endDate);
      } else {
        blob = await reportsApi.downloadPdfReport(spaceId, startDate, endDate);
      }

      const ext = exportFormat === 'excel' ? 'xlsx' : exportFormat;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhanam-${selectedReport || 'report'}-${startDate}-to-${endDate}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('toast.reportDownloaded'));
    } catch {
      toast.error(t('toast.failedToGenerate'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickExport = async (format: 'pdf' | 'csv' | 'excel' | 'json') => {
    if (!currentSpace?.id) {
      toast.error(t('toast.selectSpaceFirst'));
      return;
    }

    setIsGenerating(true);

    try {
      let blob: Blob;
      const spaceId = currentSpace.id;

      if (format === 'csv') {
        blob = await reportsApi.downloadCsvExport(spaceId, startDate, endDate);
      } else if (format === 'excel') {
        blob = await reportsApi.downloadExcelExport(spaceId, startDate, endDate);
      } else if (format === 'json') {
        blob = await reportsApi.downloadJsonExport(spaceId, startDate, endDate);
      } else {
        blob = await reportsApi.downloadPdfReport(spaceId, startDate, endDate);
      }

      const ext = format === 'excel' ? 'xlsx' : format;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhanam-report-${startDate}-to-${endDate}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('toast.reportDownloaded'));
    } catch {
      toast.error(t('toast.failedToDownload'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateReport = async () => {
    if (!currentSpace?.id) return;

    setIsCreating(true);
    try {
      await reportsApi.createSavedReport({
        spaceId: currentSpace.id,
        name: createForm.name,
        description: createForm.description || undefined,
        type: createForm.type,
        format: createForm.format,
        filters: { startDate, endDate },
      });
      setCreateDialogOpen(false);
      setCreateForm({ name: '', description: '', type: 'monthly_spending', format: 'pdf' });
      refreshSavedReports();
      toast.success(t('toast.reportConfigSaved'));
    } catch {
      toast.error(t('toast.failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentSpace) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{t('emptyState.noSpaceSelected')}</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          {t('emptyState.selectSpacePrompt')}
        </p>
      </div>
    );
  }

  const hasError = isErrorReports || isErrorSaved || isErrorShared;

  if (hasError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{tCommon('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{tCommon('loadFailed')}</p>
            <Button
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: ['available-reports', currentSpace?.id],
                });
                queryClient.invalidateQueries({ queryKey: ['saved-reports', currentSpace?.id] });
                queryClient.invalidateQueries({ queryKey: ['shared-reports'] });
              }}
            >
              {tCommon('tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <InvestorReportPanel spaceId={currentSpace.id} startDate={startDate} endDate={endDate} />

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('quickExport.title')}
          </CardTitle>
          <CardDescription>{t('quickExport.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">{t('quickExport.startDate')}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">{t('quickExport.endDate')}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleQuickExport('pdf')}
                disabled={isGenerating}
                variant="default"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileType className="mr-2 h-4 w-4" />
                )}
                {t('quickExport.pdfReport')}
              </Button>
              <Button
                onClick={() => handleQuickExport('csv')}
                disabled={isGenerating}
                variant="outline"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                {t('quickExport.csvExport')}
              </Button>
              <Button
                onClick={() => handleQuickExport('excel')}
                disabled={isGenerating}
                variant="outline"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                {t('quickExport.excelExport')}
              </Button>
              <Button
                onClick={() => handleQuickExport('json')}
                disabled={isGenerating}
                variant="outline"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="mr-2 h-4 w-4" />
                )}
                {t('quickExport.jsonExport')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('saved.heading')}</h2>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('saved.createReport')}
          </Button>
        </div>

        {loadingSaved ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : savedReports && savedReports.length > 0 ? (
          <div className="space-y-3">
            {savedReports.map((report) => (
              <SavedReportCard
                key={report.id}
                report={report}
                onGenerate={refreshSavedReports}
                onShare={() => setShareDialogReport(report)}
                onShowHistory={() => {
                  setHistoryReportId(historyReportId === report.id ? null : report.id);
                }}
                onDeleted={refreshSavedReports}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('saved.noSavedReports')}</p>
                <p className="text-sm">{t('saved.noSavedReportsDesc')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expanded History / Sharing Panels */}
      {historyReportId && (
        <div className="space-y-4">
          <ReportHistoryPanel reportId={historyReportId} onGenerate={refreshSavedReports} />
          <div className="grid gap-4 md:grid-cols-2">
            <ShareManagementPanel reportId={historyReportId} onUpdate={refreshSavedReports} />
            <ShareLinkPanel reportId={historyReportId} onUpdate={refreshSavedReports} />
          </div>
        </div>
      )}

      {/* Shared With Me */}
      {!loadingShared && sharedWithMe && sharedWithMe.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('saved.sharedWithMe')}
          </h2>
          <div className="space-y-3">
            {sharedWithMe.map((report) => (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.name}</h3>
                        {report.description && (
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('saved.sharedBy', { name: report.sharedBy.name })} &middot;{' '}
                          {t('saved.role', { role: report.shareRole })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHistoryReportId(historyReportId === report.id ? null : report.id);
                      }}
                    >
                      {t('saved.view')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Report Templates */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('templates.heading')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedReport === template.id;

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedReport(isSelected ? null : template.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{template.name}</h3>
                        <span className="text-xs uppercase text-muted-foreground bg-muted px-2 py-1 rounded">
                          {template.format}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('custom.title')}
          </CardTitle>
          <CardDescription>{t('custom.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('custom.dateRange')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  aria-label={t('quickExport.startDate')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  aria-label={t('quickExport.endDate')}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('custom.format')}</Label>
              <Select
                value={exportFormat}
                onValueChange={(value: 'pdf' | 'csv' | 'excel' | 'json') => setExportFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">{t('quickExport.pdfReport')}</SelectItem>
                  <SelectItem value="csv">{t('quickExport.csvExport')}</SelectItem>
                  <SelectItem value="excel">{t('quickExport.excelSpreadsheet')}</SelectItem>
                  <SelectItem value="json">{t('quickExport.jsonData')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleGenerateReport} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('custom.generating')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('custom.generateReport')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : availableReports?.reports && availableReports.reports.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('available.title')}</CardTitle>
            <CardDescription>{t('available.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableReports.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {report.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Download ${report.name}`}
                    onClick={() => handleQuickExport(report.type as 'pdf' | 'csv')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Share Report Dialog */}
      {shareDialogReport && (
        <ShareReportDialog
          report={shareDialogReport}
          open={!!shareDialogReport}
          onOpenChange={(open) => {
            if (!open) setShareDialogReport(null);
          }}
          onShared={refreshSavedReports}
        />
      )}

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('createDialog.title')}</DialogTitle>
            <DialogDescription>{t('createDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">{t('createDialog.reportName')}</Label>
              <Input
                id="report-name"
                placeholder={t('createDialog.reportNamePlaceholder')}
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-desc">{t('createDialog.reportDescription')}</Label>
              <Input
                id="report-desc"
                placeholder={t('createDialog.reportDescriptionPlaceholder')}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>{t('createDialog.reportType')}</Label>
                <Select
                  value={createForm.type}
                  onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_spending">
                      {t('createDialog.monthlySpending')}
                    </SelectItem>
                    <SelectItem value="quarterly_net_worth">
                      {t('createDialog.quarterlyNetWorth')}
                    </SelectItem>
                    <SelectItem value="annual_tax">{t('createDialog.annualTax')}</SelectItem>
                    <SelectItem value="custom">{t('createDialog.custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('createDialog.format')}</Label>
                <Select
                  value={createForm.format}
                  onValueChange={(value: 'pdf' | 'csv' | 'excel' | 'json') =>
                    setCreateForm({ ...createForm, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateReport} disabled={isCreating || !createForm.name}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t('saved.createReport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
