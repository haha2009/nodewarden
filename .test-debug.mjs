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

    // Check if login page
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      console.log('LOGIN PAGE DETECTED');
      await emailField.fill('test@test.com');
      const pwField = await page.$('input[type="password"]');
      if (pwField) await pwField.fill('test123456');
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) await loginBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug-after-login.png' });
      
      // Check what page we're on now
      const url = page.url();
      console.log('URL after login:', url);
      
      const emailField2 = await page.$('input[type="email"]');
      if (emailField2) {
        console.log('STILL ON LOGIN PAGE - login failed');
        // Try looking for error message
        const errorMsg = await page.$('.error, .alert, [class*="error"], [class*="alert"]');
        if (errorMsg) {
          const text = await errorMsg.textContent();
          console.log('Error message:', text);
        }
        // Check for skip button
        const skipBtn = await page.$('text=Skip, text=skip');
        if (skipBtn) {
          console.log('Found Skip button');
          await skipBtn.click();
          await page.waitForTimeout(2000);
        }
      } else {
        console.log('LOGIN SUCCEEDED - navigated away from login');
      }
    }

    await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug-state1.png' });
    console.log('Current URL:', page.url());

    // Now try to find the add button
    const addBtn = await page.$('.mobile-fab-trigger');
    console.log('Add button found:', addBtn !== null);
    
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug-create-menu.png' });
      
      // Get all text in the create menu
      const menuItems = await page.$$('.create-menu-item');
      console.log('Menu items found:', menuItems.length);
      for (const item of menuItems) {
        const text = await item.textContent();
        console.log('  Menu item:', text.trim());
      }
      
      // Click Login
      for (const item of menuItems) {
        const text = await item.textContent();
        if (text && text.toLowerCase().includes('login')) {
          await item.click();
          break;
        }
      }
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-debug-editor.png' });
      
      // Dump all visible text
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
      console.log('\n=== PAGE TEXT (first 3000 chars) ===');
      console.log(bodyText);
      
      // Check all labels
      const labels = await page.$$('.field span, label span');
      console.log('\n=== LABELS ===');
      for (const label of labels) {
        const text = await label.textContent();
        if (text.trim()) console.log('  Label:', text.trim());
      }
      
      // Check all inputs
      const inputs = await page.$$('.field input');
      console.log('\n=== INPUTS ===');
      for (let i = 0; i < inputs.length; i++) {
        const placeholder = await inputs[i].getAttribute('placeholder');
        const val = await inputs[i].inputValue();
        const type = await inputs[i].getAttribute('type');
        console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}", value="${val}"`);
      }
      
      // Check all buttons
      const buttons = await page.$$('button');
      console.log('\n=== BUTTONS ===');
      for (const btn of buttons) {
        const text = (await btn.textContent()).trim();
        if (text) console.log('  Button:', text);
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
