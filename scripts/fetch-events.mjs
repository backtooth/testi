#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://kuudeslinja.com/";
const OUTPUT = resolve("tapahtumat/data/events.json");

function decodeHtml(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] === "#") {
      const hex = entity[1].toLowerCase() === "x";
      return String.fromCodePoint(Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return named[entity.toLowerCase()] ?? `&${entity};`;
  });
}

function textFromHtml(value, keepLines = false) {
  let text = value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "");
  text = decodeHtml(text).replace(/\u00a0/g, " ");
  if (!keepLines) return text.replace(/\s+/g, " ").trim();
  return text.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
}

function helsinkiDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
}

function dateKey(dateText, today) {
  const match = dateText.match(/(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?/);
  if (!match) throw new Error(`Tuntematon päivämäärä: ${dateText}`);
  const [, dayText, monthText, explicitYear] = match;
  let year = explicitYear ? Number(explicitYear) : today.year;
  const day = Number(dayText);
  const month = Number(monthText);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day));
  if (!explicitYear && candidate < new Date(todayUtc.getTime() - 45 * 86400000)) year += 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function field(article, className) {
  const pattern = new RegExp(`<div[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`, "i");
  return article.match(pattern)?.[1] ?? "";
}

export function parseEvents(html, now = new Date()) {
  const today = helsinkiDateParts(now);
  const articles = html.match(/<article[^>]*class=["'][^"']*\bevent\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) ?? [];
  return articles.map((article) => {
    const links = [...article.matchAll(/<a[^>]*class=["'][^"']*\bevent-button\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([, url, label]) => ({ url: new URL(decodeHtml(url), SOURCE_URL).href, label: textFromHtml(label) }));
    const dateText = textFromHtml(field(article, "pvm"));
    return {
      venue: "Kuudes Linja",
      date: dateKey(dateText, today),
      title: textFromHtml(field(article, "title")),
      details: textFromHtml(field(article, "info"), true),
      links,
      source_url: SOURCE_URL,
    };
  });
}

async function main() {
  const inputIndex = process.argv.indexOf("--input");
  const html = inputIndex >= 0
    ? await readFile(process.argv[inputIndex + 1], "utf8")
    : await fetch(SOURCE_URL, { headers: { "user-agent": "tapahtumat-pages/1.0 (+GitHub Pages)" } }).then((response) => {
        if (!response.ok) throw new Error(`Lähde vastasi HTTP ${response.status}`);
        return response.text();
      });
  const events = parseEvents(html);
  if (!events.length) throw new Error("Yhtään tapahtumaa ei löytynyt; vanha data säilytetään.");
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify({ updated_at: new Date().toISOString(), events }, null, 2)}\n`, "utf8");
  console.log(`Tallennettiin ${events.length} tapahtumaa tiedostoon ${OUTPUT}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
