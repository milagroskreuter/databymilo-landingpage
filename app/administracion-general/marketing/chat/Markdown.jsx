// Render mínimo de markdown para las respuestas del chat (sin HTML crudo).
// Soporta títulos, listas, negritas, itálicas, código y links.
import { Fragment } from "react";

function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      out.push(
        <a key={key} href={m[2]} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    } else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let list = null;
  let para = [];
  let code = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", lines: para });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (code) {
      if (line.startsWith("```")) {
        blocks.push(code);
        code = null;
      } else code.lines.push(raw);
      continue;
    }
    if (line.startsWith("```")) {
      flushPara();
      flushList();
      code = { type: "code", lines: [] };
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      blocks.push({ type: "h", level: h[1].length, text: h[2] });
    } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushPara();
      flushList();
      blocks.push({ type: "hr" });
    } else if (ul || ol) {
      flushPara();
      const kind = ul ? "ul" : "ol";
      if (!list || list.type !== kind) {
        flushList();
        list = { type: kind, items: [], start: ol ? Number(ol[1]) : 1 };
      }
      list.items.push(ul ? ul[1] : ol[2]);
    } else {
      flushList();
      para.push(line);
    }
  }
  if (code) blocks.push(code);
  flushPara();
  flushList();

  return (
    <div className="mk-chat-md">
      {blocks.map((b, i) => {
        if (b.type === "h") return <p key={i} className="mk-chat-md-h">{inline(b.text, i)}</p>;
        if (b.type === "hr") return <hr key={i} />;
        if (b.type === "code") return <pre key={i}><code>{b.lines.join("\n")}</code></pre>;
        if (b.type === "ul") return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}</ul>;
        if (b.type === "ol")
          return (
            <ol key={i} start={b.start}>
              {b.items.map((t, j) => <li key={j}>{inline(t, `${i}-${j}`)}</li>)}
            </ol>
          );
        return (
          <p key={i}>
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
