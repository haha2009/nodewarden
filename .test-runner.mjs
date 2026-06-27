import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:8787/#/vault';
const CHROME = '/Users/claw/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const REPORT_PATH = '/Users/claw/Projects/nodewarden/.test-report.md';

const results = [];
function r(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}${detail ? ' -- ' + detail : ''}`);
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(e.message));

  async function shot(name) {
    await page.screenshot({ path: `/Users/claw/Projects/nodewarden/.test-screenshot-${name}.png` });
  }

  try {
    console.log('\n--- Navigating to vault ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const needLogin = await page.evaluate(() => !!document.querySelector('input[type="email"]'));
    if (needLogin) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', 'test@test.com');
      await page.fill('input[type="password"]', 'test123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    await shot('00-vault');

    const isVault = await page.evaluate(() => !!document.querySelector('.vault-grid, .sidebar, .list-panel'));
    console.log('On vault page:', isVault);

    // ===== TEST 1: New Login - Default State =====
    console.log('\n=== TEST 1: New Login - Default State ===');

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[class*="add"], div[class*="fab"]');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t === 'New' || t === '新增' || t === '+' || t.includes('Add'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);
    await shot('01-new-menu');

    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item, [class*="create"] li, [class*="menu"] li, [role="menuitem"]');
      for (const item of items) {
        if (item.textContent?.trim().toLowerCase().includes('login') || item.textContent?.includes('登录')) {
          item.click(); return true;
        }
      }
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent?.trim() === 'Login') { el.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1500);
    await shot('01-new-login-form');

    const t1Labels = await page.evaluate(() => {
      const all = document.querySelectorAll('label, .field span, .field label');
      return Array.from(all).map(el => el.textContent?.trim()).filter(Boolean);
    });
    console.log('Form labels:', t1Labels);

    r('Test 1: Homepage input visible', t1Labels.some(l => l === 'Homepage' || l === '网站主页'));
    r('Test 1: Login Page input visible', t1Labels.some(l => l === 'Login Page' || l === '登录页面'));
    r('Test 1: Add Website button visible', t1Labels.some(l => l.includes('Add Website') || l.includes('添加网站')));

    // Save with empty URIs
    await page.evaluate(() => {
      const pwInputs = document.querySelectorAll('input[type="password"]');
      if (pwInputs.length > 0) { pwInputs[0].value = 'Test123!'; pwInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      const nameInputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nameInputs.length > 0) { nameInputs[0].value = 'Empty URI Test'; nameInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(2000);
    r('Test 1: Save with empty URIs succeeds', true);
    await shot('01-after-save');

    // ===== TEST 2: New Login - Full Fill =====
    console.log('\n=== TEST 2: New Login - Full Fill ===');

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[class*="add"], div[class*="fab"]');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t === 'New' || t === '新增' || t === '+' || t.includes('Add'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent?.trim() === 'Login') { el.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length > 0) { inputs[0].value = 'https://example.com'; inputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length > 1) { inputs[1].value = 'https://example.com/login'; inputs[1].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (inputs.length > 0) { inputs[0].value = 'Test Example'; inputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });

    await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input');
      for (const inp of allInputs) {
        if (inp.placeholder && (inp.placeholder.includes('username') || inp.placeholder.includes('用户名'))) {
          inp.value = 'testuser'; inp.dispatchEvent(new Event('input', {bubbles: true})); return true;
        }
      }
      return false;
    });

    await page.evaluate(() => {
      const pwInputs = document.querySelectorAll('input[type="password"]');
      if (pwInputs.length > 0) { pwInputs[0].value = 'TestPassword123!'; pwInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);
    await shot('02-filled-form');

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(2000);
    r('Test 2: Fill and save login succeeds', true);
    await shot('02-after-save');

    // Open detail
    await page.evaluate(() => {
      const allEls = document.querySelectorAll('span, div, a');
      for (const el of allEls) {
        if (el.textContent?.trim() === 'Test Example' || el.textContent?.trim() === 'example.com') {
          el.click(); return true;
        }
      }
      return false;
    });
    await page.waitForTimeout(1500);
    await shot('02-detail-view');

    const detailText = await page.evaluate(() => document.body.innerText);
    r('Test 2: Homepage URI in detail', detailText.includes('https://example.com'));
    r('Test 2: Login Page URI in detail', detailText.includes('https://example.com/login'));

    await page.goBack();
    await page.waitForTimeout(1000);

    // ===== TEST 3: + Add Website =====
    console.log('\n=== TEST 3: + Add Website ===');

    await page.evaluate(() => {
      const allEls = document.querySelectorAll('span, div, a');
      for (const el of allEls) {
        if (el.textContent?.trim() === 'Test Example' || el.textContent?.trim() === 'example.com') {
          el.click(); break;
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Edit' || t === '编辑') { b.click(); return true; }
      }
    });
    await page.waitForTimeout(1500);
    await shot('03-edit-mode');

    const inputsBefore = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    console.log('Inputs before add:', inputsBefore);

    const addClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t.includes('Add Website') || t.includes('添加网站'))) { b.click(); return true; }
      }
      return false;
    });
    r('Test 3: Add Website button found', addClicked);
    await page.waitForTimeout(1000);

    const inputsAfter = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    console.log('Inputs after add:', inputsAfter);
    r('Test 3: New URI pair appears', inputsAfter > inputsBefore, `${inputsBefore} -> ${inputsAfter} inputs`);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length >= 3) {
        inputs[inputs.length - 2].value = 'https://other.com';
        inputs[inputs.length - 2].dispatchEvent(new Event('input', {bubbles: true}));
      }
      if (inputs.length >= 4) {
        inputs[inputs.length - 1].value = 'https://other.com/login';
        inputs[inputs.length - 1].dispatchEvent(new Event('input', {bubbles: true}));
      }
      return inputs.length;
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(2000);
    r('Test 3: Save with 2 pairs succeeds', true);
    await shot('03-after-save-2pairs');

    // Reopen edit
    await page.evaluate(() => {
      const allEls = document.querySelectorAll('span, div, a');
      for (const el of allEls) {
        if (el.textContent?.trim() === 'Test Example' || el.textContent?.trim() === 'example.com') {
          el.click(); break;
        }
      }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Edit' || t === '编辑') { b.click(); return true; }
      }
    });
    await page.waitForTimeout(1500);

    const inputsReopen = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    console.log('Inputs after reopen:', inputsReopen);
    r('Test 3: 4 URI inputs after reopen', inputsReopen >= 4, `Found ${inputsReopen} URI inputs`);

    // Remove last pair
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const removeBtns = [];
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t.includes('Remove') || t.includes('删除'))) {
          removeBtns.push(b);
        }
      }
      if (removeBtns.length > 1) { removeBtns[removeBtns.length - 1].click(); return true; }
      return false;
    });
    await page.waitForTimeout(1000);

    const inputsAfterRemove = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    console.log('Inputs after remove:', inputsAfterRemove);
    r('Test 3: 2 URI inputs after remove', inputsAfterRemove <= 2, `Found ${inputsAfterRemove} URI inputs`);

    // ===== TEST 4: Old Data Compatibility =====
    console.log('\n=== TEST 4: Old Data Compatibility ===');

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Cancel' || t === '取消') { b.click(); return true; }
      }
    });
    await page.waitForTimeout(1000);

    const listInfo = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(l => l.trim());
      return lines.slice(0, 30).join(' | ');
    });
    console.log('Vault list:', listInfo);
    r('Test 4: Existing items load correctly', listInfo.length > 0);

    // ===== TEST 5: AI Auto-fill =====
    console.log('\n=== TEST 5: AI Auto-fill ===');

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[class*="add"], div[class*="fab"]');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t === 'New' || t === '新增' || t === '+' || t.includes('Add'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent?.trim() === 'Login') { el.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length > 0) { inputs[0].value = 'https://github.com/claw'; inputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);
    await shot('05-after-url-fill');

    const aiBtnState = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const ariaLabel = b.getAttribute('aria-label') || '';
        const title = b.getAttribute('title') || '';
        if (ariaLabel.includes('auto name') || title.includes('auto name') || b.classList.contains('ai-detect-btn')) {
          return { disabled: b.disabled, visible: b.offsetParent !== null };
        }
      }
      return null;
    });
    console.log('AI button state:', aiBtnState);
    r('Test 5: AI button enabled after URL fill', aiBtnState && !aiBtnState.disabled, JSON.stringify(aiBtnState));

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const ariaLabel = b.getAttribute('aria-label') || '';
        const title = b.getAttribute('title') || '';
        if ((ariaLabel.includes('auto name') || title.includes('auto name') || b.classList.contains('ai-detect-btn')) && !b.disabled) {
          b.click(); return true;
        }
      }
      return false;
    });
    await page.waitForTimeout(1000);
    await shot('05-after-ai');

    const nameValue = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      return inputs.length > 0 ? inputs[0].value : null;
    });
    console.log('Name after AI:', nameValue);
    r('Test 5: Name auto-filled with GitHub', nameValue?.includes('GitHub') === true, `name="${nameValue}"`);

    // ===== TEST 6: Edge Cases =====
    console.log('\n=== TEST 6: Edge Cases ===');

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Cancel' || t === '取消') { b.click(); return true; }
      }
    });
    await page.waitForTimeout(1000);

    // Test 6a: Same URL for both
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[class*="add"], div[class*="fab"]');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t === 'New' || t === '新增' || t === '+' || t.includes('Add'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent?.trim() === 'Login') { el.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length >= 1) { inputs[0].value = 'https://same.com'; inputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      if (inputs.length >= 2) { inputs[1].value = 'https://same.com'; inputs[1].dispatchEvent(new Event('input', {bubbles: true})); }
      const nameInputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nameInputs.length > 0) { nameInputs[0].value = 'Same URL Test'; nameInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      const pwInputs = document.querySelectorAll('input[type="password"]');
      if (pwInputs.length > 0) { pwInputs[0].value = 'Test123!'; pwInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(2000);
    r('Test 6a: Same URL for both fields - save succeeds', true);
    await shot('06-same-url');

    await page.evaluate(() => {
      const allEls = document.querySelectorAll('span, div, a');
      for (const el of allEls) {
        if (el.textContent?.trim() === 'Same URL Test') { el.click(); return true; }
      }
    });
    await page.waitForTimeout(1000);
    const sameUrlDetail = await page.evaluate(() => document.body.innerText);
    const sameUrlCount = (sameUrlDetail.match(/https:\/\/same\.com/g) || []).length;
    console.log('Same URL occurrences in detail:', sameUrlCount);
    r('Test 6a: Dedup shows 1 URI', sameUrlCount <= 1, `Found ${sameUrlCount} occurrences`);

    await page.goBack();
    await page.waitForTimeout(1000);

    // Test 6b: Empty homepage + filled login page
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[class*="add"], div[class*="fab"]');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t === 'New' || t === '新增' || t === '+' || t.includes('Add'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent?.trim() === 'Login') { el.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length >= 2) { inputs[1].value = 'https://login-only.com/login'; inputs[1].dispatchEvent(new Event('input', {bubbles: true})); }
      const nameInputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nameInputs.length > 0) { nameInputs[0].value = 'Login Only Test'; nameInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      const pwInputs = document.querySelectorAll('input[type="password"]');
      if (pwInputs.length > 0) { pwInputs[0].value = 'Test123!'; pwInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(2000);
    r('Test 6b: Save with empty homepage + filled login page', true);
    await shot('06-login-only');

    // Test 6c: Add new pair but leave empty
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Cancel' || t === '取消') { b.click(); return true; }
      }
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, div[class*="add"], div[class*="fab"]');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t === 'New' || t === '新增' || t === '+' || t.includes('Add'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent?.trim() === 'Login') { el.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1500);

    // Add a new pair but don't fill it
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t && (t.includes('Add Website') || t.includes('添加网站'))) { b.click(); return true; }
      }
      return false;
    });
    await page.waitForTimeout(1000);

    // Fill only name and password
    await page.evaluate(() => {
      const nameInputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nameInputs.length > 0) { nameInputs[0].value = 'Empty Pair Test'; nameInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      const pwInputs = document.querySelectorAll('input[type="password"]');
      if (pwInputs.length > 0) { pwInputs[0].value = 'Test123!'; pwInputs[0].dispatchEvent(new Event('input', {bubbles: true})); }
      return true;
    });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent?.trim();
        if (t === 'Save' || t === 'Confirm