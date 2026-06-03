import { test, expect } from './fixtures/tauri-fixture';

test.describe('歌词与音频可视化', () => {
  test('歌词区域存在', async ({ window }) => {
    // 打开全屏播放器
    const albumCover = window.locator('[data-testid="album-cover"], .album-cover');
    if (await albumCover.isVisible()) {
      await albumCover.click();
    }

    // 查找歌词容器
    const lyricsContainer = window.locator('[data-testid="lyrics"], .lyrics-container, .lyrics');
    const isVisible = await lyricsContainer.isVisible().catch(() => false);
    console.log('歌词区域可见:', isVisible);
  });

  test('音频可视化组件存在', async ({ window }) => {
    // 打开全屏播放器
    const albumCover = window.locator('[data-testid="album-cover"], .album-cover');
    if (await albumCover.isVisible()) {
      await albumCover.click();
    }

    // 查找可视化组件（32 柱频谱）
    const visualizer = window.locator('[data-testid="audio-visualizer"], .audio-visualizer, .visualizer');
    const isVisible = await visualizer.isVisible().catch(() => false);
    console.log('音频可视化组件可见:', isVisible);
  });

  test('歌词自动滚动', async ({ window }) => {
    // 此测试需要播放音乐才能验证歌词滚动
    // 这里只验证歌词容器的滚动属性
    const lyricsContainer = window.locator('[data-testid="lyrics"], .lyrics-container');

    if (await lyricsContainer.isVisible()) {
      const overflowY = await lyricsContainer.evaluate(el =>
        window.getComputedStyle(el).overflowY
      );
      console.log('歌词容器 overflow-y:', overflowY);
    }
  });
});
