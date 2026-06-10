import styles from './Badge.module.css';

interface BadgeProps {
  color: string;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ color, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${className}`}
      style={{ '--badge-color': color, '--badge-bg': `${color}22` } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
