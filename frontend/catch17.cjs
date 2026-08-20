const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    const origError = console.error;
    console.error = function(...args) {
      origError.apply(console, args);
      window.__REACT_ERRORS = window.__REACT_ERRORS || [];
      window.__REACT_ERRORS.push(args.map(String).join(' '));
    };
  });
  
  await page.goto('http://localhost:5173/login', {waitUntil: 'networkidle2'});
  await page.type('input[name="email"]', 'patient@gmail.com');
  await page.type('input[name="password"]', 'password123');
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
    if (btn) btn.click();
  });
  
  await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 5000}).catch(e => console.log('Timeout on login'));
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
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({path: 'request_modal_test.png'});
  const errs = await page.evaluate(() => window.__REACT_ERRORS);
  console.log('REACT ERRORS:', errs);
  await browser.close();
})();
