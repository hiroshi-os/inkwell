# Inkwell

Inkwell is a serialized fiction platform where authors publish stories chapter by chapter. Readers can browse stories, follow authors, and keep a library. I built a Go API shared by a Next.js web client and a Kotlin Android app.

The API uses SQLite by default and supports PostgreSQL through Docker Compose. The web app supports reading and authoring; the Android app supports browsing, reading, authentication, and the library. [System design](SYSTEM_DESIGN.md) explains the current implementation and how I would approach scaling it.

## Running locally

The API requires Go 1.22 or later. The web app requires Node 20 or later.

```bash
cd api
go run ./cmd/server
```

In another terminal:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000. The API runs at http://localhost:8080. On an empty database, the server creates the demo accounts `iris`, `niko`, and `reader`, each with the password `password123`.

To run the API, PostgreSQL, and web app with Docker:

```bash
docker compose up --build
```

The browser connects to the API on port 8080. Set `JWT_SECRET` before deploying. The API also accepts `PORT` and `DATABASE_URL`; the default database is `sqlite:inkwell.db`.

### Android

The Android build requires Android SDK 34 and JDK 17.

```bash
cd android
./gradlew :app:assembleDebug
```

The emulator uses `http://10.0.2.2:8080/` to reach the host API. For a physical device, set `BuildConfig.API_BASE_URL` in `android/app/build.gradle.kts` to the host's LAN address. The demo permits cleartext HTTP.

## Current scope

Authors can create and edit stories and chapters on the web. Readers can search the catalog, read chapters, follow authors, and save stories. The following feed is a chronological SQL query and search uses substring matching. The library stores saved stories on the server; it does not download them for offline reading.

Authentication uses JWTs stored in browser localStorage and Android SharedPreferences. This is suitable for the demo, but I would harden session management before a production deployment. Comments, notifications, uploads, and payments are not implemented.

The repository contains the Go service in `api/`, the web client in `web/`, and the Android client in `android/`. The [UI quality notes](docs/ui-quality.md) describe the accessibility checks and their limits.
