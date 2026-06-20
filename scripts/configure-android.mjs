import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const androidDir = join(process.cwd(), 'android');
const manifestPath = join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const mainActivityPath = join(
  androidDir,
  'app',
  'src',
  'main',
  'java',
  'com',
  'beerroulette',
  'app',
  'MainActivity.java'
);

function writeIfChanged(path, next) {
  const previous = readFileSync(path, 'utf8');

  if (previous !== next) {
    writeFileSync(path, next);
    console.log(`Updated ${path}`);
  }
}

function configureManifest() {
  if (!existsSync(manifestPath)) {
    console.log('AndroidManifest.xml not found yet, skipping manifest patch.');
    return;
  }

  let source = readFileSync(manifestPath, 'utf8');
  const applicationPattern = /<application\b[^>]*>/;
  const applicationMatch = source.match(applicationPattern);

  if (applicationMatch && !applicationMatch[0].includes('android:usesCleartextTraffic=')) {
    const applicationTag = applicationMatch[0].replace(
      '<application',
      '<application\n        android:usesCleartextTraffic="true"'
    );

    source = source.replace(applicationMatch[0], applicationTag);
  }

  const activityPattern = /<activity\b[^>]*android:name="\.MainActivity"[^>]*>/;
  const match = source.match(activityPattern);

  if (!match) {
    console.log('MainActivity entry not found in AndroidManifest.xml, skipping manifest patch.');
    return;
  }

  let activityTag = match[0];

  if (!activityTag.includes('android:screenOrientation=')) {
    activityTag = activityTag.replace(
      '<activity',
      '<activity\n            android:screenOrientation="landscape"'
    );
  }

  const next = source.replace(match[0], activityTag);
  writeIfChanged(manifestPath, next);
}

function configureMainActivity() {
  if (!existsSync(mainActivityPath)) {
    console.log('MainActivity.java not found yet, skipping immersive patch.');
    return;
  }

  const next = `package com.beerroulette.app;

import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);

        if (hasFocus) {
            enterImmersiveMode();
        }
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }
}
`;

  writeIfChanged(mainActivityPath, next);
}

if (!existsSync(androidDir)) {
  console.log('Android project not found. Run `npm run android:add` first.');
  process.exit(0);
}

configureManifest();
configureMainActivity();
