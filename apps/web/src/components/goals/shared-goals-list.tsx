'use client';

import { Users, Loader2, Target } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoals, type Goal } from '@/hooks/useGoals';

interface SharedGoalsListProps {
  onGoalClick?: (goal: Goal) => void;
}

export function SharedGoalsList({ onGoalClick }: SharedGoalsListProps) {
  const { getSharedGoals } = useGoals();
  // Shared goals API returns Goal shape extended with owner metadata
  type SharedGoal = Goal & {
    shareRole: string;
    sharedBy: { name: string; email: string };
    currentProgress?: number;
    currentProbability?: number;
  };
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSharedGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSharedGoals();
      if (data) {
        // API returns Goal with extra shared metadata (shareRole, sharedBy, etc.)
        setSharedGoals(data as SharedGoal[]);
      }
    } catch (error) {
      console.error('Failed to load shared goals:', error);
    } finally {
      setLoading(false);
    }
  }, [getSharedGoals]);

  useEffect(() => {
    loadSharedGoals();
  }, [loadSharedGoals]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared With Me
          </CardTitle>
          <CardDescription>Goals others have shared with you</CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Shared With Me ({sharedGoals.length})
        </CardTitle>
        <CardDescription>Goals others have shared with you</CardDescription>
      </CardHeader>
      <CardContent>
        {sharedGoals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shared goals yet</p>
            <p className="text-sm">When someone shares a goal with you, it will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                onClick={() => onGoalClick && onGoalClick(goal)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onGoalClick) onGoalClick(goal);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold">{goal.name}</h4>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                  </div>
                  {getRoleBadge(goal.shareRole)}
                </div>

                {/* Shared By */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(goal.sharedBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Shared by {goal.sharedBy.name}
                  </span>
                </div>

                {/* Progress */}
                {goal.currentProgress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.currentProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={goal.currentProgress} className="h-2" />
                  </div>
                )}

                {/* Goal Details */}
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Target Amount</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(
                        typeof goal.targetAmount === 'number'
                          ? goal.targetAmount
                          : parseFloat(goal.targetAmount),
                        goal.currency
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Target Date</p>
                    <p className="text-sm font-medium">
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Probability */}
                {goal.currentProbability !== undefined && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Success Probability</span>
                      <span className="text-lg font-bold">
                        {goal.currentProbability.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
