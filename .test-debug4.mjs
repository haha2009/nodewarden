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

    // We should be on login page
    const emailField = await page.$('input[type="email"]');
    if (!emailField) {
      console.log('Not on login page, URL:', page.url());
      return;
    }

    // Click "Create Account" link
    const createAccountLink = await page.$('text=Create Account, text=创建账户');
    if (createAccountLink) {
      console.log('Found Create Account link, clicking...');
      await createAccountLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug4-register.png' });
      
      // Dump page text
      const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
      console.log('Page text:', text);
      
      // Check for registration form fields
      const inputs = await page.$$('input');
      console.log('Inputs found:', inputs.length);
      for (let i = 0; i < inputs.length; i++) {
        const type = await inputs[i].getAttribute('type');
        const placeholder = await inputs[i].getAttribute('placeholder');
        console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}"`);
      }
      
      // Fill registration form
      // Typically: email, password, confirm password, hint
      const allInputs = await page.$$('input');
      if (allInputs.length >= 2) {
        // First input is likely email
        await allInputs[0].fill('test@test.com');
        // Second is password
        await allInputs[1].fill('test123456');
        // Third might be confirm password
        if (allInputs.length >= 3) {
          await allInputs[2].fill('test123456');
        }
        // Fourth might be hint
        if (allInputs.length >= 4) {
          await allInputs[3].fill('test hint');
        }
        
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug4-filled.png' });
        
        // Find and click register button
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = (await btn.textContent()).trim();
          console.log('  Button:', text);
          if (text.includes('Create') || text.includes('创建') || text.includes('Register')) {
            console.log('Clicking register button:', text);
            await btn.click();
            await page.waitForTimeout(5000);
            break;
          }
        }
        
        await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug4-after-register.png' });
        console.log('URL after register:', page.url());
        
        // Check if we're in the vault now
        const emailField3 = await page.$('input[type="email"]');
        if (!emailField3) {
          console.log('REGISTRATION SUCCESS - in vault!');
          const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
          console.log('Vault text:', bodyText);
        } else {
          console.log('Still on login/register page');
          const err = await page.evaluate(() => document.body.innerText.substring(0, 500));
          console.log('Page text:', err);
        }
      }
    } else {
      console.log('Create Account link not found');
      // Check all links/buttons
      const links = await page.$$('a, button, [role="button"]');
      for (const link of links) {
        const text = (await link.textContent()).trim();
        if (text) console.log('  Link/Button:', text);
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
