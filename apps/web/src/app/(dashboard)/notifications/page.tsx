'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  AlertTriangle,
  Lightbulb,
  Trophy,
  Info,
  Clock,
  type LucideIcon,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, LucideIcon> = {
  alert: AlertTriangle,
  warning: AlertTriangle,
  insight: Lightbulb,
  achievement: Trophy,
  income: Trophy,
  reminder: Clock,
  status: Info,
  demo: Info,
  onboarding: Info,
  default: Bell,
};

const typeToTab: Record<string, string> = {
  alert: 'alerts',
  warning: 'alerts',
  insight: 'insights',
  achievement: 'insights',
  income: 'insights',
  reminder: 'reminders',
  status: 'reminders',
};

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = today - 7 * 86400000;

  const groups: Record<string, Notification[]> = { today: [], thisWeek: [], earlier: [] };

  for (const n of notifications) {
    const ts = new Date(n.createdAt).getTime();
    if (ts >= today) groups['today']?.push(n);
    else if (ts >= weekAgo) groups['thisWeek']?.push(n);
    else groups['earlier']?.push(n);
  }

  return groups;
}

const GROUP_LABEL_KEYS: Record<string, string> = {
  today: 'today',
  thisWeek: 'thisWeek',
  earlier: 'earlier',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  const { data: notifications = [], isError } = useQuery<Notification[]>({
    queryKey: ['notifications-all'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=50', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load notifications');
      return res.json();
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications/mark-all-read', { method: 'POST', credentials: 'include' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderGroup = (items: Notification[]) => {
    if (items.length === 0) return null;
    return items.map((n) => {
      const Icon = typeIcons[n.type] ?? Bell;
      return (
        <div
          key={n.id}
          className={`flex gap-3 p-4 rounded-lg border ${!n.read ? 'bg-muted/30 border-primary/20' : ''}`}
        >
          <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>{n.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(n.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      );
    });
  };

  const renderNotificationList = (items: Notification[]) => {
    const groups = groupByDate(items);
    return (
      <div className="space-y-6">
        {Object.entries(groups).map(([key, groupItems]) =>
          groupItems.length > 0 ? (
            <div key={key}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t(GROUP_LABEL_KEYS[key] ?? key)}
              </h3>
              <div className="space-y-2">{renderGroup(groupItems)}</div>
            </div>
          ) : null
        )}
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">{t('noNotifications')}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('notifications')}</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? t('unreadCount', { count: unreadCount }) : t('allCaughtUp')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <Check className="mr-2 h-4 w-4" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('somethingWentWrong')}</h3>
            <p className="text-muted-foreground text-center mb-4">{t('loadFailed')}</p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications-all'] })}
            >
              {t('tryAgain')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('alerts')}</TabsTrigger>
            <TabsTrigger value="insights">{t('insights')}</TabsTrigger>
            <TabsTrigger value="reminders">{t('reminders')}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderNotificationList(notifications)}
          </TabsContent>
          <TabsContent value="alerts" className="mt-4">
            {renderNotificationList(notifications.filter((n) => typeToTab[n.type] === 'alerts'))}
          </TabsContent>
          <TabsContent value="insights" className="mt-4">
            {renderNotificationList(notifications.filter((n) => typeToTab[n.type] === 'insights'))}
          </TabsContent>
          <TabsContent value="reminders" className="mt-4">
            {renderNotificationList(notifications.filter((n) => typeToTab[n.type] === 'reminders'))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
