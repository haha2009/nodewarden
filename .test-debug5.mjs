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

    // Click "创建账户" (Create Account)
    const createAcct = await page.$('text=创建账户');
    if (createAcct) {
      await createAcct.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug5-register.png' });
      
      // Get all inputs
      const inputs = await page.$$('input');
      console.log('Inputs:', inputs.length);
      for (let i = 0; i < inputs.length; i++) {
        const type = await inputs[i].getAttribute('type');
        const ph = await inputs[i].getAttribute('placeholder');
        console.log(`  ${i}: type="${type}" placeholder="${ph}"`);
      }
      
      // Fill form
      if (inputs.length >= 3) {
        await inputs[0].fill('test@test.com');
        await inputs[1].fill('test123456');
        await inputs[2].fill('test123456');
        if (inputs.length >= 4) await inputs[3].fill('test');
        
        await page.waitForTimeout(500);
        
        // Find register/submit button
        const btns = await page.$$('button');
        for (const btn of btns) {
          const text = (await btn.textContent()).trim();
          console.log('Button:', text);
          if (text === '创建账户' || text === 'Create Account') {
            await btn.click();
            break;
          }
        }
        
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug5-after.png' });
        console.log('URL:', page.url());
        
        const emailField = await page.$('input[type="email"]');
        if (!emailField) {
          console.log('SUCCESS - in vault!');
          // Now dump the vault page
          const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
          console.log('Vault text:', bodyText);
          
          // Check for add button
          const addBtn = await page.$('.mobile-fab-trigger');
          console.log('Add button:', addBtn !== null);
        } else {
          console.log('FAILED - still on login');
          const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
          console.log('Page:', text);
        }
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
