/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR?.trim() || "public/uploads");
}

function uploadMount(root) {
  if (process.platform !== "linux") return null;
  const resolved = fs.realpathSync(root);
  const mounts = fs.readFileSync("/proc/self/mountinfo", "utf8").trim().split("\n");
  return mounts.map((line) => {
    const [left, right] = line.split(" - ");
    const [, , , , encodedTarget, options] = left.split(" ");
    const target = encodedTarget.replace(/\\([0-7]{3})/g, (_, code) => String.fromCharCode(parseInt(code, 8)));
    return { target, filesystem: right.split(" ")[0], writable: options.split(",").includes("rw") };
  }).filter(({ target }) => target === resolved || (target !== "/" && resolved.startsWith(`${target}/`)))
    .sort((first, second) => second.target.length - first.target.length)[0] ?? null;
}

function isWritablePersistentMount(mount) {
  return Boolean(mount?.writable && !["tmpfs", "ramfs", "overlay"].includes(mount.filesystem));
}

module.exports = { uploadRoot, uploadMount, isWritablePersistentMount };
