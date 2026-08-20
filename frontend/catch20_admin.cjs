const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:4173/login', {waitUntil: 'networkidle2'});
  await page.type('input[name="email"]', 'admin@cabuyao.gov.ph');
  await page.type('input[name="password"]', 'password123');
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => console.log('Timeout on login'));
  await page.goto('http://localhost:4173/users', {waitUntil: 'networkidle0'});
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
