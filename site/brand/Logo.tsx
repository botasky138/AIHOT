// 站点的字标和圆环标记：页面用 Wordmark 画站名（size 是高度，单位像素），RingMark 是小标记，转起来就是加载动画。
// 这里用站名排字；有自己的 Logo 时，把 Wordmark 换成你的 SVG（保持同样的参数）。
import { SITE } from "../site.ts";

/** Inline mechanical mark: champagne M + gold bars on near-black (same geometry as site/brand/logo.svg). */
function MarkGlyph({ size }: { size: number }) {
  const px = Math.max(14, Math.round(size * 1.05));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={px}
      height={px}
      className="mr-[0.35em] shrink-0"
      aria-hidden="true"
      role="presentation"
    >
      <rect width="512" height="512" rx="112" fill="#0a0a0c" />
      <path d="M100 320V166h42l73 94 73-94h42v154h-43V231l-72 90-72-90v89z" fill="#e8d48b" />
      <path d="M385 200v120M416 200v120M447 200v120" fill="none" stroke="#c9a227" strokeWidth="12" strokeLinecap="round" />
      <path d="M108 365h296" fill="none" stroke="#3a3a40" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  return (
    <span className={`inline-flex items-center font-black leading-none tracking-[-0.03em] ${className}`} style={{ fontSize: Math.round(size * 0.92) }} aria-label={title} role="img">
      <MarkGlyph size={size} />
      <span aria-hidden="true">{SITE.name}</span>
    </span>
  );
}

/** A ring with a dot; spinning, it is the loader. */
export function RingMark({ className = "", spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g style={spinning ? { transformOrigin: "12px 12px", animation: "spin-slow 1.1s linear infinite" } : undefined}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="42 15" />
      </g>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
