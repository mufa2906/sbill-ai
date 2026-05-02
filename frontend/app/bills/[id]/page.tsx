'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OcrStatusBanner } from '@/components/bills/OcrStatusBanner';
import { ItemsEditor } from '@/components/bills/ItemsEditor';
import { ParticipantsPanel } from '@/components/bills/ParticipantsPanel';
import { AssignmentPanel } from '@/components/bills/AssignmentPanel';
import { ShareSummary } from '@/components/bills/ShareSummary';
import api from '@/lib/api';

type Section = 'items' | 'participants' | 'assign' | 'summary';

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>('items');

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => api.get(`/bills/${id}`).then((r) => r.data.data),
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ['bill', id] });
  }

  async function finalize() {
    try {
      await api.post(`/bills/${id}/finalize`);
      toast.success('Bill finalized!');
      refresh();
      setSection('summary');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Cannot finalize');
    }
  }

  async function deleteBill() {
    if (!confirm('Delete this bill?')) return;
    try {
      await api.delete(`/bills/${id}`);
      router.push('/bills');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Cannot delete');
    }
  }

  if (isLoading) return <LoadingScreen />;
  if (!bill) return <p className="p-4 text-center">Bill not found</p>;

  const latestOcrJob = bill.ocrJobs?.[0];
  const isFinalized = bill.state === 'FINALIZED' || bill.state === 'ARCHIVED';

  const tabs: { id: Section; label: string }[] = [
    { id: 'items', label: 'Items' },
    { id: 'participants', label: 'People' },
    { id: 'assign', label: 'Assign' },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/bills" className="text-sm text-gray-400 hover:text-gray-600">
            ← Bills
          </Link>
          <h1 className="text-lg font-bold">{bill.title || 'Untitled Bill'}</h1>
          <p className="text-xs text-gray-400">
            {bill.state} · Rp {Number(bill.total ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
        {!isFinalized && (
          <div className="flex gap-2">
            <Button size="sm" onClick={finalize} disabled={bill.state === 'PROCESSING_OCR'}>
              Finalize
            </Button>
            <Button size="sm" variant="ghost" onClick={deleteBill} className="text-red-500">
              Delete
            </Button>
          </div>
        )}
      </header>

      {latestOcrJob && (
        <OcrStatusBanner
          ocrJobId={latestOcrJob.id}
          billId={id}
          status={latestOcrJob.status}
        />
      )}

      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              section === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {section === 'items' && (
            <ItemsEditor
              billId={id}
              initialItems={bill.items?.map((it: any) => ({
                id: it.id,
                name: it.name,
                quantity: it.quantity,
                price: Number(it.price),
              })) ?? []}
              taxAmount={Number(bill.taxAmount ?? 0)}
              serviceChargeAmount={Number(bill.serviceChargeAmount ?? 0)}
              onSaved={refresh}
            />
          )}

          {section === 'participants' && (
            <ParticipantsPanel
              billId={id}
              participants={bill.participants ?? []}
              onChanged={refresh}
            />
          )}

          {section === 'assign' && (
            <AssignmentPanel
              billId={id}
              items={bill.items ?? []}
              participants={bill.participants ?? []}
              onSaved={refresh}
            />
          )}

          {section === 'summary' && (
            <ShareSummary billId={id} billTitle={bill.title} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="max-w-xl mx-auto p-4 space-y-3">
      <div className="h-8 bg-gray-200 animate-pulse rounded w-40" />
      <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
    </main>
  );
}
