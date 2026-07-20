'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { documentsApi, type DocumentMetadata } from '@/lib/api/documents';

interface DocumentListProps {
  spaceId: string;
  assetId: string;
  documents: DocumentMetadata[];
  onDocumentDeleted?: (documentKey: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  deed: 'Deed',
  title: 'Title',
  appraisal: 'Appraisal',
  insurance: 'Insurance',
  contract: 'Contract',
  receipt: 'Receipt',
  statement: 'Statement',
  certificate: 'Certificate',
  photo: 'Photo',
  general: 'General',
};

const CATEGORY_COLORS: Record<string, string> = {
  deed: 'bg-blue-100 text-blue-800',
  title: 'bg-purple-100 text-purple-800',
  appraisal: 'bg-green-100 text-green-800',
  insurance: 'bg-yellow-100 text-yellow-800',
  contract: 'bg-red-100 text-red-800',
  receipt: 'bg-orange-100 text-orange-800',
  statement: 'bg-cyan-100 text-cyan-800',
  certificate: 'bg-indigo-100 text-indigo-800',
  photo: 'bg-pink-100 text-pink-800',
  general: 'bg-gray-100 text-gray-800',
};

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-pink-500" />;
  }
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  return <FileText className="h-8 w-8 text-blue-500" />;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  spaceId,
  assetId,
  documents,
  onDocumentDeleted,
}: DocumentListProps) {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentMetadata) => {
    setDownloadingKey(doc.key);
    try {
      const downloadUrl = await documentsApi.getDownloadUrl(spaceId, assetId, doc.key);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDelete = async (documentKey: string) => {
    setDeletingKey(documentKey);
    try {
      await documentsApi.deleteDocument(spaceId, assetId, documentKey);
      onDocumentDeleted?.(documentKey);
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingKey(null);
      setDeleteConfirmKey(null);
    }
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload documents like deeds, appraisals, and insurance policies
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group documents by category
  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      const category = doc.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, DocumentMetadata[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedDocuments).map(([category, docs]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[category] || CATEGORY_COLORS.general}>
              {CATEGORY_LABELS[category] || category}
            </Badge>
            <span>({docs.length})</span>
          </h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <Card key={doc.key} className="relative group">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    {getFileIcon(doc.fileType)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate" title={doc.filename}>
                        {doc.filename}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatFileSize(doc.fileSize)} •{' '}
                        {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          {downloadingKey === doc.key ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in new tab
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteConfirmKey(doc.key)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmKey} onOpenChange={() => setDeleteConfirmKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmKey && handleDelete(deleteConfirmKey)}
              disabled={!!deletingKey}
            >
              {deletingKey ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
