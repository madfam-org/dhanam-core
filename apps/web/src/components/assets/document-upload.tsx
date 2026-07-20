'use client';

import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { documentsApi, type DocumentMetadata, type DocumentConfig } from '@/lib/api/documents';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  spaceId: string;
  assetId: string;
  config: DocumentConfig;
  onUploadComplete?: (document: DocumentMetadata) => void;
  onError?: (error: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  deed: 'Deed / Title',
  title: 'Title Certificate',
  appraisal: 'Appraisal Report',
  insurance: 'Insurance Policy',
  contract: 'Contract',
  receipt: 'Receipt / Invoice',
  statement: 'Statement',
  certificate: 'Certificate',
  photo: 'Photo',
  general: 'General Document',
};

export function DocumentUpload({
  spaceId,
  assetId,
  config,
  onUploadComplete,
  onError,
}: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!config.allowedFileTypes.includes(file.type)) {
        return `File type "${file.type}" is not allowed`;
      }
      if (file.size > config.maxFileSizeMB * 1024 * 1024) {
        return `File size exceeds ${config.maxFileSizeMB}MB limit`;
      }
      return null;
    },
    [config]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setUploadingFiles((prev) => [...prev, { file, progress: 0, status: 'error', error }]);
        onError?.(error);
        return;
      }

      const fileEntry: UploadingFile = { file, progress: 0, status: 'uploading' };
      setUploadingFiles((prev) => [...prev, fileEntry]);

      try {
        const document = await documentsApi.uploadFile(
          spaceId,
          assetId,
          file,
          selectedCategory,
          (progress) => {
            setUploadingFiles((prev) =>
              prev.map((f) => (f.file === file ? { ...f, progress } : f))
            );
          }
        );

        setUploadingFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, progress: 100, status: 'complete' } : f))
        );

        onUploadComplete?.(document);

        // Remove completed file after delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setUploadingFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, status: 'error', error: errorMessage } : f))
        );
        onError?.(errorMessage);
      }
    },
    [spaceId, assetId, selectedCategory, validateFile, onUploadComplete, onError]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeFile = useCallback((file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  }, []);

  if (!config.available) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Document storage is not configured. Contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="document-category-select" className="text-sm font-medium">
          Document Category:
        </label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger id="document-category-select" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {config.categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Max file size: {config.maxFileSizeMB}MB. Allowed: PDF, Images, Office documents
        </p>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.allowedFileTypes.join(',')}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                item.status === 'error' && 'border-destructive bg-destructive/5',
                item.status === 'complete' && 'border-green-500 bg-green-50'
              )}
            >
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="h-1 mt-1" />
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-destructive">{item.error}</p>
                )}
              </div>
              {item.status === 'complete' && <Check className="h-5 w-5 text-green-500" />}
              {item.status === 'error' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(item.file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
