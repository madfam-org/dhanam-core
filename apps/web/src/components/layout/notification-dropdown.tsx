'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, AlertTriangle, Lightbulb, Trophy, Info, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4010/v1';

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
  default: Info,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function NotificationDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('common');

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = localStorage.getItem('dhanam_access_token');
      const res = await fetch(`${API_BASE}/notifications?limit=5`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      try {
        return await res.json();
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('dhanam_access_token');
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old ? old.map((n) => ({ ...n, read: true })) : []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('aria.notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">You&apos;re all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] ?? Info;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer ${
                    !n.read ? 'bg-muted/30' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-tight ${!n.read ? 'font-semibold' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t px-4 py-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false);
              router.push('/notifications');
            }}
          >
            See all notifications
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => {
              setOpen(false);
              router.push('/settings');
            }}
          >
            Notification Settings &rarr;
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
