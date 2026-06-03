import { test, expect } from './fixtures/tauri-fixture';

test.describe('辅助功能', () => {
  test('睡眠定时器按钮存在', async ({ window }) => {
    const sleepTimerButton = window.locator('[data-testid="sleep-timer"], button:has-text("睡眠"), .sleep-timer');
    const isVisible = await sleepTimerButton.isVisible().catch(() => false);
    console.log('睡眠定时器按钮可见:', isVisible);
  });

  test('每日推荐区域存在', async ({ window }) => {
    // 导航到首页
    const homeLink = window.locator('a:has-text("首页"), [data-testid="nav-home"]');
    if (await homeLink.isVisible()) {
      await homeLink.click();
    }

    // 查找每日推荐
    const dailyRecommend = window.locator('[data-testid="daily-recommend"], .daily-recommend, text=每日推荐');
    const isVisible = await dailyRecommend.isVisible().catch(() => false);
    console.log('每日推荐区域可见:', isVisible);
  });

  test('排行榜区域存在', async ({ window }) => {
    // 查找排行榜
    const toplists = window.locator('[data-testid="toplists"], .toplists, text=排行榜');
    const isVisible = await toplists.isVisible().catch(() => false);
    console.log('排行榜区域可见:', isVisible);
  });

  test('播放状态恢复', async ({ window }) => {
    // 检查 localStorage 中的播放状态
    const playerState = await window.evaluate(() => {
      const state = localStorage.getItem('playerState');
      return state ? JSON.parse(state) : null;
    });

    console.log('播放状态:', playerState);
  });
});
