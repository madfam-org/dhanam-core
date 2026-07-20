'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
} from '@dhanam-core/ui';
import { DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ReadyToAssignProps {
  budgetId: string;
  income: number;
  totalBudgeted: number;
  totalCarryover: number;
  readyToAssign: number;
  categories: Array<{
    id: string;
    name: string;
    budgetedAmount: number;
    carryoverAmount: number;
  }>;
  onUpdateIncome: (income: number) => Promise<void>;
  onAllocateFunds: (categoryId: string, amount: number) => Promise<void>;
}

export function ReadyToAssign({
  budgetId: _budgetId,
  income,
  totalBudgeted,
  totalCarryover,
  readyToAssign,
  categories,
  onUpdateIncome,
  onAllocateFunds,
}: ReadyToAssignProps) {
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [newIncome, setNewIncome] = useState(income.toString());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateIncome = async () => {
    setIsLoading(true);
    try {
      await onUpdateIncome(parseFloat(newIncome));
      setIsEditingIncome(false);
    } catch (error) {
      console.error('Failed to update income:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedCategory || !allocationAmount) return;

    setIsLoading(true);
    try {
      await onAllocateFunds(selectedCategory, parseFloat(allocationAmount));
      setSelectedCategory('');
      setAllocationAmount('');
    } catch (error) {
      console.error('Failed to allocate funds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle>Ready to Assign</CardTitle>
          </div>
          <div
            className={`text-2xl font-bold ${
              readyToAssign > 0 ? 'text-orange-600' : 'text-green-600'
            }`}
          >
            {formatCurrency(readyToAssign)}
          </div>
        </div>
        <CardDescription>Zero-Based Budgeting - Assign every dollar a job</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alert for unassigned funds */}
        {readyToAssign > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {formatCurrency(readyToAssign)} unassigned! Give every dollar a job by
              allocating it to a category below.
            </AlertDescription>
          </Alert>
        )}

        {readyToAssign === 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              All funds assigned! You've successfully allocated all your income.
            </AlertDescription>
          </Alert>
        )}

        {/* Income Section */}
        <div className="space-y-2 rounded-lg border p-4">
          <Label className="text-sm font-medium">Monthly Income</Label>
          {!isEditingIncome ? (
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">{formatCurrency(income)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingIncome(true);
                  setNewIncome(income.toString());
                }}
              >
                Update Income
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                value={newIncome}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIncome(e.target.value)}
                placeholder="Enter income amount"
                className="flex-1"
              />
              <Button onClick={handleUpdateIncome} disabled={isLoading}>
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditingIncome(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Budget Summary */}
        <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
          <div>
            <Label className="text-xs text-muted-foreground">Income</Label>
            <p className="text-lg font-semibold">{formatCurrency(income)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Carryover</Label>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(totalCarryover)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Budgeted</Label>
            <p className="text-lg font-semibold">{formatCurrency(totalBudgeted)}</p>
          </div>
        </div>

        {/* Quick Allocate */}
        {readyToAssign > 0 && (
          <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <Label className="font-medium">Quick Allocate Funds</Label>
            <div className="flex gap-2">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedCategory(e.target.value)
                }
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({formatCurrency(cat.budgetedAmount + cat.carryoverAmount)})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Amount"
                value={allocationAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAllocationAmount(e.target.value)
                }
                className="w-32"
                max={readyToAssign}
              />
              <Button
                onClick={handleAllocate}
                disabled={!selectedCategory || !allocationAmount || isLoading}
              >
                Allocate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
