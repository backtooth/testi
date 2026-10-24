const HELSINKI_TIME_ZONE = "Europe/Helsinki";

function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HELSINKI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function setDate() {
  document.querySelector("#today").textContent = new Intl.DateTimeFormat("fi-FI", {
    timeZone: HELSINKI_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function eventCard(event) {
  const article = document.createElement("article");
  article.className = "event";

  const venue = document.createElement("p");
  venue.className = "venue";
  venue.textContent = event.venue;

  const content = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = event.title;
  const details = document.createElement("p");
  details.className = "details";
  details.textContent = event.details;
  content.append(title, details);

  const links = document.createElement("div");
  links.className = "links";
  for (const link of event.links) {
    const anchor = document.createElement("a");
    anchor.className = "button";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label || "Lisätiedot";
    links.append(anchor);
  }

  if (!event.links.length) {
    const anchor = document.createElement("a");
    anchor.className = "button";
    anchor.href = event.source_url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = "Tapahtumapaikka";
    links.append(anchor);
  }

  article.append(venue, content, links);
  return article;
}

async function loadEvents() {
  const container = document.querySelector("#events");
  const count = document.querySelector("#event-count");

  try {
    const response = await fetch("data/events.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const today = localDateKey();
    const events = data.events.filter((event) => event.date === today);

    container.replaceChildren();
    count.textContent = events.length ? `${events.length} ${events.length === 1 ? "tapahtuma" : "tapahtumaa"}` : "";

    if (events.length) {
      events.forEach((event) => container.append(eventCard(event)));
    } else {
      const message = document.createElement("article");
      message.className = "message";
      message.innerHTML = "<p>Tälle päivälle ei löytynyt tapahtumia.</p>";
      container.append(message);
    }

    const updated = new Date(data.updated_at);
    document.querySelector("#updated").textContent = `Päivitetty ${new Intl.DateTimeFormat("fi-FI", {
      timeZone: HELSINKI_TIME_ZONE,
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(updated)}`;
  } catch (error) {
    console.error(error);
    container.innerHTML = '<article class="message"><p>Tapahtumatietoja ei saatu ladattua. Yritä hetken kuluttua uudelleen.</p></article>';
  } finally {
    container.setAttribute("aria-busy", "false");
  }
}

setDate();
loadEvents();
