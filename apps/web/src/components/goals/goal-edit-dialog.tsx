'use client';

import { useTranslation } from '@dhanam-core/shared';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Goal, UpdateGoalInput } from '@/hooks/useGoals';

interface GoalEditDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: UpdateGoalInput) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function GoalEditDialog({
  goal,
  open,
  onOpenChange,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: GoalEditDialogProps) {
  const { t } = useTranslation('goals');
  const { t: tCommon } = useTranslation('common');

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('3');
  const [status, setStatus] = useState<Goal['status']>('active');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (goal && open) {
      setName(goal.name);
      setTargetAmount(parseFloat(goal.targetAmount.toString()).toString());
      setTargetDate(new Date(goal.targetDate).toISOString().split('T')[0] ?? '');
      setPriority(goal.priority.toString());
      setStatus(goal.status);
      setNotes(goal.notes ?? '');
      setDescription(goal.description ?? '');
    }
  }, [goal, open]);

  const handleSave = async () => {
    if (!goal) return;

    const updates: UpdateGoalInput = {};

    if (name !== goal.name) updates.name = name;
    if (description !== (goal.description || '')) updates.description = description;
    if (parseFloat(targetAmount) !== parseFloat(goal.targetAmount.toString())) {
      updates.targetAmount = parseFloat(targetAmount);
    }
    const currentDate = new Date(goal.targetDate).toISOString().split('T')[0];
    if (targetDate !== currentDate) updates.targetDate = targetDate;
    if (parseInt(priority) !== goal.priority) updates.priority = parseInt(priority);
    if (status !== goal.status) updates.status = status;
    if (notes !== (goal.notes || '')) updates.notes = notes;

    await onSave(updates);
  };

  const handleDelete = async () => {
    if (!goal) return;
    await onDelete(goal.id);
    setIsDeleteConfirmOpen(false);
  };

  const isFormValid = name.trim() !== '' && parseFloat(targetAmount) > 0 && targetDate !== '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('dialog.edit.title')}</DialogTitle>
            <DialogDescription>{t('dialog.edit.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">{t('fields.goalName')}</Label>
              <Input
                id="goal-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder={t('fields.goalNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-description">{t('fields.description')}</Label>
              <Textarea
                id="goal-description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder={t('fields.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-target-amount">{t('fields.targetAmount')}</Label>
                <Input
                  id="goal-target-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTargetAmount(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-target-date">{t('fields.targetDate')}</Label>
                <Input
                  id="goal-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTargetDate(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-priority">{t('fields.priority')}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="goal-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - {t('priority.highest')}</SelectItem>
                    <SelectItem value="2">2 - {t('priority.high')}</SelectItem>
                    <SelectItem value="3">3 - {t('priority.medium')}</SelectItem>
                    <SelectItem value="4">4 - {t('priority.low')}</SelectItem>
                    <SelectItem value="5">5 - {t('priority.lowest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-status">{t('fields.status')}</Label>
                <Select
                  value={status}
                  onValueChange={(value: string) => setStatus(value as Goal['status'])}
                >
                  <SelectTrigger id="goal-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="paused">{t('status.paused')}</SelectItem>
                    <SelectItem value="achieved">{t('status.achieved')}</SelectItem>
                    <SelectItem value="abandoned">{t('status.abandoned')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-notes">{t('fields.notes')}</Label>
              <Textarea
                id="goal-notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder={t('fields.notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isSaving || isDeleting}
            >
              {t('page.deleteGoal')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon('saving')}
                  </>
                ) : (
                  tCommon('save')
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.delete.description', { name: goal?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('dialog.delete.deleting')}
                </>
              ) : (
                t('page.deleteGoal')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
