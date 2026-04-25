interface EmptyRowProps {
  totalSlots: number;
  rowIndex: number;
}

export default function EmptyRow({ totalSlots, rowIndex }: EmptyRowProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="text-[10px] font-mono w-5 text-right" style={{ color: 'var(--text-muted)' }}>{rowIndex + 1}</span>
      <div className="flex gap-2">
        {Array.from({ length: totalSlots }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg"
            style={{
              width: 36,
              height: 36,
              backgroundColor: 'var(--slot-empty-bg)',
              border: '1px solid var(--slot-empty-border)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
