const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating...');
  await page.goto('http://localhost:5173/login');
  
  await page.type('input[type="email"]', 'juan.cruz@example.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  console.log('Logged in. Navigating to Consultations...');
  await page.goto('http://localhost:5173/dashboard/consultations');
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
