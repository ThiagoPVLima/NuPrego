interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

export default function Label({ children, htmlFor }: LabelProps) {
  return (
    <label className="label-caps" htmlFor={htmlFor}>
      {children}
    </label>
  );
}
