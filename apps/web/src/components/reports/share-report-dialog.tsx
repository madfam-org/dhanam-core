'use client';

import { Share2, Loader2, CheckCircle } from 'lucide-react';
import type { ChangeEvent, ReactElement } from 'react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { reportsApi, type SavedReport } from '@/lib/api/reports';

interface ShareReportDialogProps {
  report: SavedReport;
  onShared?: () => void;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShareReportDialog({
  report,
  onShared,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ShareReportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shareWithEmail: '',
    role: 'viewer' as 'viewer' | 'editor' | 'manager',
    message: '',
  });

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await reportsApi.shareReport(report.id, {
        shareWithEmail: formData.shareWithEmail,
        role: formData.role,
        message: formData.message || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setFormData({ shareWithEmail: '', role: 'viewer', message: '' });
        setSuccess(false);
        if (onShared) onShared();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share report');
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions = {
    viewer: 'Can view and download report outputs',
    editor: 'Can view, download, and edit report configuration',
    manager: 'Full access including sharing with others',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share &quot;{report.name}&quot;</DialogTitle>
          <DialogDescription>
            Invite someone to access this saved report. They&apos;ll receive an invitation to
            accept.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <p className="text-lg font-semibold">Report shared successfully!</p>
            <p className="text-sm text-muted-foreground">
              An invitation has been sent to {formData.shareWithEmail}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={formData.shareWithEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, shareWithEmail: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter the email of the person you want to share with
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Permission Level</Label>
              <Select
                value={formData.role}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, role: value as 'viewer' | 'editor' | 'manager' })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{roleDescriptions[formData.role]}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Check out this financial report!"
                value={formData.message}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={loading || !formData.shareWithEmail}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Report
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
