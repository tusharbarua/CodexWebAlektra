import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";

const fallbackPath = "C:\\Users\\Dell\\Downloads\\8459631-hd_1920_1080_30fps.mp4";

export async function GET(request: Request) {
  const filePath = process.env.THERMAL_VIDEO_PATH || fallbackPath;
  if (!existsSync(filePath)) return new Response(null, { status: 404 });
  const size = statSync(filePath).size;
  const range = request.headers.get("range");
  if (range) {
    const [startText, endText] = range.replace("bytes=", "").split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : size - 1;
    const stream = createReadStream(filePath, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: { "Content-Type": "video/mp4", "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes" }
    });
  }
  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, { headers: { "Content-Type": "video/mp4", "Content-Length": String(size), "Accept-Ranges": "bytes" } });
}
