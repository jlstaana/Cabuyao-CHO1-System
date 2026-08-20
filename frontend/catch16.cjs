const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => console.log('Timeout'));
  
  await page.screenshot({path: 'login_result.png'});
  console.log('Saved login_result.png');
  await browser.close();
})();
