"use client";

import { Fragment } from "react";
import { InlineMath } from "react-katex";

export function MathText({ text, className = "" }: { text?: string | null; className?: string }) {
  if (!text) return null;

  const normalized = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, expr) => `$${expr}$`);

  const chunks = normalized.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g).filter(Boolean);

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {chunks.map((chunk, i) => {
        if (chunk.startsWith("$$") && chunk.endsWith("$$")) {
          return (
            <span className="math-block" key={i}>
              <InlineMath math={chunk.slice(2, -2)} renderError={() => <span>{chunk}</span>} />
            </span>
          );
        }
        if (chunk.startsWith("$") && chunk.endsWith("$")) {
          return <InlineMath key={i} math={chunk.slice(1, -1)} renderError={() => <span>{chunk}</span>} />;
        }
        return <Fragment key={i}>{chunk}</Fragment>;
      })}
    </span>
  );
}
