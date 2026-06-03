import { test, expect } from './fixtures/tauri-fixture';

test.describe('QR 登录功能', () => {
  test('打开登录模态框', async ({ window }) => {
    // 查找并点击登录按钮
    const loginButton = window.locator('button:has-text("登录"), [data-testid="login-button"]');
    await loginButton.click();

    // 验证登录模态框显示
    const modal = window.locator('[data-testid="login-modal"], .login-modal');
    await expect(modal).toBeVisible();
  });

  test('显示 QR 码', async ({ window }) => {
    // 触发登录
    const loginButton = window.locator('button:has-text("登录"), [data-testid="login-button"]');
    await loginButton.click();

    // 等待 QR 码加载
    const qrCode = window.locator('img[src*="qrcode"], [data-testid="qr-code"], canvas');
    await expect(qrCode).toBeVisible({ timeout: 10000 });

    // 截图保存 QR 码
    await qrCode.screenshot({ path: 'reports/qr-code.png' });
  });

  test('登录状态持久化', async ({ window }) => {
    // 此测试需要手动扫码，先验证登录状态检测
    // 实际测试中需要等待用户扫码

    // 检查是否有登录状态指示器
    const userAvatar = window.locator('[data-testid="user-avatar"], .user-avatar');
    const isLoggedIn = await userAvatar.isVisible().catch(() => false);

    console.log('当前登录状态:', isLoggedIn ? '已登录' : '未登录');
  });
});
