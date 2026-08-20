const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('BROWSER REQ FAIL:', req.url(), req.failure().errorText));
  
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password123');
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => console.log('Timeout on login'));
  await page.goto('http://localhost:5173/consultations', {waitUntil: 'networkidle0'});
  
  await new Promise(r => setTimeout(r, 2000));
  
  const elements = await page.$$('button');
  for (const el of elements) {
      const text = await page.evaluate(el => el.textContent, el);
      if (text.includes('Request Teleconsultation') || text.includes('Request Teleconsult')) {
          await el.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
