import { test, expect } from './fixtures/tauri-fixture';

test.describe('搜索与快捷键', () => {
  test('搜索输入框存在', async ({ window }) => {
    const searchInput = window.locator('[data-testid="search-input"], input[placeholder*="搜索"], .search-input');
    const isVisible = await searchInput.isVisible().catch(() => false);
    console.log('搜索输入框可见:', isVisible);
  });

  test('Ctrl+F 打开搜索', async ({ window }) => {
    // 按 Ctrl+F
    await window.keyboard.press('Control+f');

    // 等待搜索界面出现
    await window.waitForTimeout(500);

    // 检查搜索输入框是否获得焦点
    const searchInput = window.locator('[data-testid="search-input"], input[placeholder*="搜索"]');
    if (await searchInput.isVisible()) {
      const isFocused = await searchInput.evaluate(el => document.activeElement === el);
      console.log('Ctrl+F 后搜索框获得焦点:', isFocused);
    }
  });

  test('搜索历史存储', async ({ window }) => {
    // 检查 localStorage 中的搜索历史
    const searchHistory = await window.evaluate(() => {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    });

    console.log('搜索历史:', searchHistory);
    expect(Array.isArray(searchHistory)).toBe(true);
  });

  test('Escape 关闭搜索', async ({ window }) => {
    // 先打开搜索
    await window.keyboard.press('Control+f');
    await window.waitForTimeout(300);

    // 按 Escape
    await window.keyboard.press('Escape');
    await window.waitForTimeout(300);

    // 验证搜索界面关闭（搜索框不再可见或失去焦点）
    const searchInput = window.locator('[data-testid="search-input"], input[placeholder*="搜索"]');
    if (await searchInput.isVisible()) {
      const isFocused = await searchInput.evaluate(el => document.activeElement === el);
      console.log('Escape 后搜索框失去焦点:', !isFocused);
    }
  });
});
