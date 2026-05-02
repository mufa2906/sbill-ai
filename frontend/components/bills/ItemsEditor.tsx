'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

interface Item {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  billId: string;
  initialItems: Item[];
  taxAmount: number;
  serviceChargeAmount: number;
  onSaved: () => void;
}

export function ItemsEditor({ billId, initialItems, taxAmount, serviceChargeAmount, onSaved }: Props) {
  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0 ? initialItems : [{ name: '', quantity: 1, price: 0 }],
  );
  const [tax, setTax] = useState(taxAmount);
  const [service, setService] = useState(serviceChargeAmount);
  const [saving, setSaving] = useState(false);

  function updateItem(idx: number, field: keyof Item, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function addRow() {
    setItems((prev) => [...prev, { name: '', quantity: 1, price: 0 }]);
  }

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/bills/${billId}/items`, {
        items: items.map((it) => ({
          name: it.name,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
        taxAmount: Number(tax),
        serviceChargeAmount: Number(service),
      });
      toast.success('Items saved');
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const subtotal = items.reduce((acc, it) => acc + Number(it.price) * Number(it.quantity), 0);
  const total = subtotal + Number(tax) + Number(service);

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-500 grid grid-cols-12 gap-1 px-1">
        <span className="col-span-5">Item</span>
        <span className="col-span-2 text-center">Qty</span>
        <span className="col-span-4 text-right">Price (Rp)</span>
        <span className="col-span-1" />
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-1 items-center">
          <Input
            className="col-span-5 text-sm"
            placeholder="Item name"
            value={item.name}
            onChange={(e) => updateItem(idx, 'name', e.target.value)}
          />
          <Input
            className="col-span-2 text-sm text-center"
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
          />
          <Input
            className="col-span-4 text-sm text-right"
            type="number"
            min={0}
            value={item.price}
            onChange={(e) => updateItem(idx, 'price', e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="col-span-1 text-gray-400 hover:text-red-500 text-center"
          >
            ×
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
        + Add item
      </Button>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tax (Rp)</span>
          <Input
            type="number"
            min={0}
            value={tax}
            onChange={(e) => setTax(Number(e.target.value))}
            className="w-36 text-right text-sm"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Service charge (Rp)</span>
          <Input
            type="number"
            min={0}
            value={service}
            onChange={(e) => setService(Number(e.target.value))}
            className="w-36 text-right text-sm"
          />
        </div>
        <div className="flex items-center justify-between font-semibold text-sm pt-1">
          <span>Total</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save items'}
      </Button>
    </div>
  );
}
