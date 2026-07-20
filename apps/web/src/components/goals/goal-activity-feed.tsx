'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Share2,
  UserMinus,
  Target,
  Calendar,
  DollarSign,
  Edit,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoals, type GoalActivity } from '@/hooks/useGoals';

interface GoalActivityFeedProps {
  goalId: string;
}

export function GoalActivityFeed({ goalId }: GoalActivityFeedProps) {
  const { getGoalActivities } = useGoals();
  const [activities, setActivities] = useState<GoalActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoalActivities(goalId);
      if (data) {
        setActivities(data);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  }, [goalId, getGoalActivities]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Target className="h-4 w-4" />;
      case 'updated':
        return <Edit className="h-4 w-4" />;
      case 'shared':
      case 'share_accepted':
        return <Share2 className="h-4 w-4" />;
      case 'share_declined':
        return <UserMinus className="h-4 w-4" />;
      case 'contribution_added':
        return <DollarSign className="h-4 w-4" />;
      case 'probability_improved':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'probability_declined':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'milestone_reached':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'target_date_extended':
      case 'target_amount_adjusted':
        return <Calendar className="h-4 w-4" />;
      case 'achieved':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    if (
      action.includes('probability_improved') ||
      action.includes('milestone') ||
      action === 'achieved'
    ) {
      return 'text-success';
    }
    if (action.includes('probability_declined') || action.includes('declined')) {
      return 'text-destructive';
    }
    if (action.includes('shared') || action.includes('accepted')) {
      return 'text-info';
    }
    return 'text-muted-foreground';
  };

  const formatActivityMessage = (activity: GoalActivity): string => {
    const userName = activity.user.name;

    switch (activity.action) {
      case 'created':
        return `${userName} created this goal`;
      case 'updated':
        return `${userName} updated goal parameters`;
      case 'shared':
        return `${userName} shared this goal with ${activity.metadata?.sharedWith || 'someone'}`;
      case 'share_accepted':
        return `${userName} accepted the invitation`;
      case 'share_declined':
        return `${userName} declined the invitation`;
      case 'contribution_added':
        return `${userName} made a contribution`;
      case 'probability_improved':
        return `Probability increased! Now more likely to achieve this goal`;
      case 'probability_declined':
        return `Probability decreased - may need to adjust contributions`;
      case 'milestone_reached':
        return `${userName} reached ${activity.metadata?.milestone || 'a milestone'}!`;
      case 'target_date_extended':
        return `${userName} extended the target date`;
      case 'target_amount_adjusted':
        return `${userName} adjusted the target amount`;
      case 'allocation_updated':
        return `${userName} updated account allocations`;
      case 'what_if_scenario_run':
        return `${userName} ran a what-if scenario`;
      case 'comment_added':
        return `${userName} added a comment`;
      case 'achieved':
        return `Goal achieved! 🎉`;
      case 'paused':
        return `${userName} paused this goal`;
      case 'abandoned':
        return `${userName} marked this goal as abandoned`;
      default:
        return `${userName} performed an action`;
    }
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
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Recent updates and changes to this goal</CardDescription>
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
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>Recent updates and changes to this goal</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities yet</p>
            <p className="text-sm">Activity will appear here as you work on this goal</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={getActivityColor(activity.action)}>
                        {getActivityIcon(activity.action)}
                      </div>
                      <p className="text-sm">{formatActivityMessage(activity)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Metadata badges */}
                  {activity.metadata && (
                    <div className="flex gap-2 mt-1">
                      {activity.metadata.role && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.role}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider line (except for last item) */}
                {index < activities.length - 1 && (
                  <div className="absolute left-[20px] mt-10 h-full w-px bg-border -ml-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
