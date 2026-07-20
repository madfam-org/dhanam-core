'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Store, Search, Pencil, Merge } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { transactionsApi, MerchantInfo } from '@/lib/api/transactions';
import { formatDate } from '@/lib/utils';
import { useSpaceStore } from '@/stores/space';

export default function MerchantsSettingsPage() {
  const { currentSpace } = useSpaceStore();
  const spaceId = currentSpace?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [renameTarget, setRenameTarget] = useState<MerchantInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergeTargetName, setMergeTargetName] = useState('');
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);

  const { data: merchants, isLoading } = useQuery({
    queryKey: ['merchants', spaceId],
    queryFn: () => transactionsApi.getMerchants(spaceId!),
    enabled: !!spaceId,
  });

  const renameMutation = useMutation({
    mutationFn: ({ oldName, newName: name }: { oldName: string; newName: string }) =>
      transactionsApi.renameMerchant(spaceId!, oldName, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', spaceId] });
      setRenameTarget(null);
      setNewName('');
      toast.success(`Renamed merchant. ${data.updated} transaction(s) updated.`);
    },
    onError: () => {
      toast.error('Failed to rename merchant');
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({ sourceNames, targetName }: { sourceNames: string[]; targetName: string }) =>
      transactionsApi.mergeMerchants(spaceId!, sourceNames, targetName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', spaceId] });
      setIsMergeDialogOpen(false);
      setSelectedForMerge([]);
      setMergeTargetName('');
      setIsMergeMode(false);
      toast.success(`Merchants merged. ${data.merged} transaction(s) updated.`);
    },
    onError: () => {
      toast.error('Failed to merge merchants');
    },
  });

  const filteredMerchants = useMemo(() => {
    if (!merchants) return [];
    if (!search) return merchants;
    const lower = search.toLowerCase();
    return merchants.filter((m) => m.name.toLowerCase().includes(lower));
  }, [merchants, search]);

  const toggleMergeSelect = (name: string) => {
    setSelectedForMerge((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const openMergeDialog = () => {
    if (selectedForMerge.length < 2) {
      toast.error('Select at least 2 merchants to merge');
      return;
    }
    setMergeTargetName(selectedForMerge[0] || '');
    setIsMergeDialogOpen(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newName.trim()) return;
    renameMutation.mutate({ oldName: renameTarget.name, newName: newName.trim() });
  };

  const handleMergeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeTargetName.trim() || selectedForMerge.length < 2) return;
    mergeMutation.mutate({
      sourceNames: selectedForMerge,
      targetName: mergeTargetName.trim(),
    });
  };

  if (!spaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Store className="h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No space selected</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Select a space to manage merchants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchants</h1>
          <p className="text-muted-foreground">
            Manage merchant names across your transactions. Rename or merge duplicates.
          </p>
        </div>
        <div className="flex gap-2">
          {isMergeMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMergeMode(false);
                  setSelectedForMerge([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={openMergeDialog} disabled={selectedForMerge.length < 2}>
                <Merge className="mr-2 h-4 w-4" />
                Merge Selected ({selectedForMerge.length})
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsMergeMode(true)}>
              <Merge className="mr-2 h-4 w-4" />
              Merge Merchants
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search merchants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !filteredMerchants || filteredMerchants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {search ? 'No merchants found' : 'No merchants yet'}
            </h3>
            <p className="text-muted-foreground text-center">
              {search
                ? 'Try a different search term.'
                : 'Merchants will appear here as you add transactions.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Merchants</CardTitle>
            <CardDescription>
              {filteredMerchants.length} merchant{filteredMerchants.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredMerchants.map((merchant) => (
                <div
                  key={merchant.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isMergeMode && (
                      <Checkbox
                        checked={selectedForMerge.includes(merchant.name)}
                        onCheckedChange={() => toggleMergeSelect(merchant.name)}
                      />
                    )}
                    <div>
                      <p className="font-medium">{merchant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(merchant.firstSeen)} - {formatDate(merchant.lastSeen)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {merchant.transactionCount} transaction
                      {merchant.transactionCount !== 1 ? 's' : ''}
                    </Badge>
                    {!isMergeMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenameTarget(merchant);
                          setNewName(merchant.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Merchant</DialogTitle>
              <DialogDescription>
                All transactions from &ldquo;{renameTarget?.name}&rdquo; will be updated to the new
                name.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-merchant-name">New Name</Label>
                <Input
                  id="new-merchant-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new merchant name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renameMutation.isPending}>
                {renameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <form onSubmit={handleMergeSubmit}>
            <DialogHeader>
              <DialogTitle>Merge Merchants</DialogTitle>
              <DialogDescription>
                Merge {selectedForMerge.length} merchants into one. All transactions will be
                updated.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label className="mb-2 block">Selected merchants:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedForMerge.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="merge-target-name">Target Name</Label>
                <Input
                  id="merge-target-name"
                  value={mergeTargetName}
                  onChange={(e) => setMergeTargetName(e.target.value)}
                  placeholder="Enter the final merchant name"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  All selected merchants will be renamed to this name.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMergeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mergeMutation.isPending}>
                {mergeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Merge Merchants
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
