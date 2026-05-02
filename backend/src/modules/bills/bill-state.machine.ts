export enum BillState {
  DRAFT = 'DRAFT',
  PROCESSING_OCR = 'PROCESSING_OCR',
  READY = 'READY',
  EDITING = 'EDITING',
  FINALIZED = 'FINALIZED',
  ARCHIVED = 'ARCHIVED',
}

const TRANSITIONS: Record<BillState, BillState[]> = {
  [BillState.DRAFT]: [BillState.PROCESSING_OCR],
  [BillState.PROCESSING_OCR]: [BillState.READY, BillState.EDITING],
  [BillState.READY]: [BillState.EDITING],
  [BillState.EDITING]: [BillState.FINALIZED],
  [BillState.FINALIZED]: [BillState.ARCHIVED],
  [BillState.ARCHIVED]: [],
};

export function canTransition(from: BillState, to: BillState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
