'use client';

import { formatDistanceToNow } from 'date-fns';
import { History, Download, Loader2, FileText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportsApi, type GeneratedReport } from '@/lib/api/reports';

interface ReportHistoryPanelProps {
  reportId: string;
  onGenerate?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportHistoryPanel({ reportId, onGenerate }: ReportHistoryPanelProps) {
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getReportHistory(reportId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load report history:', error);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await reportsApi.generateSavedReport(reportId);
      // Open download URL
      window.open(result.downloadUrl, '_blank');
      await loadHistory();
      if (onGenerate) onGenerate();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (generatedId: string) => {
    setDownloadingId(generatedId);
    try {
      const result = await reportsApi.downloadGeneratedReport(generatedId);
      window.open(result.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download report:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Report History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Report History ({history.length})
            </CardTitle>
            <CardDescription>Previously generated report files</CardDescription>
          </div>
          <Button onClick={handleGenerate} disabled={generating} size="sm">
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Generate Now
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No reports generated yet</p>
            <p className="text-xs">Click &quot;Generate Now&quot; to create your first report</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs uppercase">
                        {report.format}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(report.fileSize)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generated{' '}
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      {report.generator && ` by ${report.generator.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.downloadCount} downloads
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Download ${report.format.toUpperCase()} report generated ${new Date(
                    report.createdAt
                  ).toLocaleDateString()}`}
                  onClick={() => handleDownload(report.id)}
                  disabled={downloadingId === report.id}
                >
                  {downloadingId === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
