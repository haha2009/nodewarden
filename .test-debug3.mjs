import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5174/#/vault';
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
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Login page is shown - fill demo credentials
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      await emailField.fill('demo@nodewarden.app');
      const pwField = await page.$('input[type="password"]');
      if (pwField) await pwField.fill('demo');
      
      // Click the login submit button
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) {
        console.log('Clicking login button...');
        await loginBtn.click();
        await page.waitForTimeout(5000);
      }
      
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug3-after-login.png' });
      console.log('URL after login:', page.url());
      
      // Check if we're still on login
      const stillLogin = await page.$('input[type="email"]');
      if (stillLogin) {
        console.log('STILL ON LOGIN');
        // Look for error messages
        const allText = await page.evaluate(() => document.body.innerText);
        console.log('Page text:', allText.substring(0, 500));
      } else {
        console.log('LOGIN SUCCESS!');
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
        console.log('Page text:', bodyText);
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
