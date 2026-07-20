'use client';

import { formatDistanceToNow } from 'date-fns';
import { Users, MoreVertical, Trash2, Loader2 } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoals, type GoalShare } from '@/hooks/useGoals';

interface ShareManagementPanelProps {
  goalId: string;
  onUpdate?: () => void;
}

export function ShareManagementPanel({ goalId, onUpdate }: ShareManagementPanelProps) {
  const { getGoalShares, updateShareRole, revokeShare } = useGoals();
  const [shares, setShares] = useState<GoalShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedShare, setSelectedShare] = useState<GoalShare | null>(null);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoalShares(goalId);
      if (data) {
        setShares(data);
      }
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  }, [goalId, getGoalShares]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleRoleChange = async (share: GoalShare, newRole: string) => {
    try {
      await updateShareRole(share.id, newRole as GoalShare['role']);
      await loadShares();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRevoke = async () => {
    if (!selectedShare) return;

    try {
      await revokeShare(selectedShare.id);
      setRevokeDialogOpen(false);
      setSelectedShare(null);
      await loadShares();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to revoke share:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
    const variants: Record<string, { variant: BadgeVariant; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      accepted: { variant: 'default', label: 'Active' },
      declined: { variant: 'destructive', label: 'Declined' },
      revoked: { variant: 'outline', label: 'Revoked' },
    };

    const config = variants[status] ||
      variants.pending || { variant: 'secondary' as BadgeVariant, label: 'Unknown' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      viewer: 'bg-muted text-muted-foreground',
      contributor: 'bg-info/10 text-info',
      editor: 'bg-accent text-accent-foreground',
      manager: 'bg-success/10 text-success',
    };

    return (
      <Badge variant="outline" className={colors[role] || ''}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared With
          </CardTitle>
          <CardDescription>Manage who has access to this goal</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const activeShares = shares.filter((s) => s.status === 'accepted');
  const pendingShares = shares.filter((s) => s.status === 'pending');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared With ({activeShares.length})
          </CardTitle>
          <CardDescription>Manage who has access to this goal</CardDescription>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Not shared with anyone yet</p>
              <p className="text-sm">Share this goal to collaborate with others</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Shares */}
              {activeShares.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Active Collaborators</h4>
                  {activeShares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(share.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{share.user.name}</p>
                          <p className="text-sm text-muted-foreground">{share.user.email}</p>
                          {share.message && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              "{share.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Selector */}
                        <Select
                          value={share.role}
                          onValueChange={(value: string) => handleRoleChange(share, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="contributor">Contributor</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedShare(share);
                                setRevokeDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invitations */}
              {pendingShares.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Pending Invitations</h4>
                  {pendingShares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 border border-dashed rounded-lg opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(share.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{share.user.name}</p>
                          <p className="text-sm text-muted-foreground">{share.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Invited{' '}
                            {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getRoleBadge(share.role)}
                        {getStatusBadge(share.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke {selectedShare?.user.name}'s access to this goal? They
              will no longer be able to view or collaborate on it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
