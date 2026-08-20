const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    // Intercept console.error to catch React errors before Vite clears them
    const origError = console.error;
    console.error = function(...args) {
      origError.apply(console, args);
      window.__REACT_ERRORS = window.__REACT_ERRORS || [];
      window.__REACT_ERRORS.push(args.map(String).join(' '));
    };
  });
  
  page.on('console', msg => {
      // Just print it all
  });

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
      if (text.includes('Request Teleconsultation') || text.includes('Request Teleconsult')) {
          await el.click();
          break;
      }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  const errs = await page.evaluate(() => window.__REACT_ERRORS);
  console.log('REACT ERRORS:', errs);
  await browser.close();
})();
