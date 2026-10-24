#!/usr/bin/env python3
"""Fetch event listings and write a static JSON file for GitHub Pages."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


SOURCE_URL = "https://kuudeslinja.com/"
HELSINKI = ZoneInfo("Europe/Helsinki")


def class_names(attributes: list[tuple[str, str | None]]) -> set[str]:
    return set(dict(attributes).get("class", "").split())


class KuudesLinjaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.events: list[dict] = []
        self.event: dict | None = None
        self.field: str | None = None
        self.field_depth = 0
        self.link: dict | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = class_names(attrs)
        attributes = dict(attrs)

        if tag == "article" and "event" in classes:
            self.event = {"date_text": "", "title": "", "details": "", "links": []}
            return
        if self.event is None:
            return

        if tag == "div" and (classes & {"pvm", "title", "info"}):
            self.field = next(iter(classes & {"pvm", "title", "info"}))
            self.field_depth = 1
        elif self.field and tag not in {"br", "img", "meta", "link", "hr", "input"}:
            self.field_depth += 1

        if tag == "a" and "event-button" in classes:
            self.link = {"url": urljoin(SOURCE_URL, attributes.get("href", "")), "label": ""}
        if tag == "br" and self.field == "info":
            self.event["details"] += "\n"

    def handle_endtag(self, tag: str) -> None:
        if self.event is None:
            return
        if tag == "a" and self.link is not None:
            self.link["label"] = clean(self.link["label"])
            if self.link["url"]:
                self.event["links"].append(self.link)
            self.link = None
        if self.field:
            self.field_depth -= 1
            if self.field_depth == 0:
                self.field = None
        if tag == "article":
            self.events.append(self.event)
            self.event = None
            self.field = None

    def handle_data(self, data: str) -> None:
        if self.event is None:
            return
        if self.link is not None:
            self.link["label"] += data
        if self.field == "pvm":
            self.event["date_text"] += data
        elif self.field == "title":
            self.event["title"] += data
        elif self.field == "info":
            self.event["details"] += data


def clean(value: str) -> str:
    value = value.replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.splitlines()]
    return "\n".join(line for line in lines if line)


def parse_date(value: str, today: date) -> date:
    match = re.search(r"(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?", value)
    if not match:
        raise ValueError(f"Tuntematon päivämäärä: {value!r}")
    day, month, explicit_year = match.groups()
    if explicit_year:
        return date(int(explicit_year), int(month), int(day))

    result = date(today.year, int(month), int(day))
    if result < today - timedelta(days=45):
        result = date(today.year + 1, int(month), int(day))
    return result


def parse_events(html: str, today: date) -> list[dict]:
    parser = KuudesLinjaParser()
    parser.feed(html)
    events = []
    for raw in parser.events:
        try:
            event_date = parse_date(clean(raw["date_text"]), today)
        except ValueError as error:
            print(f"Ohitetaan tapahtuma: {error}")
            continue
        events.append({
            "venue": "Kuudes Linja",
            "date": event_date.isoformat(),
            "title": clean(raw["title"]),
            "details": clean(raw["details"]),
            "links": raw["links"],
            "source_url": SOURCE_URL,
        })
    return events


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": "tapahtumat-pages/1.0 (+GitHub Pages)"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="Käytä paikallista HTML-tiedostoa")
    parser.add_argument("--output", type=Path, default=Path("tapahtumat/data/events.json"))
    args = parser.parse_args()

    now = datetime.now(HELSINKI)
    html = args.input.read_text(encoding="utf-8") if args.input else fetch(SOURCE_URL)
    events = parse_events(html, now.date())
    if not events:
        raise SystemExit("Yhtään tapahtumaa ei löytynyt; vanha data säilytetään.")

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "events": events,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Tallennettiin {len(events)} tapahtumaa tiedostoon {args.output}")


if __name__ == "__main__":
    main()
