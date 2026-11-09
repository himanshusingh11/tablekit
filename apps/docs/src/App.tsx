import { useEffect, useState, type ComponentType } from 'react';
import { GettingStarted } from './pages/GettingStarted';
import { Api } from './pages/Api';
import { Benchmarks } from './pages/Benchmarks';
import { ExamplePage } from './pages/ExamplePage';
import { LargeExample } from './examples/LargeExample';
import largeSource from './examples/LargeExample.tsx?raw';
import { ServerSideExample } from './examples/ServerSideExample';
import serverSource from './examples/ServerSideExample.tsx?raw';
import { SelectionExample } from './examples/SelectionExample';
import selectionSource from './examples/SelectionExample.tsx?raw';
import { ThemingExample } from './examples/ThemingExample';
import themingSource from './examples/ThemingExample.tsx?raw';

type Route = { path: string; label: string; group: string; Page: ComponentType };

const routes: Route[] = [
  { path: '', label: 'Getting started', group: 'Docs', Page: GettingStarted },
  { path: 'api', label: 'API reference', group: 'Docs', Page: Api },
  {
    path: 'examples/100k',
    label: '100K rows',
    group: 'Examples',
    Page: () => (
      <ExamplePage
        title="100,000 rows"
        intro="Sorting and filtering 100K rows on the client. Only the visible window (+ overscan) is rendered, so scrolling stays smooth. ID and Name are pinned."
        Example={LargeExample}
        source={largeSource}
      />
    ),
  },
  {
    path: 'examples/server',
    label: 'Server-side',
    group: 'Examples',
    Page: () => (
      <ExamplePage
        title="Server-side sorting & filtering"
        intro="With manualSorting and manualFiltering, TableKit renders rows as given and reports state changes so you can refetch. The fake API here adds 400 ms of latency."
        Example={ServerSideExample}
        source={serverSource}
      />
    ),
  },
  {
    path: 'examples/selection',
    label: 'Selection',
    group: 'Examples',
    Page: () => (
      <ExamplePage
        title="Row selection"
        intro="Checkbox column, shift-click range selection and a select-all that applies to the filtered rows. Keyboard: Space toggles, Shift+Space selects a range, Ctrl+A selects all."
        Example={SelectionExample}
        source={selectionSource}
      />
    ),
  },
  {
    path: 'examples/theming',
    label: 'Theming',
    group: 'Examples',
    Page: () => (
      <ExamplePage
        title="Theming"
        intro="Every colour and spacing is a CSS custom property, so you can theme with plain CSS or inline styles without fighting specificity."
        Example={ThemingExample}
        source={themingSource}
      />
    ),
  },
  { path: 'benchmarks', label: 'Benchmarks', group: 'Performance', Page: Benchmarks },
];

const getPath = () => window.location.hash.replace(/^#\/?/, '');

export function App() {
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const onHash = () => {
      setPath(getPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const route = routes.find((r) => r.path === path) ?? routes[0]!;
  useEffect(() => {
    document.title = route.path
      ? `${route.label} · TableKit`
      : 'TableKit: accessible React data table';
  }, [route]);

  const groups = [...new Set(routes.map((r) => r.group))];
  const { Page } = route;

  return (
    <div className="layout">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <span className="logo" aria-hidden="true" />
          TableKit
        </a>
        <nav aria-label="Documentation">
          {groups.map((g) => (
            <div key={g} className="nav-group">
              <div className="nav-title">{g}</div>
              {routes
                .filter((r) => r.group === g)
                .map((r) => (
                  <a
                    key={r.path}
                    href={`#/${r.path}`}
                    aria-current={r === route ? 'page' : undefined}
                  >
                    {r.label}
                  </a>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-links">
          <a href="https://github.com/himanshusingh11/tablekit">GitHub</a>
          <a href="https://www.npmjs.com/package/react-tablekit">npm</a>
        </div>
      </aside>
      <main className="content">
        <Page />
      </main>
    </div>
  );
}
