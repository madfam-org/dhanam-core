import posthog from 'posthog-js';
import { useEffect } from 'react';

/**
 * Analytics Events Hook
 *
 * Provides typed methods for tracking key user events in PostHog.
 * All events follow a consistent product analytics naming convention.
 */

export interface AnalyticsEvent {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog events accept arbitrary properties by design
  properties?: Record<string, any>;
}

export function useAnalytics() {
  // Initialize PostHog if not already initialized
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      if (!posthog.__loaded) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.opt_out_capturing();
            }
          },
        });
      }
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog capture() accepts arbitrary event properties
  const track = (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(event, properties);
    }
  };

  // ============================================================================
  // CORE EVENTS
  // ============================================================================

  const trackSignUp = (userId: string, email: string, method: 'email' | 'oauth') => {
    track('sign_up', { user_id: userId, email, method });
  };

  const trackOnboardingComplete = (userId: string, duration_seconds: number) => {
    track('onboarding_complete', { user_id: userId, duration_seconds });
  };

  const trackConnectInitiated = (provider: 'belvo' | 'plaid' | 'bitso') => {
    track('connect_initiated', { provider });
  };

  const trackConnectSuccess = (provider: 'belvo' | 'plaid' | 'bitso', accounts_count: number) => {
    track('connect_success', { provider, accounts_count });
  };

  const trackSyncSuccess = (accounts_synced: number, transactions_synced: number) => {
    track('sync_success', { accounts_synced, transactions_synced });
  };

  const trackBudgetCreated = (budget_id: string, category: string, amount: number) => {
    track('budget_created', { budget_id, category, amount });
  };

  const trackRuleCreated = (rule_id: string, category: string, pattern: string) => {
    track('rule_created', { rule_id, category, pattern });
  };

  const trackTxnCategorized = (
    transaction_id: string,
    category: string,
    method: 'manual' | 'rule'
  ) => {
    track('txn_categorized', { transaction_id, category, method });
  };

  const trackAlertFired = (alert_type: string, severity: 'low' | 'medium' | 'high') => {
    track('alert_fired', { alert_type, severity });
  };

  const trackViewNetWorth = (net_worth: number) => {
    track('view_net_worth', { net_worth });
  };

  const trackExportData = (format: 'csv' | 'pdf' | 'json', record_count: number) => {
    track('export_data', { format, record_count });
  };

  // ============================================================================
  // GOAL TRACKING EVENTS
  // ============================================================================

  const trackGoalCreated = (
    goal_id: string,
    type: string,
    target_amount: number,
    months_to_target: number
  ) => {
    track('goal_created', { goal_id, type, target_amount, months_to_target });
  };

  const trackGoalUpdated = (
    goal_id: string,
    field: string,
    old_value: unknown,
    new_value: unknown
  ) => {
    track('goal_updated', { goal_id, field, old_value, new_value });
  };

  const trackGoalDeleted = (goal_id: string, type: string, was_achieved: boolean) => {
    track('goal_deleted', { goal_id, type, was_achieved });
  };

  const trackGoalProgressViewed = (
    goal_id: string,
    percent_complete: number,
    on_track: boolean
  ) => {
    track('goal_progress_viewed', { goal_id, percent_complete, on_track });
  };

  const trackGoalProbabilityCalculated = (
    goal_id: string,
    probability_of_success: number,
    median_outcome: number,
    target_amount: number
  ) => {
    track('goal_probability_calculated', {
      goal_id,
      probability_of_success,
      median_outcome,
      target_amount,
      shortfall: target_amount - median_outcome,
    });
  };

  const trackGoalAllocationAdded = (goal_id: string, account_id: string, percentage: number) => {
    track('goal_allocation_added', { goal_id, account_id, percentage });
  };

  const trackGoalAllocationRemoved = (goal_id: string, account_id: string) => {
    track('goal_allocation_removed', { goal_id, account_id });
  };

  // ============================================================================
  // SIMULATION EVENTS
  // ============================================================================

  const trackMonteCarloSimulation = (
    iterations: number,
    months: number,
    median_outcome: number,
    success_rate?: number
  ) => {
    track('monte_carlo_simulation', { iterations, months, median_outcome, success_rate });
  };

  const trackRetirementSimulation = (
    current_age: number,
    retirement_age: number,
    probability_of_success: number,
    nest_egg_median: number
  ) => {
    track('retirement_simulation', {
      current_age,
      retirement_age,
      years_to_retirement: retirement_age - current_age,
      probability_of_success,
      nest_egg_median,
    });
  };

  const trackScenarioComparison = (
    scenario_name: string,
    median_impact: number,
    median_impact_percent: number,
    worth_stress_testing: boolean
  ) => {
    track('scenario_comparison', {
      scenario_name,
      median_impact,
      median_impact_percent,
      worth_stress_testing,
    });
  };

  const trackRecommendedAllocationViewed = (
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive',
    expected_return: number,
    volatility: number
  ) => {
    track('recommended_allocation_viewed', { risk_tolerance, expected_return, volatility });
  };

  // ============================================================================
  // PAGE VIEW EVENTS
  // ============================================================================

  const trackPageView = (page_name: string, page_url: string) => {
    track('$pageview', { page_name, page_url });
  };

  const trackFeatureViewed = (feature_name: string) => {
    track('feature_viewed', { feature_name });
  };

  // ============================================================================
  // USER IDENTIFICATION
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reason: PostHog identify() accepts arbitrary user properties
  const identifyUser = (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.identify(userId, properties);
    }
  };

  const resetUser = () => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.reset();
    }
  };

  return {
    // Core tracking
    track,
    identifyUser,
    resetUser,

    // Core events
    trackSignUp,
    trackOnboardingComplete,
    trackConnectInitiated,
    trackConnectSuccess,
    trackSyncSuccess,
    trackBudgetCreated,
    trackRuleCreated,
    trackTxnCategorized,
    trackAlertFired,
    trackViewNetWorth,
    trackExportData,

    // Goal tracking events
    trackGoalCreated,
    trackGoalUpdated,
    trackGoalDeleted,
    trackGoalProgressViewed,
    trackGoalProbabilityCalculated,
    trackGoalAllocationAdded,
    trackGoalAllocationRemoved,

    // Simulation events
    trackMonteCarloSimulation,
    trackRetirementSimulation,
    trackScenarioComparison,
    trackRecommendedAllocationViewed,

    // Page view events
    trackPageView,
    trackFeatureViewed,
  };
}
