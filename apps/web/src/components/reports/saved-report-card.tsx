'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  MoreVertical,
  Play,
  Share2,
  History,
  Trash2,
  Loader2,
  Users,
} from 'lucide-react';
import { useState } from 'react';

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
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { reportsApi, type SavedReport } from '@/lib/api/reports';

interface SavedReportCardProps {
  report: SavedReport;
  onGenerate?: () => void;
  onShare?: () => void;
  onShowHistory?: () => void;
  onDeleted?: () => void;
}

export function SavedReportCard({
  report,
  onGenerate,
  onShare,
  onShowHistory,
  onDeleted,
}: SavedReportCardProps) {
  const [generating, setGenerating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await reportsApi.generateSavedReport(report.id);
      window.open(result.downloadUrl, '_blank');
      if (onGenerate) onGenerate();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await reportsApi.deleteSavedReport(report.id);
      setDeleteDialogOpen(false);
      if (onDeleted) onDeleted();
    } catch (error) {
      console.error('Failed to delete report:', error);
    } finally {
      setDeleting(false);
    }
  };

  const lastGenerated = report.generatedReports?.[0];

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{report.name}</h3>
                  <Badge variant="outline" className="text-xs uppercase shrink-0">
                    {report.format}
                  </Badge>
                  {report.isShared && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                </div>
                {report.description && (
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {report.schedule && <span>Schedule: {report.schedule}</span>}
                  {lastGenerated && (
                    <span>
                      Last generated{' '}
                      {formatDistanceToNow(new Date(lastGenerated.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  {report._count && <span>{report._count.generatedReports} reports generated</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="default" size="sm" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Generate
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Open actions for ${report.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShowHistory}>
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{report.name}&quot;? This will also delete all
              generated report files and share links. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
