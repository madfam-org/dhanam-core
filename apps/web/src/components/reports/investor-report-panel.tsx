'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@dhanam-core/ui';
import { Copy, Loader2, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Textarea } from '@/components/ui/textarea';
import { reportsApi, type InvestorReportPacketResponse } from '@/lib/api/reports';

interface InvestorReportPanelProps {
  spaceId: string;
  startDate: string;
  endDate: string;
}

function parseRecipients(value: string): string[] {
  return value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function InvestorReportPanel({ spaceId, startDate, endDate }: InvestorReportPanelProps) {
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [packet, setPacket] = useState<InvestorReportPacketResponse | null>(null);

  const recipientList = parseRecipients(recipients);

  const createPacket = async () => {
    if (recipientList.length === 0) {
      toast.error('Add at least one investor email.');
      return;
    }

    setLoading(true);
    try {
      const result = await reportsApi.createInvestorPacket({
        spaceId,
        startDate,
        endDate,
        recipients: recipientList,
        message: message || undefined,
      });
      setPacket(result);
      toast.success(`Investor report queued for ${result.recipientsQueued} recipient(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send investor report.');
    } finally {
      setLoading(false);
    }
  };

  const copyPublicUrl = async () => {
    if (!packet) return;
    await navigator.clipboard.writeText(packet.publicUrl);
    toast.success('Secure investor link copied.');
  };

  return (
    <Card className="overflow-hidden border-teal-200/70 bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:border-teal-900/50 dark:from-teal-950/30 dark:via-background dark:to-amber-950/20">
      <CardHeader className="relative">
        <div className="absolute right-6 top-6 rounded-full bg-teal-500/10 p-3 text-teal-700 dark:text-teal-300">
          <Sparkles className="h-6 w-6" />
        </div>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Mail className="h-5 w-5 text-teal-700 dark:text-teal-300" />
          Investor report packet
        </CardTitle>
        <CardDescription className="max-w-2xl">
          Generate a PDF report, preserve it in Dhanam storage, create an audited public access
          token, and queue secure delivery to investors.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Report period</Label>
              <div className="rounded-lg border bg-background/70 px-3 py-2 text-sm">
                {startDate} to {endDate}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recipients parsed</Label>
              <div className="rounded-lg border bg-background/70 px-3 py-2 text-sm">
                {recipientList.length} investor email{recipientList.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="investor-recipients">Investor emails</Label>
            <Input
              id="investor-recipients"
              placeholder="investor@example.com, partner@fund.com"
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="investor-message">Optional note</Label>
            <Textarea
              id="investor-message"
              placeholder="Add context, highlights, or caveats for this reporting period."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={createPacket} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Generate and send packet
          </Button>
        </div>

        <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            Delivery controls
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>PDF is archived before delivery.</li>
            <li>Public access is tokenized and expires automatically.</li>
            <li>Investor opens are audited by the report share-token flow.</li>
          </ul>
          {packet && (
            <div className="mt-4 space-y-3 rounded-xl bg-teal-500/10 p-3 text-sm">
              <div>
                <p className="font-medium text-foreground">{packet.reportName}</p>
                <p className="text-muted-foreground">Expires {packet.expiresAt}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={copyPublicUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copy secure link
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
