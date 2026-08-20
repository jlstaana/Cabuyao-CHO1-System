const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERROR:', msg.text());
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  
  // Login
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password');
  await page.keyboard.press('Enter');
  
  await page.waitForNavigation({waitUntil: 'networkidle0'});
  console.log('Logged in. Navigating to Consultations...');
  await page.goto('http://localhost:5173/dashboard/consultations', {waitUntil: 'networkidle0'});
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
