# event-to-cal

Turn any event link into an iPhone Calendar invite — instantly.

Paste a URL from Eventbrite, Luma, Partiful, or most event pages. The app extracts the event name, date, time, and location, then generates a `.ics` file you can tap to add directly to your iPhone Calendar. No manual typing needed.

**Live demo:** [event-to-cal.vercel.app](https://event-to-cal.vercel.app)

---

## How it works

1. Paste an event URL into the app
2. The backend fetches the page and extracts event details using HTML parsing (no AI, no external APIs)
3. A `.ics` calendar file is generated
4. Download it and tap to add to iPhone Calendar instantly

## Tech stack

- **Frontend:** React + Vite, deployed on Vercel
- **Backend:** Node.js + Express + Cheerio, deployed on Render
- **Calendar:** ical-generator for `.ics` file creation

## Works with

- Eventbrite
- Luma
- Partiful
- Most public event pages with structured metadata

## Running locally

**Backend**
```bash
cd server
npm install
node index.js
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

## Project structure

```
event-to-cal/
├── server/        # Node.js/Express backend
│   └── index.js   # HTML scraping + .ics generation
└── client/        # React frontend
    └── src/
        └── App.jsx
```
