import { test as base, Page, BrowserContext } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TAURI_EXE = join(__dirname, '../../../src-tauri/target/release/ai-student-hub.exe');

interface TauriFixtures {
  appProcess: ChildProcess;
  window: Page;
  context: BrowserContext;
}

export const test = base.extend<TauriFixtures>({
  appProcess: async ({}, use) => {
    const appProcess = spawn(TAURI_EXE, [], {
      env: {
        ...process.env,
        TAURI_DEBUG: 'true',
        WEBVIEW2_DEVTOOLS: '1',
        WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9222',
      },
      stdio: 'pipe',
    });

    // 等待应用启动并暴露调试端口
    await new Promise(resolve => setTimeout(resolve, 5000));

    await use(appProcess);

    // 关闭应用
    appProcess.kill();
  },

  context: async ({ playwright, appProcess }, use) => {
    // 连接到 Tauri 应用的 WebView 调试端口
    // Tauri 默认在 port 9222 暴露 WebView 调试
    // appProcess 依赖确保应用已启动后再连接
    const browser = await playwright.chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    const context = contexts[0] || await browser.newContext();
    await use(context);
  },

  window: async ({ context }, use) => {
    const pages = context.pages();
    const window = pages[0] || await context.newPage();
    await window.waitForLoadState('domcontentloaded');
    await use(window);
  },
});

export { expect } from '@playwright/test';
