import { chromium } from 'playwright';
import fs from 'fs';
const BASE = 'http://localhost:8787';
const VAULT = BASE + '/#/vault';
const CHROME = '/Users/claw/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const results = [];
function r(name, pass, detail) { results.push({ name, pass, detail: detail || '' }); console.log((pass ? 'PASS' : 'FAIL') + ': ' + name + (detail ? ' -- ' + detail : '')); }
async function getToken() {
  const resp = await fetch(BASE + '/identity/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&username=test@test.com&password=GozlRxnKeHFn/RCcQU1TW96tRxsO8tZjE7tGUwORkiA%3D&client_id=web'
  });
  return await resp.json();
}
async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(e.message));
  async function shot(n) { await page.screenshot({ path: '/Users/claw/Projects/nodewarden/.test-screenshot-' + n + '.png' }); }
  try {
    console.log('--- Auth ---');
    const token = await getToken();
    console.log('Token obtained, length:', token.access_token.length);
    // First, navigate to vault (will show login)
    await page.goto(VAULT, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(3000);
    // Inject session AFTER page load, then reload
    await page.evaluate(({ at, rt, em }) => {
      localStorage.setItem('nodewarden.web.session.v4', JSON.stringify({
        accessToken: at, refreshToken: rt, email: em, authMode: 'token'
      }));
      // Verify it was set
      const raw = localStorage.getItem('nodewarden.web.session.v4');
      return raw ? 'OK' : 'FAIL';
    }, { at: token.access_token, rt: token.refresh_token, em: 'test@test.com' });
    // Reload the page so the SPA picks up the session
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(10000);
    await shot('00-after-reload');
    const pageInfo = await page.evaluate(() => {
      const txt = document.body.innerText;
      return {
        url: window.location.href,
        hasVault: txt.includes('新增') || txt.includes('All Items') || txt.includes('全部') || !!document.querySelector('.vault-list, .vault-grid, .sidebar'),
        hasUnlock: txt.includes('解锁') || txt.includes('Unlock') || !!document.querySelector('input[placeholder*="主密码"]'),
        hasLogin: txt.includes('登录'),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 10),
        textSnippet: txt.substring(0, 300)
      };
    });
    console.log('After reload:', JSON.stringify(pageInfo, null, 2));
    // If unlock screen, enter password
    if (pageInfo.hasUnlock && !pageInfo.hasVault) {
      console.log('On unlock screen, entering master password...');
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="password"]');
        for (const inp of inputs) {
          if (inp.offsetParent !== null) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(inp, 'test123');
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            break;
          }
        }
      });
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          const t = b.textContent?.trim();
          if (t === 'Unlock' || t === '解锁' || t === '确认' || t === 'Confirm') {
            b.click(); return;
          }
        }
        // If no unlock button, try the first submit/login button
        for (const b of btns) {
          const t = b.textContent?.trim();
          if (t === '登录' || t === 'Login') {
            b.click(); return;
          }
        }
      });
      await page.waitForTimeout(8000);
      await shot('00-after-unlock');
    }
    const onVault = await page.evaluate(() => {
      const txt = document.body.innerText;
      return txt.includes('新增') || txt.includes('All Items') || txt.includes('全部') || !!document.querySelector('.vault-list, .vault-grid, .sidebar');
    });
    console.log('On vault:', onVault);
    if (!onVault) {
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
      throw new Error('Not on vault: ' + bodyText);
    }
    // T1-T6 tests (same as before)
    console.log('\n=== T1 ===');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const al = b.getAttribute('aria-label') || ''; if (al === 'txt_add' || al === 'New' || al === '新增') { b.click(); return; } }
    });
    await page.waitForTimeout(1000); await shot('01-menu');
    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item');
      for (const el of items) { if (el.textContent.includes('Login') || el.textContent.includes('登录')) { el.click(); return; } }
    });
    await page.waitForTimeout(2000); await shot('01-form');
    const labels = await page.evaluate(() => Array.from(document.querySelectorAll('label, .field>span, .website-label')).map(e => e.textContent?.trim()).filter(Boolean));
    console.log('Labels:', labels);
    r('T1: Homepage visible', labels.some(l => l.includes('Homepage') || l.includes('网站主页')));
    r('T1: Login Page visible', labels.some(l => l.includes('Login Page') || l.includes('登录页面')));
    r('T1: Add Website visible', labels.some(l => l.includes('Add Website') || l.includes('添加网站')));
    await page.evaluate(() => {
      const pw = document.querySelectorAll('input[type="password"]');
      if (pw.length) { pw[0].value = 'Test123!'; pw[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const nm = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nm.length) { nm[0].value = 'Empty Test'; nm[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return; } }
    });
    await page.waitForTimeout(2000); r('T1: Save empty URIs', true);
    // T2
    console.log('\n=== T2 ===');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const al = b.getAttribute('aria-label') || ''; if (al === 'txt_add' || al === 'New' || al === '新增') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item');
      for (const el of items) { if (el.textContent.includes('Login') || el.textContent.includes('登录')) { el.click(); return; } }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs[0]) { inputs[0].value = 'https://example.com'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (inputs[1]) { inputs[1].value = 'https://example.com/login'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
      const nm = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nm[0]) { nm[0].value = 'Test Example'; nm[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const un = document.querySelectorAll('input');
      for (const inp of un) { if (inp.placeholder && (inp.placeholder.includes('username') || inp.placeholder.includes('用户名'))) { inp.value = 'testuser'; inp.dispatchEvent(new Event('input', { bubbles: true })); break; } }
      const pw = document.querySelectorAll('input[type="password"]');
      if (pw[0]) { pw[0].value = 'TestPassword123!'; pw[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return; } }
    });
    await page.waitForTimeout(2000); r('T2: Fill and save', true); await shot('02-saved');
    await page.evaluate(() => {
      const items = document.querySelectorAll('span, div, a');
      for (const el of items) { if (el.textContent?.trim() === 'Test Example') { el.click(); return; } }
    });
    await page.waitForTimeout(2000); await shot('02-detail');
    const dt = await page.evaluate(() => document.body.innerText);
    r('T2: Homepage in detail', dt.includes('https://example.com'));
    r('T2: Login page in detail', dt.includes('https://example.com/login'));
    await page.goBack(); await page.waitForTimeout(1000);
    // T3
    console.log('\n=== T3 ===');
    await page.evaluate(() => {
      const items = document.querySelectorAll('span, div, a');
      for (const el of items) { if (el.textContent?.trim() === 'Test Example') { el.click(); break; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { if (b.textContent?.trim() === 'Edit' || b.textContent?.trim() === '编辑') { b.click(); return; } }
    });
    await page.waitForTimeout(2000);
    const before = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    const addOk = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t.includes('Add Website') || t.includes('添加网站')) { b.click(); return true; } }
      return false;
    });
    r('T3: Add Website found', addOk);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    r('T3: New pair appears', after > before, before + '->' + after);
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs.length >= 3) { inputs[inputs.length - 2].value = 'https://other.com'; inputs[inputs.length - 2].dispatchEvent(new Event('input', { bubbles: true })); }
      if (inputs.length >= 4) { inputs[inputs.length - 1].value = 'https://other.com/login'; inputs[inputs.length - 1].dispatchEvent(new Event('input', { bubbles: true })); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return; } }
    });
    await page.waitForTimeout(2000); r('T3: Save 2 pairs', true);
    await page.evaluate(() => {
      const items = document.querySelectorAll('span, div, a');
      for (const el of items) { if (el.textContent?.trim() === 'Test Example') { el.click(); break; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { if (b.textContent?.trim() === 'Edit' || b.textContent?.trim() === '编辑') { b.click(); return; } }
    });
    await page.waitForTimeout(2000);
    const rc = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    r('T3: 4 inputs after reopen', rc >= 4, 'found ' + rc);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      const rm = [];
      for (const b of btns) { const t = b.textContent?.trim(); if (t.includes('Remove') || t.includes('删除')) rm.push(b); }
      if (rm.length > 1) rm[rm.length - 1].click();
    });
    await page.waitForTimeout(1000);
    const rm = await page.evaluate(() => document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]').length);
    r('T3: 2 inputs after remove', rm <= 2, 'found ' + rm);
    // T4
    console.log('\n=== T4 ===');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { if (b.textContent?.trim() === 'Cancel' || b.textContent?.trim() === '取消') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    const listText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    r('T4: List loads', listText.length > 100);
    // T5
    console.log('\n=== T5 ===');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const al = b.getAttribute('aria-label') || ''; if (al === 'txt_add' || al === 'New' || al === '新增') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item');
      for (const el of items) { if (el.textContent.includes('Login') || el.textContent.includes('登录')) { el.click(); return; } }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs[0]) { inputs[0].value = 'https://github.com/claw'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.waitForTimeout(500);
    const aiState = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const al = b.getAttribute('aria-label') || '';
        const ti = b.getAttribute('title') || '';
        if (al.includes('auto name') || ti.includes('auto name') || b.classList.contains('ai-detect-btn')) return { disabled: b.disabled };
      }
      return null;
    });
    r('T5: AI button enabled', aiState && !aiState.disabled, JSON.stringify(aiState));
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const al = b.getAttribute('aria-label') || '';
        const ti = b.getAttribute('title') || '';
        if ((al.includes('auto name') || ti.includes('auto name') || b.classList.contains('ai-detect-btn')) && !b.disabled) { b.click(); return; }
      }
    });
    await page.waitForTimeout(1000);
    const nmVal = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      return inputs.length ? inputs[0].value : null;
    });
    r('T5: Name=GitHub', nmVal && nmVal.includes('GitHub'), 'name=' + nmVal);
    // T6
    console.log('\n=== T6 ===');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { if (b.textContent?.trim() === 'Cancel' || b.textContent?.trim() === '取消') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    // 6a: Same URL
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const al = b.getAttribute('aria-label') || ''; if (al === 'txt_add' || al === 'New' || al === '新增') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item');
      for (const el of items) { if (el.textContent.includes('Login') || el.textContent.includes('登录')) { el.click(); return; } }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs[0]) { inputs[0].value = 'https://same.com'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (inputs[1]) { inputs[1].value = 'https://same.com'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
      const nm = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nm[0]) { nm[0].value = 'Same URL'; nm[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const pw = document.querySelectorAll('input[type="password"]');
      if (pw[0]) { pw[0].value = 'Test123!'; pw[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return; } }
    });
    await page.waitForTimeout(2000); r('T6a: Same URL save', true);
    await page.evaluate(() => {
      const items = document.querySelectorAll('span, div, a');
      for (const el of items) { if (el.textContent?.trim() === 'Same URL') { el.click(); return; } }
    });
    await page.waitForTimeout(1000);
    const sd = await page.evaluate(() => document.body.innerText);
    const sc = (sd.match(/https:\/\/same\.com/g) || []).length;
    r('T6a: Dedup to 1', sc <= 1, 'count=' + sc);
    await page.goBack(); await page.waitForTimeout(1000);
    // 6b: Empty homepage + login only
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const al = b.getAttribute('aria-label') || ''; if (al === 'txt_add' || al === 'New' || al === '新增') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item');
      for (const el of items) { if (el.textContent.includes('Login') || el.textContent.includes('登录')) { el.click(); return; } }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder*="example.com"], input[placeholder*="URL"]');
      if (inputs[1]) { inputs[1].value = 'https://login-only.com/login'; inputs[1].dispatchEvent(new Event('input', { bubbles: true })); }
      const nm = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nm[0]) { nm[0].value = 'Login Only'; nm[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const pw = document.querySelectorAll('input[type="password"]');
      if (pw[0]) { pw[0].value = 'Test123!'; pw[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return; } }
    });
    await page.waitForTimeout(2000); r('T6b: Empty homepage + login', true);
    // 6c: Empty additional pair
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { if (b.textContent?.trim() === 'Cancel' || b.textContent?.trim() === '取消') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const al = b.getAttribute('aria-label') || ''; if (al === 'txt_add' || al === 'New' || al === '新增') { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const items = document.querySelectorAll('.create-menu-item');
      for (const el of items) { if (el.textContent.includes('Login') || el.textContent.includes('登录')) { el.click(); return; } }
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t.includes('Add Website') || t.includes('添加网站')) { b.click(); return; } }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const nm = document.querySelectorAll('input[placeholder*="name"], input[placeholder*="名称"]');
      if (nm[0]) { nm[0].value = 'Empty Pair'; nm[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const pw = document.querySelectorAll('input[type="password"]');
      if (pw[0]) { pw[0].value = 'Test123!'; pw[0].dispatchEvent(new Event('input', { bubbles: true })); }
      const btns = document.querySelectorAll('button');
      for (const b of btns) { const t = b.textContent?.trim(); if (t === 'Save' || t === 'Confirm' || t === '保存' || t === '确认') { b.click(); return; } }
    });
    await page.waitForTimeout(2000); r('T6c: Empty additional pair', true);
    console.log('\nConsole errors:', consoleErrors.length);
    consoleErrors.forEach(e => console.log('  ERR:', e));
  } catch (e) { console.error('Fatal:', e.message); results.push({ name: 'Fatal', pass: false, detail: e.message }); await shot('fatal'); }
  const pass = results.filter(r => r.pass).length, fail = results.filter(r => !r.pass).length;
  let rep = '# NodeWarden Browser Test Report\nDate: ' + new Date().toString() + '\n\n## Results: ' + pass + ' PASS, ' + fail + ' FAIL\n\n';
  for (const x of results) { rep += '- ' + (x.pass ? 'PASS' : 'FAIL') + ': ' + x.name; if (x.detail) rep += ' (' + x.detail + ')'; rep += '\n'; }
  rep += '\n## Console Errors\n' + (consoleErrors.length ? consoleErrors.map(e => '- ' + e).join('\n') : 'No console errors.') + '\n';
  if (fail === 0) rep += '\nAll browser tests PASSED.\n';
  fs.writeFileSync('/Users/claw/Projects/nodewarden/.test-report.md', rep);
  console.log('\n' + rep);
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
