# Live Meta leads in React Native

This is my take on the assignment: submit a lead through a Meta lead ad form and
have it show up in an already open React Native screen by itself, without
touching the phone.

Short version of how it works: Meta sends a webhook when a lead comes in, but the
webhook only gives you a `leadgen_id`, not the actual answers. So the backend
takes that id, asks the Graph API for the real field data, and pushes it to the
app over a socket. The app keeps that socket open while the screen is up, so a
new lead just lands at the top of the list.

```
lead submitted on Meta
  -> leadgen webhook (only a leadgen_id) hits the backend
  -> backend reads the full lead from the Graph API
  -> socket push to the app
  -> shows up at the top of the list
```

One thing I did on purpose: if the Graph call fails (almost always a token or
permission thing), I still push the lead with whatever the webhook gave me, so
the screen never just sits there empty during a demo.

## Layout

- `backend/` - Express + Socket.IO. Takes the webhook, fetches the lead, sends it out.
- `mobile/` - Expo app, single screen with the live list.

## Running the backend

```
cd backend
npm install
cp .env.example .env   # fill it in
npm start
```

Listens on `http://localhost:4000`.

Env vars (also in `.env.example`):

- `PORT` - defaults to 4000
- `META_VERIFY_TOKEN` - any string, just has to match what you type into Meta's webhook screen
- `PAGE_ACCESS_TOKEN` - page token with `leads_retrieval`, this is what the Graph call uses
- `META_APP_SECRET` - only needed if you switch on signature checking
- `VERIFY_SIGNATURE` - `true` to verify the webhook signature, off by default
- `GRAPH_API_VERSION` - defaults to v21.0

## Getting it on the internet

Meta has to reach the webhook over https, so I just tunnel the local port:

```
ngrok http 4000
```

Grab the `https://...ngrok-free.app` URL. You'll use it twice: once in the Meta
webhook setup, and once in the app config.

## Running the app

Drop that ngrok URL into `mobile/config.js` (`BACKEND_URL`), then:

```
cd mobile
npm install
npx expo start
```

Scan the QR with Expo Go. The dot in the header turns green once the socket is up.

If you just want to check the socket path without going through Meta:

```
curl -X POST <ngrok-url>/dev/simulate
```

That fires a fake lead into the app.

## Meta side (you only do this once)

This part lives in your own Meta/Facebook account.

1. Make a Meta app at https://developers.facebook.com/apps (Business type).
2. You need a Facebook Page to own the form. Any name works, it can stay unpublished.
3. Get a page token with `leads_retrieval`:
   - Graph API Explorer, pick the app, Get Page Access Token, pick the Page.
   - Add `leads_retrieval` and `pages_manage_metadata`.
   - Paste it into `PAGE_ACCESS_TOKEN`.
4. Add the Webhooks product, object Page:
   - Callback URL is your ngrok URL plus `/webhook`.
   - Verify token is the same string you put in `META_VERIFY_TOKEN`.
   - Verify and save, then subscribe the Page to `leadgen`.
5. On that same screen, make sure the Page itself is subscribed to the app.

Then submit a test lead from the Lead Ads Testing Tool
(https://developers.facebook.com/tools/lead-ads-testing): pick the page and a
form, submit, and it should show up in the app.

The token expiring caught me out, so if it stops working that's the first thing
to check.

## Notes and what I left out

- I'm using the testing tool, no real ad spend, which is what the brief asked for.
- Went with WebSockets for the realtime bit. The screen is already open so a held
  socket is the simplest way to get a lead in. Push notifications felt like the
  wrong tool here, that's more of a notification UX and means dealing with device
  tokens I don't need.
- ngrok because it's a local PoC. A deployed backend would behave the same way.
- Leads are only kept in memory, no database, so they're gone when you restart.
  A real version would store them, but that's outside what this needs to show.
- The signature check is written but off by default, didn't want a wrong secret
  silently killing the demo.
- It assumes a single page and form, nothing multi-tenant.
