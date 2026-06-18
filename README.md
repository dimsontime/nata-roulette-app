# roulette-app

Vue PWA for the prize roulette. It can also be wrapped as an Android app with Capacitor.

## Commands

```bash
npm install
npm run dev
```

The dev server proxies `/api` to `http://localhost:3000`.

For a production API URL, create `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Android APK path

```bash
npm run android:add
npm run android:open
```

Then build the APK from Android Studio. After the Android project exists, use:

```bash
npm run android:sync
```

## Weight logic

The current draw weight is the live `stock` value of each prize. When stock changes, the chance is recalculated automatically from the current table.
