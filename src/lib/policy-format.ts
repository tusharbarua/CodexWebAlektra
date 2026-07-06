export type PolicyPoint = {
  number: string;
  title: string;
  body: string;
};

export function parsePolicyPoints(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(parsePolicyBlock);
}

export function renderPolicyPointsHtml(content: string) {
  const points = parsePolicyPoints(content);
  if (!points.length) {
    return `<p style="margin:0;color:#475569;">Policy content is currently unavailable. Please contact Alektra Renewable before placing your order.</p>`;
  }
  return points.map((point) => {
    const title = point.title
      ? `<strong style="font-weight:700;"><u>${escapeHtml(point.title)}</u>:</strong>`
      : "";
    return `<p style="margin:0 0 10px;color:#475569;line-height:1.58;"><span style="font-weight:700;color:#0f172a;">${escapeHtml(point.number)}.</span> ${title}${title ? " " : ""}${escapeHtml(point.body)}</p>`;
  }).join("");
}

export function renderPolicyPointsText(content: string) {
  return parsePolicyPoints(content)
    .map((point) => `${point.number}. ${point.title}: ${point.body}`)
    .join("\n");
}

function parsePolicyBlock(block: string): PolicyPoint {
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0] ?? "";
  const match = first.match(/^(\d+)\.\s*(.+?)(?::)?$/);
  if (!match) {
    return { number: "", title: "", body: stripUnsafeText(block) };
  }
  return {
    number: match[1],
    title: stripUnsafeText(match[2]).replace(/:$/, ""),
    body: stripUnsafeText(lines.slice(1).join(" "))
  };
}

export function stripUnsafeText(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
