import { parsePolicyPoints } from "@/lib/policy-format";

export function PolicyFormattedText({ content }: { content: string }) {
  const points = parsePolicyPoints(content);
  if (!points.length) {
    return <p>Policy content is currently unavailable. Please contact Alektra Renewable before placing your order.</p>;
  }
  return (
    <>
      {points.map((point) => (
        <p className="policy-point" key={`${point.number}-${point.title}`}>
          {point.number ? <span className="policy-point-number">{point.number}.</span> : null}
          {point.title ? <> <strong><u>{point.title}</u>:</strong></> : null}
          {point.body ? <> {point.body}</> : null}
        </p>
      ))}
    </>
  );
}
