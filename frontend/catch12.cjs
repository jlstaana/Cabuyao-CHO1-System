const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => {
      console.error('GLOBAL_ERROR:', e.message, e.filename, e.lineno);
    });
    window.addEventListener('unhandledrejection', e => {
      console.error('UNHANDLED_REJECTION:', e.reason);
    });
  });
  
  let logs = [];
  page.on('console', msg => logs.push('LOG: ' + msg.text()));
  page.on('pageerror', error => logs.push('PAGE ERROR: ' + error.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password123');
  await page.keyboard.press('Enter');
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => logs.push('Navigation timeout'));
  console.log('Navigating to Consultations...');
  await page.goto('http://localhost:5173/dashboard/consultations', {waitUntil: 'networkidle0'});
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking request button...');
  const elements = await page.$$('button');
  for (const el of elements) {
      const text = await page.evaluate(el => el.textContent, el);
      if (text.includes('Request Teleconsultation') || text.includes('Request Teleconsult')) {
          await el.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  fs.writeFileSync('catch12_logs.txt', logs.join('\n'));
  await browser.close();
})();
