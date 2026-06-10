import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}

export default function ProgressBar({ value, color, height, className = '' }: ProgressBarProps) {
  return (
    <div
      className={`${styles.track} ${className}`}
      style={height !== undefined ? { '--bar-height': `${height}px` } as React.CSSProperties : undefined}
    >
      <div
        className={styles.fill}
        style={{
          '--bar-value': `${Math.min(100, Math.max(0, value))}%`,
          ...(color && { '--bar-color': color }),
        } as React.CSSProperties}
      />
    </div>
  );
}
