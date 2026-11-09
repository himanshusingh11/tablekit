import type { ReactNode } from 'react';

export function Demo({
  title,
  description,
  children,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="demo">
      {title && <h3>{title}</h3>}
      {description && <p className="muted">{description}</p>}
      <div className="demo-body">{children}</div>
    </section>
  );
}
