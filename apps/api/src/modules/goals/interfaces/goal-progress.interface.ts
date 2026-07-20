// SPDX-License-Identifier: AGPL-3.0-or-later
import { Currency } from '@db';

export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currency: Currency;
  currentValue: number;
  percentComplete: number;
  timeProgress: number;
  projectedCompletion: Date | null;
  onTrack: boolean;
  monthlyContributionNeeded: number;
  allocations: GoalAllocationProgress[];
}

export interface GoalAllocationProgress {
  accountId: string;
  accountName: string;
  percentage: number;
  contributedValue: number;
}

export interface GoalSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  totalTargetAmount: number;
  totalCurrentValue: number;
  overallProgress: number;
}