import { useState } from 'react';

export function Code({ children, lang = 'tsx' }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const code = children.replace(/^\n/, '').trimEnd();
  return (
    <div className="code">
      <div className="code-bar">
        <span>{lang}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`${lang} code`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
