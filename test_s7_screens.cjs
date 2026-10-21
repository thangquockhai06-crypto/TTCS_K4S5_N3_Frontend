const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, 'screenshots_s7');

async function testScreens() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 950, deviceScaleFactor: 1.5 }
  });
  const page = await browser.newPage();

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await emailInput.type('admin@nexuscrm.vn');
    await page.type('input[type="password"]', 'Admin@2026');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 1500));

  // 1. Check QuoteBuilder share modal & portal URL
  await page.goto('http://localhost:5173/quotes/builder', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Open share modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sBtn = btns.find(b => b.textContent && b.textContent.includes('Liên kết Khách hàng'));
    if (sBtn) sBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  
  const portalUrl = await page.evaluate(() => {
    const input = document.querySelector('input[value*="/portal/quotes/"]');
    return input ? input.value : null;
  });
  console.log('Detected Portal URL:', portalUrl);
  
  if (portalUrl) {
    await page.goto(portalUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_06_customer_portal_view.png') });
    console.log('s7_06_customer_portal_view.png captured!');
  }

  // 2. Contracts Page
  await page.goto('http://localhost:5173/contracts', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_07_contracts_list.png') });
  
  const contractButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
  });
  console.log('Contract Page Buttons:', contractButtons);

  // Click "Tái ký"
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const renBtn = btns.find(b => b.textContent && b.textContent.includes('Tái ký'));
    if (renBtn) {
      renBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked renewal button:', clicked);
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_07_renewal_opportunity_modal.png') });

  await browser.close();
  console.log('Test completed!');
}

testScreens().catch(console.error);
