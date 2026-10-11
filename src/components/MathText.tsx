"use client";

import { Fragment } from "react";
import { InlineMath } from "react-katex";

export function MathText({ text, className = "" }: { text?: string | null; className?: string }) {
  if (!text) return null;

  const normalized = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, expr) => `$$${expr}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, expr) => `$${expr}$`);

  const imageParts = normalized.split(/(\[\[IMAGE:data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+\]\])/g);
  if (imageParts.length > 1) return <span className={className}>{imageParts.map((part, idx) => {
    if (part.startsWith("[[IMAGE:") && part.endsWith("]]")) {
      return <img key={idx} src={part.slice(8, -2)} alt="Question diagram" style={{ maxWidth: "100%", height: "auto", display: "block", margin: "12px auto" }} />;
    }
    return <MathText key={idx} text={part} />;
  })}</span>;
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
