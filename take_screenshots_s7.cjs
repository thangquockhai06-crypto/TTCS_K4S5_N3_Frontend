const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH_FALLBACK = 'C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : CHROME_PATH_FALLBACK;
const OUTPUT_DIR = path.join(__dirname, 'screenshots_s7');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser with:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    defaultViewport: { width: 1440, height: 950, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Login
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });

    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="tài khoản" i]');
    const passInput = await page.$('input[type="password"]');

    if (emailInput && passInput) {
      await emailInput.type('admin@nexuscrm.vn');
      await passInput.type('Admin@2026');

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
      }
    }
    await new Promise(r => setTimeout(r, 2000));

    // -------------------------------------------------------------
    // Overview: /quotes (Centralized Quotes Management Page)
    // -------------------------------------------------------------
    console.log('Capturing Quotes Page (/quotes)...');
    await page.goto('http://localhost:5173/quotes', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_00_quotes_list.png') });

    // -------------------------------------------------------------
    // S7-01: Soạn thảo Báo giá Đa sản phẩm (Quote Builder)
    // -------------------------------------------------------------
    console.log('Capturing S7-01: Quote Builder (/quotes/builder)...');
    await page.goto('http://localhost:5173/quotes/builder', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_01_quote_builder.png') });

    // -------------------------------------------------------------
    // S7-02: Cơ chế Đa chiết khấu & Hàng đợi Phê duyệt phân cấp
    // -------------------------------------------------------------
    console.log('Capturing S7-02: Quote Approval Queue (/quotes/approvals)...');
    await page.goto('http://localhost:5173/quotes/approvals', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_02_approval_queue.png') });

    // -------------------------------------------------------------
    // S7-03: So sánh trực quan giữa các phiên bản Báo giá (Visual Diff)
    // -------------------------------------------------------------
    console.log('Capturing S7-03: Quote Version Diff (/quotes/compare?dealId=deal-01)...');
    await page.goto('http://localhost:5173/quotes/compare?dealId=deal-01', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_03_version_diff.png') });

    // -------------------------------------------------------------
    // S7-04 & S7-05: Chuyển đổi Hợp đồng & Mẫu In Doanh nghiệp từ /quotes
    // -------------------------------------------------------------
    console.log('Navigating back to /quotes for Modals...');
    await page.goto('http://localhost:5173/quotes', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Open Print Modal (S7-05)
    console.log('Opening S7-05 Print Preview Modal...');
    await page.evaluate(() => {
      const printBtns = Array.from(document.querySelectorAll('button[title*="S7-05"]'));
      if (printBtns.length > 0) printBtns[0].click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_05_print_preview_modal.png') });

    // Close modal
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const close = closeBtns.find(b => b.textContent && b.textContent.includes('Đóng'));
      if (close) close.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Open Convert to Contract Modal (S7-04)
    console.log('Opening S7-04 Convert to Contract Modal...');
    await page.evaluate(() => {
      const convertBtns = Array.from(document.querySelectorAll('button[title*="S7-04"]'));
      if (convertBtns.length > 0) convertBtns[0].click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_04_convert_contract_modal.png') });

    // Close modal
    await page.evaluate(() => {
      const cancelBtns = Array.from(document.querySelectorAll('button'));
      const cancel = cancelBtns.find(b => b.textContent && b.textContent.includes('Hủy'));
      if (cancel) cancel.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // -------------------------------------------------------------
    // S7-06: Cổng thông tin Khách hàng trực tuyến (Client Portal)
    // -------------------------------------------------------------
    console.log('Capturing S7-06: Customer Quote Portal (/portal/quotes/token-demo-accepted-01)...');
    await page.goto('http://localhost:5173/portal/quotes/token-demo-accepted-01', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_06_customer_portal.png') });

    // -------------------------------------------------------------
    // S7-07: Quản lý Hợp đồng & Cảnh báo Tái ký 1-click (/contracts)
    // -------------------------------------------------------------
    console.log('Capturing S7-07: Contracts & 1-Click Renewal (/contracts)...');
    await page.goto('http://localhost:5173/contracts', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_07_contracts_renewal.png') });

    console.log('All Sprint 7 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
}

run();
