#!/usr/bin/env node
// Keeps every manifest on the same version, so one git tag releases everything.
//   node scripts/version.mjs 1.2.0        set the version everywhere
//   node scripts/version.mjs --check 1.2.0   fail unless every manifest says 1.2.0

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const FILES = ["package.json", "server.json", "gemini-extension.json", ".plugin/plugin.json", ".cursor-plugin/plugin.json"];

const read = (file) => JSON.parse(readFileSync(root + file, "utf8"));
const write = (file, data) => writeFileSync(root + file, `${JSON.stringify(data, null, 2)}\n`);

/** Every place a version lives, as [label, value]. */
function versions() {
  const out = FILES.map((file) => [file, read(file).version]);
  const server = read("server.json");
  for (const pkg of server.packages ?? []) out.push([`server.json packages[${pkg.identifier}]`, pkg.version]);
  return out;
}

const args = process.argv.slice(2);
const check = args[0] === "--check";
const target = (check ? args[1] : args[0])?.replace(/^v/, "");

if (!target || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(target)) {
  console.error("Usage: node scripts/version.mjs [--check] <x.y.z>");
  process.exit(2);
}

if (check) {
  const wrong = versions().filter(([, value]) => value !== target);
  if (wrong.length) {
    for (const [label, value] of wrong) console.error(`✗ ${label} is ${value}, expected ${target}`);
    console.error(`Run: node scripts/version.mjs ${target}`);
    process.exit(1);
  }
  console.log(`✓ every manifest is at ${target}`);
} else {
  for (const file of FILES) {
    const data = read(file);
    data.version = target;
    if (file === "server.json") for (const pkg of data.packages ?? []) pkg.version = target;
    write(file, data);
  }
  console.log(`Set ${target} in ${FILES.join(", ")}`);
}
