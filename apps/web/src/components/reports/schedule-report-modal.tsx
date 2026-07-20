'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam-core/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Calendar, FileSpreadsheet, FileText, File, Mail, Check } from 'lucide-react';
import { useState } from 'react';

import { apiClient } from '@/lib/api/client';

interface ScheduleReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
}

interface ReportPreferences {
  weeklyReports: boolean;
  monthlyReports: boolean;
  exportFormat: 'pdf' | 'excel' | 'csv';
}

export function ScheduleReportModal({
  open,
  onOpenChange,
  spaceId: _spaceId,
}: ScheduleReportModalProps) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<ReportPreferences>({
    weeklyReports: false,
    monthlyReports: false,
    exportFormat: 'pdf',
  });
  const [saved, setSaved] = useState(false);

  // Fetch current preferences
  const { isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const data = await apiClient.get<{ preferences: ReportPreferences }>('/users/preferences');
      if (data.preferences) {
        setPreferences({
          weeklyReports: data.preferences.weeklyReports ?? false,
          monthlyReports: data.preferences.monthlyReports ?? false,
          exportFormat: data.preferences.exportFormat ?? 'pdf',
        });
      }
      return data;
    },
    enabled: open,
  });

  // Save preferences mutation
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async (prefs: ReportPreferences) => {
      return apiClient.patch('/users/preferences', prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    savePreferences(preferences);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Reports
          </DialogTitle>
          <DialogDescription>
            Configure automatic report delivery to your email. Reports are sent at 8:00 AM in your
            timezone.
          </DialogDescription>
        </DialogHeader>

        {isLoadingPrefs ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Weekly Reports */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="weekly-reports" className="text-base font-medium">
                    Weekly Reports
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive a summary every Monday covering the previous week
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={preferences.weeklyReports}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, weeklyReports: checked }))
                }
              />
            </div>

            {/* Monthly Reports */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="monthly-reports" className="text-base font-medium">
                    Monthly Reports
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive a comprehensive report on the 1st of each month
                </p>
              </div>
              <Switch
                id="monthly-reports"
                checked={preferences.monthlyReports}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, monthlyReports: checked }))
                }
              />
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label htmlFor="export-format">Report Format</Label>
              <Select
                value={preferences.exportFormat}
                onValueChange={(value: 'pdf' | 'excel' | 'csv') =>
                  setPreferences((prev) => ({ ...prev, exportFormat: value }))
                }
              >
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>PDF Document</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Excel Spreadsheet</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span>CSV File</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the format for your scheduled reports
              </p>
            </div>

            {/* Info Box */}
            {(preferences.weeklyReports || preferences.monthlyReports) && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Next scheduled:</strong>
                  {preferences.weeklyReports && (
                    <span className="block mt-1">Weekly report: Next Monday at 8:00 AM</span>
                  )}
                  {preferences.monthlyReports && (
                    <span className="block mt-1">Monthly report: 1st of next month at 8:00 AM</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoadingPrefs}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
