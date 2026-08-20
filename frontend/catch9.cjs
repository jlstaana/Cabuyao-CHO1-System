const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password123');
  await page.keyboard.press('Enter');
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => console.log('Navigation timeout'));
  console.log('Navigating to Consultations...');
  await page.goto('http://localhost:5173/dashboard/consultations', {waitUntil: 'networkidle0'});
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking request button...');
  const elements = await page.$$('button');
  for (const el of elements) {
      const text = await page.evaluate(el => el.textContent, el);
      if (text.includes('Request Teleconsultation')) {
          await el.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  const errorOverlay = await page.$('vite-error-overlay');
  if (errorOverlay) {
      const errorText = await page.evaluate(el => el.shadowRoot.innerHTML, errorOverlay);
      console.log('VITE ERROR:', errorText);
  } else {
      console.log('No vite error overlay');
      
      // Let's get ALL console messages
      const msgs = await page.evaluate(() => {
          return window.__logs || []; // Wait, puppeteer doesn't capture past console if not hooked early, but we can just use page.on('console')!
      });
  }
  
  await browser.close();
})();
