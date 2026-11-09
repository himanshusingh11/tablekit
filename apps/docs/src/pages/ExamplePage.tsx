import type { ComponentType, ReactNode } from 'react';
import { Code } from '../components/Code';
import { Demo } from '../components/Demo';

export function ExamplePage({
  title,
  intro,
  Example,
  source,
}: {
  title: string;
  intro: ReactNode;
  Example: ComponentType;
  source: string;
}) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="lead">{intro}</p>
      <Demo>
        <Example />
      </Demo>
      <h2>Source</h2>
      <Code>{source}</Code>
    </div>
  );
}
