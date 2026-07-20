'use client';

import { formatDistanceToNow } from 'date-fns';
import { Link2, Copy, Trash2, Loader2, Plus, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reportsApi, type ShareToken } from '@/lib/api/reports';

interface ShareLinkPanelProps {
  reportId: string;
  onUpdate?: () => void;
}

export function ShareLinkPanel({ reportId, onUpdate }: ShareLinkPanelProps) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [expiresInHours, setExpiresInHours] = useState(168);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getShareLinks(reportId);
      setTokens(data);
    } catch (error) {
      console.error('Failed to load share links:', error);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await reportsApi.createShareLink(reportId, { expiresInHours });
      setTokens((prev) => [result, ...prev]);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (token: ShareToken) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/public/report/${token.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async () => {
    if (!selectedTokenId) return;
    try {
      await reportsApi.revokeShareLink(selectedTokenId);
      setRevokeDialogOpen(false);
      setSelectedTokenId(null);
      await loadTokens();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to revoke share link:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Links
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Links ({tokens.length})
          </CardTitle>
          <CardDescription>
            Create shareable links that allow anyone to download this report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="expires">Expires in (hours)</Label>
              <Input
                id="expires"
                type="number"
                min={1}
                max={720}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseInt(e.target.value) || 168)}
                className="w-32"
              />
            </div>
            <Button onClick={handleCreate} disabled={creating} size="sm">
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Link
            </Button>
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Link2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active share links</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-mono truncate max-w-[200px]">
                      ...{token.token.slice(-12)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {token.accessCount} views
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Expires{' '}
                        {formatDistanceToNow(new Date(token.expiresAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy share link"
                      onClick={() => handleCopy(token)}
                    >
                      {copiedId === token.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Revoke share link"
                      onClick={() => {
                        setSelectedTokenId(token.id);
                        setRevokeDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this share link? Anyone who has the link will no
              longer be able to access the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive hover:bg-destructive/90"
            >
              Revoke Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
