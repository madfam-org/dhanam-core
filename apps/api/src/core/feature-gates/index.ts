// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Open-core feature gates.
//
// dhanam-core is self-hosted and unmetered: every feature is available. The
// decorators and guards below keep the public surface the application
// controllers expect, but are deliberate no-ops (guards allow every request;
// decorators attach no metadata) so the domain controllers compile and run
// unchanged.

import { CanActivate, Injectable } from '@nestjs/common';

/** No-op method/class decorator factory (accepts and ignores any arguments). */
function noopDecorator(..._args: unknown[]): MethodDecorator & ClassDecorator {
  return () => {
    /* no-op: feature gating is disabled in the open core */
  };
}

/** Marks a route as requiring a named feature. No-op in open core. */
export const RequiresFeature = noopDecorator;

/** Records a metered-usage event for a route. No-op in open core. */
export const TrackUsage = noopDecorator;

/** Guard that always allows the request (feature gating disabled in open core). */
@Injectable()
export class FeatureGateGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

@Injectable()
export class UsageLimitGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

@Injectable()
export class SpaceLimitGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

/**
 * Upper bound (in days) for cashflow-forecast horizons. In the proprietary
 * build this was tier-dependent; the open core uses a single generous default.
 */
export const CASHFLOW_FORECAST_MAX_DAYS = 365;

/**
 * Names of operations that were metered in the proprietary build. Retained as a
 * plain enum so the (now no-op) `@TrackUsage(...)` decorators keep a stable,
 * well-typed argument. Nothing is metered in the open core.
 */
export enum UsageMetricType {
  monte_carlo_simulation = 'monte_carlo_simulation',
  goal_probability = 'goal_probability',
  scenario_analysis = 'scenario_analysis',
  api_request = 'api_request',
}
