import styles from './Chip.module.css';

interface ChipProps {
  label: string;
  icon?: string | null;
  color: string;
  className?: string;
}

export default function Chip({ label, icon, color, className = '' }: ChipProps) {
  return (
    <span
      className={`${styles.chip} ${className}`}
      style={{ '--chip-color': color, '--chip-bg': `${color}18` } as React.CSSProperties}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
