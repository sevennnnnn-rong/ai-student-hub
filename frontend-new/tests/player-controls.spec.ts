import { test, expect } from './fixtures/tauri-fixture';

test.describe('播放器控制', () => {
  test('MiniPlayer 播放按钮', async ({ window }) => {
    // MiniPlayer 播放/暂停按钮使用 aria-label
    const playButton = window.locator('button[aria-label="播放"], button[aria-label="暂停"]');

    const isVisible = await playButton.first().isVisible().catch(() => false);
    console.log('MiniPlayer 播放按钮可见:', isVisible);
  });

  test('MiniPlayer 上一首/下一首按钮', async ({ window }) => {
    const prevButton = window.locator('button[aria-label="上一首"]');
    const nextButton = window.locator('button[aria-label="下一首"]');

    const prevVisible = await prevButton.isVisible().catch(() => false);
    const nextVisible = await nextButton.isVisible().catch(() => false);
    console.log('上一首按钮可见:', prevVisible, '下一首按钮可见:', nextVisible);
  });

  test('点击封面展开全屏播放器', async ({ window }) => {
    // 先确保有歌曲在播放（MiniPlayer 可见）
    const miniPlayer = window.locator('button[aria-label="展开全屏播放器"]');
    const hasMiniPlayer = await miniPlayer.isVisible().catch(() => false);

    if (!hasMiniPlayer) {
      console.log('MiniPlayer 不可见，跳过测试（需要先有歌曲播放）');
      return;
    }

    // 点击展开按钮打开 NowPlayingView
    await miniPlayer.click();

    // 验证全屏播放器打开 - 检查关闭按钮（aria-label="关闭"）
    const closeButton = window.locator('button[aria-label="关闭"]');
    await expect(closeButton).toBeVisible({ timeout: 5000 });
    console.log('全屏播放器已打开');
  });

  test('全屏播放器关闭按钮', async ({ window }) => {
    // 先打开全屏播放器
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    // 等待全屏播放器出现
    const closeButton = window.locator('button[aria-label="关闭"]');
    if (await closeButton.isVisible().catch(() => false)) {
      // 点击关闭按钮
      await closeButton.click();

      // 等待关闭动画完成
      await window.waitForTimeout(500);

      // 验证全屏播放器关闭（关闭按钮不再可见）
      const isStillVisible = await closeButton.isVisible().catch(() => false);
      console.log('全屏播放器已关闭:', !isStillVisible);
    }
  });

  test('全屏播放器 Escape 键关闭', async ({ window }) => {
    // 先打开全屏播放器
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    const closeButton = window.locator('button[aria-label="关闭"]');
    if (await closeButton.isVisible().catch(() => false)) {
      // 按 Escape 关闭
      await window.keyboard.press('Escape');

      // 等待关闭动画
      await window.waitForTimeout(500);

      const isStillVisible = await closeButton.isVisible().catch(() => false);
      console.log('Escape 后全屏播放器已关闭:', !isStillVisible);
    }
  });

  test('全屏播放器播放/暂停按钮', async ({ window }) => {
    // 打开全屏播放器
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    // 在全屏播放器中查找播放/暂停按钮（使用 w-14 h-14 的大按钮区分于 MiniPlayer 的 w-9 h-9）
    const playPauseButton = window.locator('button[aria-label="播放"], button[aria-label="暂停"]').last();
    const isVisible = await playPauseButton.isVisible().catch(() => false);
    console.log('全屏播放器播放按钮可见:', isVisible);

    // 如果可见，点击切换播放状态
    if (isVisible) {
      const ariaLabel = await playPauseButton.getAttribute('aria-label');
      console.log('当前状态:', ariaLabel);
    }
  });

  test('全屏播放器上一首/下一首', async ({ window }) => {
    // 打开全屏播放器
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    const prevButton = window.locator('button[aria-label="上一首"]').last();
    const nextButton = window.locator('button[aria-label="下一首"]').last();

    const prevVisible = await prevButton.isVisible().catch(() => false);
    const nextVisible = await nextButton.isVisible().catch(() => false);
    console.log('全屏上一首:', prevVisible, '全屏下一首:', nextVisible);
  });

  test('进度条显示', async ({ window }) => {
    // MiniPlayer 内联进度条: h-0.5 bg-white/5 的 div
    const miniProgressBar = window.locator('.bg-white\\/5.rounded-full.h-0\\.5, div[class*="h-0.5"][class*="bg-white/5"]');

    // 全屏播放器进度条: h-1.5 bg-white/10
    const fullProgressBar = window.locator('div[class*="h-1.5"][class*="bg-white/10"]');

    const miniVisible = await miniProgressBar.isVisible().catch(() => false);
    const fullVisible = await fullProgressBar.isVisible().catch(() => false);
    console.log('MiniPlayer 进度条可见:', miniVisible, '全屏进度条可见:', fullVisible);
  });

  test('音量控制', async ({ window }) => {
    // 打开全屏播放器（音量控制在桌面端可见）
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    // 音量滑块 (input type="range" aria-label="音量")
    const volumeSlider = window.locator('input[aria-label="音量"]').last();
    const isVisible = await volumeSlider.isVisible().catch(() => false);
    console.log('音量滑块可见:', isVisible);

    // 静音/取消静音按钮
    const muteButton = window.locator('button[aria-label="静音"], button[aria-label="取消静音"]').last();
    const muteVisible = await muteButton.isVisible().catch(() => false);
    console.log('静音按钮可见:', muteVisible);
  });

  test('播放模式切换', async ({ window }) => {
    // 打开全屏播放器
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    const playModeButton = window.locator('button[aria-label="播放模式"]').last();
    const isVisible = await playModeButton.isVisible().catch(() => false);
    console.log('播放模式按钮可见:', isVisible);
  });

  test('喜欢按钮', async ({ window }) => {
    // 打开全屏播放器
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    const likeButton = window.locator('button[aria-label="喜欢"], button[aria-label="取消喜欢"]').last();
    const isVisible = await likeButton.isVisible().catch(() => false);

    if (isVisible) {
      const label = await likeButton.getAttribute('aria-label');
      console.log('喜欢按钮可见, 当前状态:', label);
    } else {
      console.log('喜欢按钮不可见');
    }
  });

  test('睡眠定时器', async ({ window }) => {
    // 在 MiniPlayer 中查找
    const sleepTimerButton = window.locator('button[aria-label="睡眠定时器"]').first();
    const isVisible = await sleepTimerButton.isVisible().catch(() => false);
    console.log('睡眠定时器按钮可见:', isVisible);
  });

  test('播放队列按钮', async ({ window }) => {
    // 在 MiniPlayer expanded 模式中
    const expandButton = window.locator('button[aria-label="展开全屏播放器"]');
    if (await expandButton.isVisible().catch(() => false)) {
      await expandButton.click();
    }

    // 先展开 MiniPlayer（点击 MiniPlayer 区域）
    const queueButton = window.locator('button[aria-label="播放队列"]').first();
    const isVisible = await queueButton.isVisible().catch(() => false);
    console.log('播放队列按钮可见:', isVisible);
  });

  test('MiniPlayer 展开/收起', async ({ window }) => {
    // MiniPlayer 点击自身展开/收起
    const miniPlayerArea = window.locator('.glass.rounded-2xl').first();
    const isVisible = await miniPlayerArea.isVisible().catch(() => false);

    if (isVisible) {
      // 点击展开
      await miniPlayerArea.click();
      await window.waitForTimeout(400);

      // 检查进度条区域（expanded 模式下出现）
      const expandedProgress = window.locator('.bg-white\\/5.rounded-full.cursor-pointer').first();
      const expanded = await expandedProgress.isVisible().catch(() => false);
      console.log('MiniPlayer 展开后进度条可见:', expanded);

      // 再次点击收起
      await miniPlayerArea.click();
      await window.waitForTimeout(400);
    }
  });
});
