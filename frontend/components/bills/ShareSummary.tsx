'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

interface Props {
  billId: string;
  billTitle?: string;
}

export function ShareSummary({ billId, billTitle }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['split', billId],
    queryFn: () => api.get(`/bills/${billId}/split`).then((r) => r.data.data),
  });

  function copyToClipboard() {
    if (!data) return;
    const lines = [
      `📋 ${billTitle || 'Bill'} — Payment Summary`,
      '',
      ...data.map(
        (p: any) =>
          `${p.name}: Rp ${Number(p.total).toLocaleString('id-ID')}` +
          ` (items: Rp ${Number(p.itemSubtotal).toLocaleString('id-ID')}` +
          ` + tax: Rp ${Number(p.taxShare).toLocaleString('id-ID')}` +
          ` + service: Rp ${Number(p.serviceChargeShare).toLocaleString('id-ID')})`,
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Copied to clipboard!');
  }

  if (isLoading) return <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />;

  return (
    <div className="space-y-3">
      {data?.map((p: any) => (
        <Card key={p.participantId}>
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{p.name}</p>
              <p className="font-bold text-blue-700">
                Rp {Number(p.total).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
              <span>Items: Rp {Number(p.itemSubtotal).toLocaleString('id-ID')}</span>
              <span>Tax: Rp {Number(p.taxShare).toLocaleString('id-ID')}</span>
              <span>Service: Rp {Number(p.serviceChargeShare).toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={copyToClipboard} className="w-full">
        📋 Copy summary
      </Button>
    </div>
  );
}
