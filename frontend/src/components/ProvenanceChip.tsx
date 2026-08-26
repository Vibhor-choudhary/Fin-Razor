

type Provenance = 'verified' | 'simulated' | 'abstained' | 'enforced' | 'danger';

interface ProvenanceChipProps {
  type: Provenance;
  label: string;
}

export function ProvenanceChip({ type, label }: ProvenanceChipProps) {
  return (
    <span className={`chip chip-${type}`}>
      {label}
    </span>
  );
}
