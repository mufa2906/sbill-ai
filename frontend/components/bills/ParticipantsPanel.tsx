'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

interface Participant {
  id: string;
  userId?: string;
  guestName?: string;
  user?: { name: string };
}

interface Props {
  billId: string;
  participants: Participant[];
  onChanged: () => void;
}

export function ParticipantsPanel({ billId, participants, onChanged }: Props) {
  const [guestName, setGuestName] = useState('');
  const [adding, setAdding] = useState(false);

  async function addGuest() {
    if (!guestName.trim()) return;
    setAdding(true);
    try {
      await api.post(`/bills/${billId}/participants`, { guestName: guestName.trim() });
      setGuestName('');
      onChanged();
    } catch (err: any) {
      toast.error('Failed to add participant');
    } finally {
      setAdding(false);
    }
  }

  async function removeParticipant(participantId: string) {
    try {
      await api.delete(`/bills/${billId}/participants/${participantId}`);
      onChanged();
    } catch {
      toast.error('Failed to remove');
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm px-1">
            <span>{p.user?.name ?? p.guestName ?? 'Guest'}</span>
            <button
              type="button"
              onClick={() => removeParticipant(p.id)}
              className="text-gray-400 hover:text-red-500 text-xs"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Guest name"
          className="text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addGuest()}
        />
        <Button size="sm" onClick={addGuest} disabled={adding || !guestName.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
