'use client';

import {
  Baby,
  Briefcase,
  Car,
  Gift,
  GraduationCap,
  Heart,
  Home,
  PartyPopper,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LifeEvent } from '@/lib/api/projections';

interface LifeEventTimelineProps {
  events: LifeEvent[];
  currentYear: number;
  currency?: string;
}

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  retirement: PartyPopper,
  college: GraduationCap,
  home_purchase: Home,
  car_purchase: Car,
  wedding: Heart,
  child_birth: Baby,
  inheritance: Gift,
  business_sale: Briefcase,
  custom: Sparkles,
};

const EVENT_COLORS: Record<string, string> = {
  retirement: 'bg-purple-100 text-purple-800 border-purple-300',
  college: 'bg-blue-100 text-blue-800 border-blue-300',
  home_purchase: 'bg-green-100 text-green-800 border-green-300',
  car_purchase: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  wedding: 'bg-pink-100 text-pink-800 border-pink-300',
  child_birth: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  inheritance: 'bg-orange-100 text-orange-800 border-orange-300',
  business_sale: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  custom: 'bg-gray-100 text-gray-800 border-gray-300',
};

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LifeEventTimeline({
  events,
  currentYear,
  currency = 'USD',
}: LifeEventTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => a.year - b.year);

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Life Events Timeline</CardTitle>
          <CardDescription>No life events configured yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add major life events like retirement, home purchases, or college expenses to see how
            they impact your financial projection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Life Events Timeline</CardTitle>
        <CardDescription>Major financial events in your projection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {sortedEvents.map((event, index) => {
              const Icon = EVENT_ICONS[event.type] || TrendingUp;
              const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.custom;
              const isPast = event.year < currentYear;
              const isCurrent = event.year === currentYear;
              const yearsFromNow = event.year - currentYear;

              return (
                <div key={index} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                      isPast
                        ? 'bg-muted border-muted-foreground'
                        : isCurrent
                          ? 'bg-primary border-primary'
                          : 'bg-background border-primary'
                    }`}
                  />

                  {/* Event card */}
                  <div
                    className={`flex-1 p-3 rounded-lg border ${colorClass} ${isPast ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm">
                            {event.year}
                            {!isPast && (
                              <span className="text-muted-foreground ml-1">
                                ({yearsFromNow > 0 ? `in ${yearsFromNow} years` : 'this year'})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={event.amount >= 0 ? 'default' : 'destructive'}
                          className="font-mono"
                        >
                          {event.amount >= 0 ? '+' : ''}
                          {formatCurrency(event.amount, currency)}
                        </Badge>
                        {event.annualImpact && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.annualImpact >= 0 ? '+' : ''}
                            {formatCurrency(event.annualImpact, currency)}/yr
                            {event.impactDuration && ` for ${event.impactDuration} yrs`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
