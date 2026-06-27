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

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug2-start.png' });

    const url = page.url();
    console.log('URL:', url);

    // Check if login page
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      console.log('LOGIN PAGE - trying demo credentials');
      // In demo mode, any password works
      await emailField.fill('demo@nodewarden.app');
      const pwField = await page.$('input[type="password"]');
      if (pwField) await pwField.fill('anypassword');
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) await loginBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug2-after-login.png' });
      
      const emailField2 = await page.$('input[type="email"]');
      if (emailField2) {
        console.log('STILL ON LOGIN PAGE');
        // Check error
        const err = await page.$('[class*="error"], [class*="alert"]');
        if (err) console.log('Error:', await err.textContent());
      } else {
        console.log('LOGIN SUCCEEDED');
      }
    } else {
      console.log('NOT on login page - might already be in vault');
    }

    console.log('Final URL:', page.url());
    
    // Dump page text
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('\n=== PAGE TEXT ===');
    console.log(bodyText);

    // Check for add button
    const addBtn = await page.$('.mobile-fab-trigger');
    console.log('\nAdd button found:', addBtn !== null);
    
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug2-menu.png' });
      
      const menuItems = await page.$$('.create-menu-item');
      console.log('Menu items:', menuItems.length);
      for (const item of menuItems) {
        console.log('  Item:', (await item.textContent()).trim());
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
