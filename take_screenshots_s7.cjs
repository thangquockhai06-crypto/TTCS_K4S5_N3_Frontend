const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH_FALLBACK = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH_GOOGLE = 'C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';

let executablePath = CHROME_PATH;
if (fs.existsSync(CHROME_PATH)) {
  executablePath = CHROME_PATH;
} else if (fs.existsSync(CHROME_PATH_FALLBACK)) {
  executablePath = CHROME_PATH_FALLBACK;
} else if (fs.existsSync(CHROME_PATH_GOOGLE)) {
  executablePath = CHROME_PATH_GOOGLE;
}

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
    // S7-01: Quote Builder (Soạn thảo Báo giá Đa sản phẩm)
    // -------------------------------------------------------------
    console.log('Capturing S7-01: Quote Builder...');
    await page.goto('http://localhost:5173/quotes/builder', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_01_quote_builder_overview.png') });

    // Open add item or item selector
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && (b.textContent.includes('Thêm dòng sản phẩm') || b.textContent.includes('Thêm sản phẩm')));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_01_quote_items_list.png') });

    // -------------------------------------------------------------
    // S7-02: Quote Approval Queue & Approval Rules
    // -------------------------------------------------------------
    console.log('Capturing S7-02: Quote Approval Queue...');
    await page.goto('http://localhost:5173/quotes/approvals', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_02_approval_queue.png') });

    // Switch to History Tab
    console.log('Capturing S7-02: Approval History Tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const histBtn = btns.find(b => b.textContent && b.textContent.includes('Lịch sử'));
      if (histBtn) histBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_02_approval_history.png') });

    // -------------------------------------------------------------
    // S7-03: Quote Version Comparison
    // -------------------------------------------------------------
    console.log('Capturing S7-03: Version Comparison Modal...');
    await page.goto('http://localhost:5173/quotes/builder', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cmpBtn = btns.find(b => b.textContent && b.textContent.includes('So sánh phiên bản'));
      if (cmpBtn) cmpBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_03_version_comparison_modal.png') });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // -------------------------------------------------------------
    // S7-04: Convert Quote to Contract Modal
    // -------------------------------------------------------------
    console.log('Capturing S7-04: Convert to Contract Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cBtn = btns.find(b => b.textContent && b.textContent.includes('Chuyển thành Hợp đồng'));
      if (cBtn) cBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_04_convert_to_contract_modal.png') });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // -------------------------------------------------------------
    // S7-05: PDF Export & Calculation Totals
    // -------------------------------------------------------------
    console.log('Capturing S7-05: Quote Calculation Totals & Terms...');
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_05_quote_totals_terms.png') });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 500));

    // -------------------------------------------------------------
    // S7-06: Share Link Modal & Customer Portal View
    // -------------------------------------------------------------
    console.log('Capturing S7-06: Share Link Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sBtn = btns.find(b => b.textContent && b.textContent.includes('Liên kết Khách hàng'));
      if (sBtn) sBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_06_share_portal_modal.png') });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    console.log('Capturing S7-06: Customer Quote Portal View...');
    await page.goto('http://localhost:5173/portal/quotes/quote_token_accepted_01', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_06_customer_portal_view.png') });

    // -------------------------------------------------------------
    // S7-07: Contracts Page & Renewal Opportunity
    // -------------------------------------------------------------
    console.log('Capturing S7-07: Contracts List...');
    await page.goto('http://localhost:5173/contracts', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_07_contracts_list.png') });

    console.log('Capturing S7-07: Renewal Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const renBtn = btns.find(b => b.textContent && b.textContent.includes('Tái ký'));
      if (renBtn) renBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_07_renewal_opportunity_modal.png') });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    // -------------------------------------------------------------
    // S7-08: Notification Center
    // -------------------------------------------------------------
    console.log('Capturing S7-08: Notification Center...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    // Click bell icon
    await page.evaluate(() => {
      const headerBtns = Array.from(document.querySelectorAll('header button, nav button'));
      // Find button containing svg or bell
      const bell = headerBtns.find(b => b.querySelector('svg.lucide-bell') || b.innerHTML.includes('bell') || b.querySelector('svg'));
      if (bell) bell.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_08_notifications_dropdown.png') });

    // -------------------------------------------------------------
    // S7-09: Automation Rules Page & Execution Logs
    // -------------------------------------------------------------
    console.log('Capturing S7-09: Automation Rules List...');
    await page.goto('http://localhost:5173/automation', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_09_automation_rules_list.png') });

    console.log('Capturing S7-09: Create Automation Rule Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && (b.textContent.includes('Thêm quy tắc') || b.textContent.includes('Tạo quy tắc') || b.innerHTML.includes('lucide-plus')));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_09_create_automation_modal.png') });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    console.log('Capturing S7-09: Automation Execution Logs...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logTab = btns.find(b => b.textContent && (b.textContent.includes('Nhật ký thực thi') || b.textContent.includes('Lịch sử chạy')));
      if (logTab) logTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 's7_09_automation_execution_logs.png') });

    console.log('Sprint 7 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
