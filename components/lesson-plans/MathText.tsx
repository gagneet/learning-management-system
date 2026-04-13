"use client";

import { MathJax, MathJaxContext } from "better-react-mathjax";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
};

interface MathTextProps {
  content: string;
  className?: string;
}

export default function MathText({ content, className = "" }: MathTextProps) {
  return (
    <MathJaxContext config={mathJaxConfig}>
      <MathJax dynamic hideUntilTypeset="first">
        <div className={`whitespace-pre-wrap leading-7 ${className}`.trim()}>{content}</div>
      </MathJax>
    </MathJaxContext>
  );
}
