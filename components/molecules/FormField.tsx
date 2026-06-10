import Label from '@/components/atoms/Label';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({ label, htmlFor, children, className = '' }: FormFieldProps) {
  return (
    <div className={`${styles.field} ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={styles.gridHalf} style={cols !== 2 ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
      {children}
    </div>
  );
}
