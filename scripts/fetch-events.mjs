#!/usr/bin/env node

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KUUDES_LINJA_URL = "https://kuudeslinja.com/";
const LEPAKKOMIES_URL = "https://www.lepis.fi/tapahtumat/";
const ROCKS_URL = "https://www.rocks.fi/";
const KULTTUURITALO_URL = "https://kulttuuritalo.fi/tapahtumat/";
const TAVASTIA_URL = "https://tavastiaklubi.fi/";
const SEMIFINAL_URL = "https://tavastiaklubi.fi/semifinal/";
const OUTPUT = resolve("tapahtumat/data/events.json");
const MANUAL_EVENTS = resolve("tapahtumat/data/manual-events.json");

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

function elementWithClass(html, className) {
  const pattern = new RegExp(`<([a-z][a-z0-9]*)[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`, "i");
  return html.match(pattern)?.[2] ?? "";
}

function firstHref(html) {
  const href = html.match(/<a[^>]*href=["']([^"']+)["']/i)?.[1];
  return href ? decodeHtml(href) : "";
}

export function parseKuudesLinjaEvents(html, now = new Date()) {
  const today = helsinkiDateParts(now);
  const articles = html.match(/<article[^>]*class=["'][^"']*\bevent\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) ?? [];
  return articles.map((article) => {
    const links = [...article.matchAll(/<a[^>]*class=["'][^"']*\bevent-button\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(([, url, label]) => ({ url: new URL(decodeHtml(url), KUUDES_LINJA_URL).href, label: textFromHtml(label) }));
    const dateText = textFromHtml(field(article, "pvm"));
    return {
      venue: "Kuudes Linja",
      date: dateKey(dateText, today),
      title: textFromHtml(field(article, "title")),
      details: textFromHtml(field(article, "info"), true),
      links,
      source_url: KUUDES_LINJA_URL,
    };
  });
}

export function parseLepakkomiesEvents(html, now = new Date()) {
  return parseMediaaniEvents(html, now, "Lepakkomies", LEPAKKOMIES_URL);
}

export function parseRocksEvents(html, now = new Date()) {
  return parseMediaaniEvents(html, now, "On the Rocks", ROCKS_URL);
}

function parseMediaaniEvents(html, now, venue, sourceUrl) {
  const today = helsinkiDateParts(now);
  const articles = html.match(/<article[^>]*class=["'][^"']*\btapahtuma\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) ?? [];
  return articles.map((article) => {
    const titleHtml = elementWithClass(article, "h2");
    const dateText = textFromHtml(elementWithClass(article, "date-info"));
    const space = textFromHtml(elementWithClass(article, "tapahtumatila"));
    const price = textFromHtml(elementWithClass(article, "lippujen-lisatieto"));
    const eventUrl = firstHref(titleHtml);
    const ticketUrl = article.match(/<a[^>]*class=["'][^"']*\bbtn-tiketti\b[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];
    const links = [];
    if (eventUrl) links.push({ url: new URL(eventUrl, sourceUrl).href, label: "Lisätiedot" });
    if (ticketUrl) links.push({ url: new URL(decodeHtml(ticketUrl), sourceUrl).href, label: "Liput" });
    return {
      venue,
      date: dateKey(dateText, today),
      title: textFromHtml(titleHtml),
      details: [space, dateText.replace(/^\S+\s+\d{1,2}\.\d{1,2}\.\d{4}\s*\/\s*/i, ""), price].filter(Boolean).join("\n"),
      links,
      source_url: sourceUrl,
    };
  });
}

export function parseKulttuuritaloEvents(html) {
  const cards = html.split(/<div class=["']pp-content-post\s/gi).slice(1);
  return cards.flatMap((card) => {
    const title = textFromHtml(elementWithClass(card, "pp-content-grid-post-title"));
    const meta = elementWithClass(card, "pp-content-grid-post-meta");
    const dateText = textFromHtml(meta).match(/\d{1,2}\.\d{1,2}\.\d{4}/)?.[0];
    const eventUrl = card.match(/itemid=["']([^"']+)["']/i)?.[1] ?? firstHref(card);
    if (!title || !dateText || !eventUrl) return [];
    const price = textFromHtml(elementWithClass(meta, "ticket-price"));
    return [{
      venue: "Kulttuuritalo",
      date: dateKey(dateText, helsinkiDateParts()),
      title,
      details: price,
      links: [{ url: new URL(decodeHtml(eventUrl), KULTTUURITALO_URL).href, label: "Lisätiedot" }],
      source_url: KULTTUURITALO_URL,
    }];
  });
}

function attribute(tag, name) {
  return decodeHtml(tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] ?? "");
}

export function parseTavastiaEvents(html, venue, sourceUrl, locationClass) {
  const cards = html.match(/<a[^>]*class=["'][^"']*\btiketti-list-item\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) ?? [];
  return cards.flatMap((card) => {
    const startTag = card.match(/^<a[^>]*>/i)?.[0] ?? "";
    if (!attribute(startTag, "class").split(/\s+/).includes(locationClass)) return [];
    const eventUrl = attribute(startTag, "href");
    const date = attribute(startTag, "data-begin-date");
    const title = textFromHtml(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    if (!eventUrl || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) return [];
    const details = textFromHtml(card.replace(/<\/div>/gi, "\n"), true)
      .split("\n")
      .filter((line) => line !== title && !/^\S+\s+\d{1,2}\.\d{1,2}\.$/i.test(line) && line !== "Osta liput")
      .join("\n");
    return [{
      venue,
      date,
      title,
      details,
      links: [{ url: new URL(eventUrl, sourceUrl).href, label: "Lisätiedot" }],
      source_url: sourceUrl,
    }];
  });
}

async function fetchHtml(url) {
  return fetch(url, { headers: { "user-agent": "tapahtumat-pages/1.0 (+GitHub Pages)" } }).then((response) => {
    if (!response.ok) throw new Error(`${url} vastasi HTTP ${response.status}`);
    return response.text();
  });
}

async function loadManualEvents() {
  const data = JSON.parse(await readFile(MANUAL_EVENTS, "utf8"));
  if (!Array.isArray(data.events)) throw new Error("manual-events.json: events ei ole lista");
  return data.events.map((event, index) => {
    if (!event.venue || !/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !event.title || !event.source_url) {
      throw new Error(`manual-events.json: tapahtuma ${index + 1} on puutteellinen`);
    }
    return { ...event, details: event.details ?? "", links: event.links ?? [] };
  });
}

async function main() {
  const kuudesInput = process.argv.indexOf("--kuudes-input");
  const lepisInput = process.argv.indexOf("--lepis-input");
  const [kuudesHtml, lepisHtml, rocksHtml, kulttuuritaloHtml, tavastiaHtml, semifinalHtml, manualEvents] = await Promise.all([
    kuudesInput >= 0 ? readFile(process.argv[kuudesInput + 1], "utf8") : fetchHtml(KUUDES_LINJA_URL),
    lepisInput >= 0 ? readFile(process.argv[lepisInput + 1], "utf8") : fetchHtml(LEPAKKOMIES_URL),
    fetchHtml(ROCKS_URL),
    fetchHtml(KULTTUURITALO_URL),
    fetchHtml(TAVASTIA_URL),
    fetchHtml(SEMIFINAL_URL),
    loadManualEvents(),
  ]);
  const events = [
    ...parseKuudesLinjaEvents(kuudesHtml),
    ...parseLepakkomiesEvents(lepisHtml),
    ...parseRocksEvents(rocksHtml),
    ...parseKulttuuritaloEvents(kulttuuritaloHtml),
    ...parseTavastiaEvents(tavastiaHtml, "Tavastia", TAVASTIA_URL, "location-tavastia-klubi"),
    ...parseTavastiaEvents(semifinalHtml, "Semifinal", SEMIFINAL_URL, "location-semifinal"),
    ...manualEvents,
  ];
  if (!events.length) throw new Error("Yhtään tapahtumaa ei löytynyt; vanha data säilytetään.");
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify({ updated_at: new Date().toISOString(), events }, null, 2)}\n`, "utf8");
  console.log(`Tallennettiin ${events.length} tapahtumaa tiedostoon ${OUTPUT}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
