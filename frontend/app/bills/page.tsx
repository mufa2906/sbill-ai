'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import api from '@/lib/api';

const STATE_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PROCESSING_OCR: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-blue-100 text-blue-700',
  EDITING: 'bg-orange-100 text-orange-700',
  FINALIZED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-200 text-gray-500',
};

export default function BillsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) router.push('/login');
  }, [token, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => api.get('/bills').then((r) => r.data.data),
    enabled: !!token,
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Bills</h1>
        <Link href="/bills/new">
          <Button size="sm">+ New Bill</Button>
        </Link>
      </header>

      {data?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            No bills yet. Create your first one!
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {data?.map((bill: any) => (
          <Link key={bill.id} href={`/bills/${bill.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium">{bill.title || 'Untitled Bill'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {bill.total > 0 && (
                    <span className="text-sm font-medium">
                      Rp {Number(bill.total).toLocaleString('id-ID')}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATE_COLOR[bill.state] ?? ''}`}
                  >
                    {bill.state}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="max-w-xl mx-auto p-4 space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </main>
  );
}
