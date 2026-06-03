import { expect } from '@wdio/globals';

describe('Tauri App', () => {
    it('should launch the app', async () => {
        const title = await browser.getTitle();
        console.log('Page title:', title);
        expect(title).toBeDefined();
    });
});
