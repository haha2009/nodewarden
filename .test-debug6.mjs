import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8787/#/vault';
const CHROMIUM_PATH = '/Users/claw/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text());
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      console.log('LOGIN PAGE');
      await emailField.fill('200981193@qq.com');
      const pwField = await page.$('input[type="password"]');
      if (pwField) await pwField.fill('test123456');
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) await loginBtn.click();
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug6-after-login.png' });
      console.log('URL:', page.url());
      
      const stillLogin = await page.$('input[type="email"]');
      if (!stillLogin) {
        console.log('LOGIN SUCCESS!');
        const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
        console.log('Page text:', text);
        
        // Check for add button
        const addBtn = await page.$('.mobile-fab-trigger');
        console.log('Add button found:', addBtn !== null);
      } else {
        console.log('LOGIN FAILED');
        const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log('Page text:', text);
      }
    } else {
      console.log('NOT on login page (already logged in?)');
      console.log('URL:', page.url());
      const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
      console.log('Page text:', text);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
