const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password123');
  await page.keyboard.press('Enter');
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => {});
  await page.goto('http://localhost:5173/dashboard/consultations', {waitUntil: 'networkidle0'});
  await new Promise(r => setTimeout(r, 2000));
  
  const elements = await page.$$('button');
  for (const el of elements) {
      const text = await page.evaluate(el => el.textContent, el);
      if (text.includes('Request Teleconsultation') || text.includes('Request Teleconsult')) {
          await el.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'crash_screenshot.png'});
  console.log('Screenshot saved to crash_screenshot.png');
  await browser.close();
})();
