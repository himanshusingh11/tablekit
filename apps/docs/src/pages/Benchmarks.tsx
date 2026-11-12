import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DataTable, useTable } from '@himanshusingh11/tablekit';
import { personColumns } from '../columns';
import { makePeople, type Person } from '../data';

const SIZES = [1_000, 10_000, 100_000] as const;

export type BenchResult = {
  rows: number;
  initialRenderMs: number;
  sortMs: number;
  avgFps: number;
  p95FrameMs: number;
  longFrames: number;
  domRows: number;
};

declare global {
  interface Window {
    __tkBench?: { results: BenchResult[]; done: boolean; runAll: () => Promise<void> };
  }
}

const nextPaint = () =>
  new Promise<number>((resolve) =>
    requestAnimationFrame(() => setTimeout(() => resolve(performance.now()), 0)),
  );

function BenchTable({ data, onCommit }: { data: Person[]; onCommit: () => void }) {
  const table = useTable({ data, columns: personColumns, getRowId: (r) => r.id });
  useLayoutEffect(() => {
    onCommit();
  });
  return (
    <DataTable
      table={table}
      height={480}
      rowHeight={36}
      aria-label={`Benchmark table, ${data.length} rows`}
    />
  );
}

export function Benchmarks() {
  const datasets = useMemo(
    () => Object.fromEntries(SIZES.map((n) => [n, makePeople(n, n)])) as Record<number, Person[]>,
    [],
  );
  const [size, setSize] = useState<number | null>(null);
  const [results, setResults] = useState<BenchResult[]>([]);
  const [running, setRunning] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const commitWaiter = useRef<(() => void) | null>(null);

  const waitForCommit = () => new Promise<void>((resolve) => (commitWaiter.current = resolve));
  const onCommit = () => {
    commitWaiter.current?.();
    commitWaiter.current = null;
  };

  async function runOne(n: number): Promise<BenchResult> {
    // Unmount, then time mount -> first paint.
    setSize(null);
    await nextPaint();
    const t0 = performance.now();
    const committed = waitForCommit();
    setSize(n);
    await committed;
    const initialRenderMs = (await nextPaint()) - t0;

    const scroller = host.current!.querySelector<HTMLElement>('[role=grid]')!;
    const header = host.current!.querySelector<HTMLElement>(
      '[role=columnheader][aria-colindex="5"]',
    )!; // City

    // Sort time: click a header and wait for the next paint.
    const t1 = performance.now();
    header.click();
    const sortMs = (await nextPaint()) - t1;
    header.click();
    header.click(); // back to unsorted
    await nextPaint();

    // Scroll smoothness: scroll continuously for ~2s, measure frame intervals.
    const frames: number[] = [];
    await new Promise<void>((resolve) => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const pxPerFrame = Math.max(60, Math.min(max / 120, 2000));
      let last = performance.now();
      const start = last;
      const step = (now: number) => {
        frames.push(now - last);
        last = now;
        scroller.scrollTop = Math.min(max, scroller.scrollTop + pxPerFrame);
        if (now - start < 2000 && scroller.scrollTop < max) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    frames.shift();
    const sorted = [...frames].sort((a, b) => a - b);
    const avg = frames.reduce((s, f) => s + f, 0) / Math.max(1, frames.length);
    const domRows = host.current!.querySelectorAll('[role=row]').length - 1;
    scroller.scrollTop = 0;

    return {
      rows: n,
      initialRenderMs: Math.round(initialRenderMs),
      sortMs: Math.round(sortMs),
      avgFps: Math.round(1000 / avg),
      p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
      longFrames: frames.filter((f) => f > 34).length,
      domRows,
    };
  }

  async function runAll() {
    setRunning(true);
    setResults([]);
    const out: BenchResult[] = [];
    for (const n of SIZES) {
      out.push(await runOne(n));
      setResults([...out]);
    }
    setRunning(false);
  }

  // Expose results for automated runs (Playwright) once the last run has rendered.
  useEffect(() => {
    window.__tkBench = { results, done: !running && results.length === SIZES.length, runAll };
  });

  return (
    <div>
      <h1>Benchmarks</h1>
      <p className="lead">
        Run in your browser. Each run mounts a fresh table, sorts the City column (string compare),
        then scrolls top-to-bottom for two seconds while recording frame times.
      </p>
      <div className="toolbar">
        <button type="button" className="primary" disabled={running} onClick={runAll}>
          {running ? 'Running…' : 'Run benchmarks'}
        </button>
        <span className="muted">Tip: close DevTools for realistic numbers.</span>
      </div>
      <table className="results">
        <thead>
          <tr>
            <th>Rows</th>
            <th>Initial render</th>
            <th>Sort (City)</th>
            <th>Scroll avg FPS</th>
            <th>p95 frame</th>
            <th>Long frames (&gt;34ms)</th>
            <th>DOM rows</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((n) => {
            const r = results.find((x) => x.rows === n);
            return (
              <tr key={n}>
                <td>{n.toLocaleString()}</td>
                <td>{r ? `${r.initialRenderMs} ms` : '—'}</td>
                <td>{r ? `${r.sortMs} ms` : '—'}</td>
                <td>{r ? r.avgFps : '—'}</td>
                <td>{r ? `${r.p95FrameMs} ms` : '—'}</td>
                <td>{r ? r.longFrames : '—'}</td>
                <td>{r ? r.domRows : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div ref={host} className="bench-host">
        {size !== null ? (
          <BenchTable data={datasets[size]!} onCommit={onCommit} />
        ) : (
          <div className="bench-placeholder muted">Table appears here while benchmarks run.</div>
        )}
      </div>
    </div>
  );
}
