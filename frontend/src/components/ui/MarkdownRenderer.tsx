import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by fenced code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let blockIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      elements.push(
        <TextSection key={`text-${lastIndex}`} text={textBefore} />
      );
    }

    const lang = match[1] || 'code';
    const code = match[2];
    const currentIndex = blockIndex++;

    elements.push(
      <div key={`code-${match.index}`} className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
          <span className="font-semibold uppercase tracking-wider">{lang}</span>
          <button
            onClick={() => handleCopy(code, currentIndex)}
            className="flex items-center gap-1 hover:text-white transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800"
            title="Copy code"
          >
            {copiedIndex === currentIndex ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed font-mono">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    elements.push(<TextSection key={`text-${lastIndex}`} text={remainingText} />);
  }

  return (
    <div className={`prose-sm max-w-none text-slate-800 leading-relaxed space-y-2 ${className}`}>
      {elements}
    </div>
  );
};

// Component for rendering markdown paragraphs, lists, headers, and inline elements
const TextSection: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={key} className="list-disc pl-5 my-1.5 space-y-1 text-slate-700">
          {currentList.map((item, idx) => (
            <li key={idx}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(`list-${idx}`);
      const itemText = trimmed.replace(/^\d+\.\s/, '');
      renderedElements.push(
        <div key={`numbered-${idx}`} className="flex gap-2 my-1 text-slate-700">
          <span className="font-semibold text-navy-800 text-xs mt-0.5">{trimmed.match(/^\d+\./)?.[0]}</span>
          <div className="flex-1">
            <InlineText text={itemText} />
          </div>
        </div>
      );
    } else {
      flushList(`list-${idx}`);

      if (trimmed.startsWith('### ')) {
        renderedElements.push(
          <h4 key={`h4-${idx}`} className="text-sm font-bold text-navy-900 mt-3 mb-1">
            <InlineText text={trimmed.substring(4)} />
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        renderedElements.push(
          <h3 key={`h3-${idx}`} className="text-base font-bold text-navy-900 mt-3.5 mb-1.5">
            <InlineText text={trimmed.substring(3)} />
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        renderedElements.push(
          <h2 key={`h2-${idx}`} className="text-lg font-extrabold text-navy-900 mt-4 mb-2">
            <InlineText text={trimmed.substring(2)} />
          </h2>
        );
      } else if (trimmed.startsWith('> ')) {
        renderedElements.push(
          <blockquote key={`quote-${idx}`} className="border-l-4 border-saffron-500 pl-3 my-2 text-slate-600 italic bg-amber-50/50 py-1 rounded-r">
            <InlineText text={trimmed.substring(2)} />
          </blockquote>
        );
      } else if (trimmed.length > 0) {
        renderedElements.push(
          <p key={`p-${idx}`} className="my-1 text-slate-800">
            <InlineText text={trimmed} />
          </p>
        );
      }
    }
  });

  flushList(`list-end`);

  return <>{renderedElements}</>;
};

// Component to handle bold, italic, inline code, and links
const InlineText: React.FC<{ text: string }> = ({ text }) => {
  // Replace inline code `code`
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // Inline code
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] bg-slate-100 text-saffron-700 font-semibold border border-slate-200"
            >
              {part.substring(1, part.length - 1)}
            </code>
          );
        }

        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-navy-900">
              {part.substring(2, part.length - 2)}
            </strong>
          );
        }

        // Links [label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-saffron-600 hover:text-saffron-700 underline font-medium"
            >
              {linkMatch[1]}
            </a>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

