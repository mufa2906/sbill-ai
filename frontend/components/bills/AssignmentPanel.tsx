'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Item {
  id: string;
  name: string;
  quantity: number;
  price: bigint | number;
  assignments: Array<{ participantId: string; ratio: number }>;
}

interface Participant {
  id: string;
  user?: { name: string };
  guestName?: string;
}

interface Assignment {
  itemId: string;
  participantId: string;
  ratio: number;
}

interface Props {
  billId: string;
  items: Item[];
  participants: Participant[];
  onSaved: () => void;
}

export function AssignmentPanel({ billId, items, participants, onSaved }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Assignment[] = [];
    for (const item of items) {
      for (const a of item.assignments) {
        initial.push({ itemId: item.id, participantId: a.participantId, ratio: Number(a.ratio) });
      }
    }
    setAssignments(initial);
  }, [items]);

  function getRatio(itemId: string, participantId: string): number {
    return assignments.find((a) => a.itemId === itemId && a.participantId === participantId)?.ratio ?? 0;
  }

  function splitEvenly(itemId: string) {
    const n = participants.length;
    if (n === 0) return;
    const share = Math.round((1 / n) * 100) / 100;
    const newAssignments = participants.map((p, i) => ({
      itemId,
      participantId: p.id,
      ratio: i === n - 1 ? Math.round((1 - share * (n - 1)) * 100) / 100 : share,
    }));
    setAssignments((prev) => [
      ...prev.filter((a) => a.itemId !== itemId),
      ...newAssignments,
    ]);
  }

  function toggle(itemId: string, participantId: string) {
    const existing = assignments.filter((a) => a.itemId === itemId);
    const isChecked = existing.some((a) => a.participantId === participantId);

    if (isChecked) {
      setAssignments((prev) =>
        prev.filter((a) => !(a.itemId === itemId && a.participantId === participantId)),
      );
    } else {
      const share = Math.round((1 / (existing.length + 1)) * 100) / 100;
      const updated = existing.map((a) => ({ ...a, ratio: share }));
      const last = Math.round((1 - share * existing.length) * 100) / 100;
      setAssignments((prev) => [
        ...prev.filter((a) => a.itemId !== itemId),
        ...updated,
        { itemId, participantId, ratio: last },
      ]);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/bills/${billId}/assignments`, { assignments });
      toast.success('Assignments saved');
      onSaved();
    } catch (err: any) {
      toast.error('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  }

  if (participants.length === 0) {
    return <p className="text-sm text-gray-400">Add participants first.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-400">
                Rp {(Number(item.price) * Number(item.quantity)).toLocaleString('id-ID')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => splitEvenly(item.id)}
              className="text-xs text-blue-600 underline"
            >
              Split evenly
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const ratio = getRatio(item.id, p.id);
              const active = ratio > 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(item.id, p.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {p.user?.name ?? p.guestName ?? 'Guest'}
                  {active && ` ${Math.round(ratio * 100)}%`}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save assignments'}
      </Button>
    </div>
  );
}
