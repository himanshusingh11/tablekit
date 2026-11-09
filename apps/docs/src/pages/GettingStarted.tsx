import { Code } from '../components/Code';
import { Demo } from '../components/Demo';
import { BasicExample } from '../examples/BasicExample';
import basicSource from '../examples/BasicExample.tsx?raw';

export function GettingStarted() {
  return (
    <div>
      <p className="eyebrow">React data table · ~5 KB</p>
      <h1>TableKit</h1>
      <p className="lead">
        A small, fast, accessible React data table. Virtualization and the ARIA grid keyboard
        pattern are <strong>built in, not bolted on</strong>. Sorting, filtering, resizing, pinning
        and selection work out of the box, and a framework-agnostic core does the work underneath.
      </p>
      <ul className="features">
        <li>
          <b>100K rows</b> scroll smoothly. Only visible rows are in the DOM.
        </li>
        <li>
          <b>Accessible by default</b>: <code>role="grid"</code>, roving tabindex, correct{' '}
          <code>aria-rowindex</code> while virtualized.
        </li>
        <li>
          <b>Typed</b> column definitions with generics.
        </li>
        <li>
          <b>Client or server</b>: flip <code>manualSorting</code> / <code>manualFiltering</code>.
        </li>
        <li>
          <b>Zero runtime dependencies</b>. React 18 and 19 are peer dependencies.
        </li>
        <li>
          <b>Themeable</b> with CSS variables.
        </li>
      </ul>

      <h2>Install</h2>
      <Code lang="sh">{`npm install react-tablekit`}</Code>

      <h2>Quick start</h2>
      <Demo description="Click a header to sort (shift+click to multi-sort). Tab into the grid and use the arrow keys.">
        <BasicExample />
      </Demo>
      <Code>{basicSource}</Code>

      <h2>Keyboard</h2>
      <table className="keys">
        <tbody>
          <tr>
            <td>
              <kbd>Tab</kbd>
            </td>
            <td>Enter / leave the grid (it has a single tab stop)</td>
          </tr>
          <tr>
            <td>
              <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>
            </td>
            <td>Move between cells</td>
          </tr>
          <tr>
            <td>
              <kbd>Home</kbd> / <kbd>End</kbd>
            </td>
            <td>First / last cell in the row</td>
          </tr>
          <tr>
            <td>
              <kbd>Ctrl</kbd>+<kbd>Home</kbd> / <kbd>Ctrl</kbd>+<kbd>End</kbd>
            </td>
            <td>First / last cell in the grid</td>
          </tr>
          <tr>
            <td>
              <kbd>PageUp</kbd> / <kbd>PageDown</kbd>
            </td>
            <td>Move one viewport up / down</td>
          </tr>
          <tr>
            <td>
              <kbd>Enter</kbd> on header
            </td>
            <td>
              Sort (<kbd>Shift</kbd>+<kbd>Enter</kbd> adds to a multi-sort)
            </td>
          </tr>
          <tr>
            <td>
              <kbd>Space</kbd>
            </td>
            <td>
              Toggle row selection (<kbd>Shift</kbd>+<kbd>Space</kbd> selects a range)
            </td>
          </tr>
          <tr>
            <td>
              <kbd>Ctrl</kbd>+<kbd>A</kbd>
            </td>
            <td>Select all (filtered) rows</td>
          </tr>
          <tr>
            <td>
              <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> on header
            </td>
            <td>Resize the column</td>
          </tr>
          <tr>
            <td>
              <kbd>Enter</kbd> on a row
            </td>
            <td>
              Calls <code>onRowClick</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
