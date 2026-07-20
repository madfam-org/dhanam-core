'use client';

import { useTranslation } from '@dhanam-core/shared';
import {
  Card,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Alert,
  AlertDescription,
} from '@dhanam-core/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Settings, TestTube, CheckCircle, XCircle, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAnalytics } from '@/hooks/useAnalytics';
import { categoriesApi } from '@/lib/api/categories';
import { rulesApi, CreateRuleDto, TestRuleDto } from '@/lib/api/rules';

interface RuleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
}

export function RuleManager({ open, onOpenChange, spaceId }: RuleManagerProps) {
  const { t } = useTranslation('budgets');
  const { trackRuleCreated } = useAnalytics();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    matchCount: number;
    sampleMatches?: Array<{ id: string; description: string; amount: number }>;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['transaction-rules', spaceId],
    queryFn: () => rulesApi.getRules(spaceId),
    enabled: open && !!spaceId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', spaceId],
    queryFn: () => categoriesApi.getCategories(spaceId),
    enabled: open && !!spaceId,
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: CreateRuleDto) => rulesApi.createRule(spaceId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-rules', spaceId] });
      setIsCreateOpen(false);
      trackRuleCreated(data.id, data.categoryId, data.pattern);
      toast.success(t('rules.toast.ruleCreated'));
    },
    onError: () => {
      toast.error(t('rules.toast.ruleCreateFailed'));
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: (params: { ruleId: string; isActive: boolean }) =>
      rulesApi.toggleRule(spaceId, params.ruleId, params.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-rules', spaceId] });
      toast.success(t('rules.toast.ruleUpdated'));
    },
    onError: () => {
      toast.error(t('rules.toast.ruleUpdateFailed'));
    },
  });

  const testRuleMutation = useMutation({
    mutationFn: (data: TestRuleDto) => rulesApi.testRule(spaceId, data),
    onSuccess: (data) => {
      setTestResult(data);
      toast.success(t('rules.toast.ruleTestMatch', { count: data.matchCount }));
    },
    onError: () => {
      toast.error(t('rules.toast.ruleTestFailed'));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRuleMutation.mutate({
      name: formData.get('name') as string,
      pattern: formData.get('pattern') as string,
      field: formData.get('field') as CreateRuleDto['field'],
      operator: formData.get('operator') as CreateRuleDto['operator'],
      value: formData.get('value') as string,
      priority: parseInt(formData.get('priority') as string),
      categoryId: formData.get('categoryId') as string,
    });
  };

  const handleTestRule = () => {
    const form = document.getElementById('rule-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      testRuleMutation.mutate({
        pattern: formData.get('pattern') as string,
        field: formData.get('field') as TestRuleDto['field'],
        operator: formData.get('operator') as TestRuleDto['operator'],
        value: formData.get('value') as string,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('rules.title')}
          </DialogTitle>
          <DialogDescription>{t('rules.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{t('rules.priorityHint')}</p>
            <Button onClick={() => setIsCreateOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('rules.addRule')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rules?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">{t('rules.noRulesTitle')}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {t('rules.noRulesDescription')}
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('rules.createFirstRule')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules?.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">#{rule.priority}</span>
                        </div>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.field} {rule.operator} &quot;{rule.value}&quot;
                          </p>
                        </div>
                        {rule.category && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: rule.category.color }}
                            />
                            {rule.category.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleRuleMutation.mutate({
                              ruleId: rule.id,
                              isActive: !rule.isActive,
                            })
                          }
                        >
                          {rule.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('rules.createRuleTitle')}</DialogTitle>
              <DialogDescription>{t('rules.createRuleDescription')}</DialogDescription>
            </DialogHeader>

            <form id="rule-form" onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="rule-name" className="text-sm font-medium">
                  {t('rules.labels.ruleName')}
                </label>
                <Input
                  id="rule-name"
                  name="name"
                  placeholder={t('rules.placeholders.ruleName')}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="field" className="text-sm font-medium">
                    {t('rules.labels.field')}
                  </label>
                  <Select name="field" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('rules.placeholders.selectField')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="description">{t('rules.fields.description')}</SelectItem>
                      <SelectItem value="merchant">{t('rules.fields.merchant')}</SelectItem>
                      <SelectItem value="amount">{t('rules.fields.amount')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="operator" className="text-sm font-medium">
                    {t('rules.labels.operator')}
                  </label>
                  <Select name="operator" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('rules.placeholders.selectOperator')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">{t('rules.operators.contains')}</SelectItem>
                      <SelectItem value="equals">{t('rules.operators.equals')}</SelectItem>
                      <SelectItem value="startsWith">{t('rules.operators.startsWith')}</SelectItem>
                      <SelectItem value="endsWith">{t('rules.operators.endsWith')}</SelectItem>
                      <SelectItem value="regex">{t('rules.operators.regex')}</SelectItem>
                      <SelectItem value="gte">{t('rules.operators.gte')}</SelectItem>
                      <SelectItem value="lte">{t('rules.operators.lte')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="value" className="text-sm font-medium">
                  {t('rules.labels.patternValue')}
                </label>
                <Input
                  id="value"
                  name="value"
                  placeholder={t('rules.placeholders.patternValue')}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  {t('rules.labels.priority')}
                </label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="1"
                  defaultValue="10"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium">
                  {t('rules.labels.category')}
                </label>
                <Select name="categoryId" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rules.placeholders.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestRule}
                  disabled={testRuleMutation.isPending}
                  className="flex-1"
                >
                  {testRuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('rules.buttons.testing')}
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      {t('rules.buttons.testRule')}
                    </>
                  )}
                </Button>

                <Button type="submit" disabled={createRuleMutation.isPending} className="flex-1">
                  {createRuleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('rules.buttons.creating')}
                    </>
                  ) : (
                    t('rules.buttons.createRule')
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t('rules.testResults')}</strong>{' '}
                    {t('rules.testMatch', { count: testResult.matchCount })}
                    {(testResult.sampleMatches?.length ?? 0) > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium">{t('rules.sampleMatches')}</p>
                        {testResult.sampleMatches
                          ?.slice(0, 3)
                          .map((match: { id: string; description: string; amount: number }) => (
                            <p key={match.id} className="text-xs text-muted-foreground">
                              • {match.description} ({match.amount < 0 ? '-' : ''}$
                              {Math.abs(match.amount)})
                            </p>
                          ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
