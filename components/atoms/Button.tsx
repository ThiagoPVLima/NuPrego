import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const cx = (...cls: (string | undefined | false | null)[]) => cls.filter(Boolean).join(' ');

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(styles.btn, styles[variant], styles[size], fullWidth && styles.fullWidth, className)}
      disabled={disabled || loading}
    >
      {loading ? '...' : children}
    </button>
  );
}
