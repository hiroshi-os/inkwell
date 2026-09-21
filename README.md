# Inkwell

A small **serialized storytelling** platform: authors publish stories as chapters; readers browse, read, follow, and save. Original product — not a Wattpad clone and not an AI writing tool.

| Piece | Choice | Why |
| --- | --- | --- |
| API | **Go 1.22** + [chi](https://github.com/go-chi/chi) | Preferred in the brief; one static binary, easy Docker |
| DB | **SQLite** locally, **Postgres 16** in Compose | Zero-dep `go run`; production-shaped SQL in Docker |
| Web | **Next.js 14** (App Router) | Browse / read / write / follow |
| Android | **Kotlin + Jetpack Compose** | Browse, chapter reader, JWT auth, library + profile |

System design (Hello Interview structure: requirements, estimates, API, data model, feed/read/write/search deep dives): **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)**.

---

## What works

- Register / login (JWT)
- Story + chapter CRUD for the author
- Public browse, genre chips, title/synopsis search (`LIKE`)
- Chapter reader with previous/next
- Follow author + following feed (chrono SQL)
- Library save/remove
- Seeded original fiction so the shelf is not empty
- Web authoring desk (`/write`)
- Android client talking to the same API

## What’s stubbed / honest gaps

- **Search** is substring `LIKE`, not an index
- **Feed** is a join, not fan-out / ranking (see design doc)
- **Library** is a server-side save list — no offline files
- **Android** does not author stories (write on web)
- **JWT in localStorage** / SharedPreferences — demo auth, not cookie+refresh hardening
- **No** comments, votes, uploads, payments, notifications, or AI assistants

---

## 60-second demo

Requires Go 1.22+ and Node 20+.

```bash
# 1. API (seeds iris / niko / reader, password password123)
cd api && go run ./cmd/server
# → http://localhost:8080/health

# 2. Web (other terminal)
cd web && npm install && npm run dev
# → http://localhost:3000
```

Then:

1. Open `/` — three seeded stories on the shelf.
2. Open **The Last Lantern** → **Start reading** → Next chapter.
3. **Log in** as `iris` / `password123` (pre-filled).
4. **Save to library**, **Follow** from another story, open **Following** and **Library**.
5. **Write** → new story → **+ Chapter** → save → it appears on Browse.

```bash
curl -s localhost:8080/api/stories | python3 -m json.tool | head
```

### Docker (API + Postgres + web)

```bash
docker compose up --build
# API  :8080   web :3000   Postgres :5432
```

Browser still calls `http://localhost:8080` (published API port). Change `JWT_SECRET` before any real deploy.

### Android (Gradle)

Needs Android SDK / Android Studio (compileSdk 34, JDK 17). API must be running on the host.

```bash
cd android
# first time, if the wrapper jar is missing: gradle wrapper --gradle-version 8.7
./gradlew :app:assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

- Emulator: `BuildConfig.API_BASE_URL` is `http://10.0.2.2:8080/` (host loopback).
- Physical device: set that field in `android/app/build.gradle.kts` to `http://<your-lan-ip>:8080/`.
- Cleartext HTTP is allowed for the demo (`network_security_config`).

Open the app → **Browse** should list the same seed stories → read a chapter → **You** → log in as `reader`.

---

## Repo layout

```
api/        Go service (cmd/server, internal/{auth,store,server})
web/        Next.js UI
android/    Kotlin Compose client
SYSTEM_DESIGN.md
docker-compose.yml
```

Seed users (created only when the user table is empty):

| Username | Password | Role |
| --- | --- | --- |
| `iris` | `password123` | Author of *The Last Lantern*, *Letters at Dusk* |
| `niko` | `password123` | Author of *Salt and Copper* |
| `reader` | `password123` | Follows iris; lantern already in library |

---

## API (short)

| Method | Path |
| --- | --- |
| POST | `/api/auth/register` `/api/auth/login` |
| GET/PATCH | `/api/me` |
| GET | `/api/stories` `/api/stories/{id}` `/api/stories/{id}/chapters/{cid}` |
| POST/PUT/DELETE | `/api/stories/{id}` and `.../chapters/{cid}` (author) |
| GET | `/api/feed` `/api/me/library` |
| POST/DELETE | `/api/users/{id}/follow` `/api/stories/{id}/library` |

`GET /health` for probes. Full shape and scale discussion: [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

Env: `PORT` (8080), `JWT_SECRET`, `DATABASE_URL` (`sqlite:inkwell.db` or `postgres://...`).
