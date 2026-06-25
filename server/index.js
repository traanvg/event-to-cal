require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const ical = require("ical-generator");

const app = express();
app.use(cors());
app.use(express.json());

const MONTHS = {
  january:0,february:1,march:2,april:3,may:4,june:5,
  july:6,august:7,september:8,october:9,november:10,december:11,
  jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
};

const pad = (n) => String(n).padStart(2, "0");

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
    timeout: 10000,
  });
  return data;
}

function parseDate(text) {
  // Match "Friday, June 26, 2026" or "June 26, 2026"
  const dateMatch = text.match(
    /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s*(\d{4})/i
  );
  if (!dateMatch) return null;
  const month = MONTHS[dateMatch[1].toLowerCase()];
  const day = parseInt(dateMatch[2]);
  const year = parseInt(dateMatch[3]);
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseTime(text) {
  let startTime = null, endTime = null;

  // Match "3 PM-10 PM" or "3:00 PM - 10:00 PM"
  const rangeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (rangeMatch) {
    let sh = parseInt(rangeMatch[1]);
    const sm = rangeMatch[2] ? parseInt(rangeMatch[2]) : 0;
    const sp = rangeMatch[3].toUpperCase();
    if (sp === "PM" && sh < 12) sh += 12;
    if (sp === "AM" && sh === 12) sh = 0;
    startTime = `${pad(sh)}:${pad(sm)}`;

    let eh = parseInt(rangeMatch[4]);
    const em = rangeMatch[5] ? parseInt(rangeMatch[5]) : 0;
    const ep = rangeMatch[6].toUpperCase();
    if (ep === "PM" && eh < 12) eh += 12;
    if (ep === "AM" && eh === 12) eh = 0;
    endTime = `${pad(eh)}:${pad(em)}`;
  } else {
    // Single time "3 PM"
    const singleMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (singleMatch) {
      let sh = parseInt(singleMatch[1]);
      const sm = singleMatch[2] ? parseInt(singleMatch[2]) : 0;
      const sp = singleMatch[3].toUpperCase();
      if (sp === "PM" && sh < 12) sh += 12;
      if (sp === "AM" && sh === 12) sh = 0;
      startTime = `${pad(sh)}:${pad(sm)}`;
    }
  }

  return { startTime, endTime };
}

function extractEvent(html) {
  const $ = cheerio.load(html);

  const pageTitle = $("title").text();
  const metaDesc = $('meta[name="description"]').attr("content") || "";

  // Try JSON-LD
  let jsonEvent = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const data = Array.isArray(json) ? json[0] : json;
      if (data["@type"] === "Event" || data["@type"] === "MusicEvent") {
        jsonEvent = data;
      }
    } catch (e) {}
  });

  // Title
  let title = jsonEvent?.name || null;
  if (!title) {
    title = $('meta[property="og:title"]').attr("content") || pageTitle || null;
    if (title) title = title.replace(/\s*Tickets.*$/i, "").replace(/\s*\|.*$/i, "").trim();
  }

  // Description
  let description = jsonEvent?.description?.slice(0, 200) || metaDesc.slice(0, 200) || null;

  // Location
  let location = null;
  if (jsonEvent?.location) {
    const loc = jsonEvent.location;
    const addr = loc.address || {};
    location = [loc.name, addr.streetAddress, addr.addressLocality, addr.addressRegion]
      .filter(Boolean).join(", ");
  }
  if (!location) {
    const locMatch = metaDesc.match(/\bat\s+(.+?)\.\s*Find/i);
    if (locMatch) location = locMatch[1].trim();
  }

  // Date — from JSON-LD, then meta description, then page title
  let date = null;
  if (jsonEvent?.startDate) {
    const d = new Date(jsonEvent.startDate);
    if (!isNaN(d)) date = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  if (!date) date = parseDate(metaDesc);
  if (!date) date = parseDate(pageTitle);

  // Time — from JSON-LD, then page title (has "3 PM-10 PM"), then meta desc
  let startTime = null, endTime = null;
  if (jsonEvent?.startDate) {
    const d = new Date(jsonEvent.startDate);
    const e = jsonEvent.endDate ? new Date(jsonEvent.endDate) : null;
    if (!isNaN(d)) {
      startTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (e && !isNaN(e)) {
      endTime = `${pad(e.getHours())}:${pad(e.getMinutes())}`;
    }
  }
  if (!startTime) {
    const t = parseTime(pageTitle);
    startTime = t.startTime;
    endTime = t.endTime;
  }
  if (!startTime) {
    const t = parseTime(metaDesc);
    startTime = t.startTime;
    endTime = t.endTime;
  }

  return { title, date, startTime, endTime, location, description, timezone: "America/Los_Angeles" };
}

function buildICS(event) {
  const cal = ical.default({ name: "Event" });

  const startDate = event.date && event.startTime
    ? new Date(`${event.date}T${event.startTime}:00`)
    : event.date
    ? new Date(`${event.date}T12:00:00`)
    : null;

  const endDate = event.date && event.endTime
    ? new Date(`${event.date}T${event.endTime}:00`)
    : startDate
    ? new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
    : null;

  if (!startDate) throw new Error("Could not determine event date/time");

  cal.createEvent({
    start: startDate,
    end: endDate,
    summary: event.title || "Event",
    location: event.location || "",
    description: event.description || "",
    timezone: event.timezone || "America/Los_Angeles",
  });

  return cal.toString();
}

app.post("/api/parse", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const html = await fetchHTML(url);
    const eventData = extractEvent(html);

    if (!eventData.title) {
      return res.status(422).json({ error: "Could not extract event details from this page." });
    }

    const icsContent = buildICS(eventData);
    res.json({ event: eventData, ics: icsContent });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));