'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function NewBillPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const billRes = await api.post('/bills', { title: title || undefined });
      const billId = billRes.data.data.id;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('billId', billId);
        await api.post('/ocr/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Receipt uploaded — OCR is processing');
      }

      router.push(`/bills/${billId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>New Bill</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Bill title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dinner at Nusantara, Apr 30"
              />
            </div>

            <div className="space-y-1">
              <Label>Receipt photo (optional)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                {file ? (
                  <p className="text-sm text-gray-700">{file.name}</p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Tap to upload receipt (JPG, PNG, WEBP · max 10 MB)
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating…' : 'Create Bill'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
