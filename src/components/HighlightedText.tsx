import { highlightMatch } from '../lib/search';

export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const h = highlightMatch(text, query);
  if (!h) return <>{text}</>;
  return (
    <>
      {h.before}
      <mark className="rounded bg-blue-500/25 px-0.5 text-cyan-200">
        {h.match}
      </mark>
      {h.after}
    </>
  );
}