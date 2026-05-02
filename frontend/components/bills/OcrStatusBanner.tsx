'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Props {
  ocrJobId: string;
  billId: string;
  status: string;
}

export function OcrStatusBanner({ ocrJobId, billId, status }: Props) {
  const qc = useQueryClient();

  useEffect(() => {
    if (status === 'completed' || status === 'failed') return;

    const interval = setInterval(async () => {
      const { data } = await api.get(`/ocr/jobs/${ocrJobId}`);
      const newStatus = data.data.status;
      if (newStatus !== status) {
        qc.invalidateQueries({ queryKey: ['bill', billId] });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [ocrJobId, billId, status, qc]);

  const colors: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-600',
    processing: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    requires_review: 'bg-orange-50 text-orange-700',
  };

  const labels: Record<string, string> = {
    queued: '⏳ OCR queued…',
    processing: '🔍 Reading receipt…',
    completed: '✅ Receipt scanned',
    failed: '❌ OCR failed — please enter items manually',
    requires_review: '⚠️ OCR needs review — please verify the items below',
  };

  return (
    <div className={`text-sm px-4 py-2 rounded-lg ${colors[status] ?? 'bg-gray-100'}`}>
      {labels[status] ?? status}
    </div>
  );
}
