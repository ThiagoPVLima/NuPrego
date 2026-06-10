interface ColorDotProps {
  color: string;
  size?: number;
}

export default function ColorDot({ color, size = 8 }: ColorDotProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}
