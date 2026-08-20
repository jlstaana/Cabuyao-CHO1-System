const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
        page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

        await page.goto('http://localhost:4173/login');
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'admin@cabuyao.gov.ph');
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('Logged in as admin. Navigating to /users');
        
        await page.goto('http://localhost:4173/users');
        await page.waitForTimeout(2000); // Wait for React to render

        console.log('Done');
    } catch (err) {
        console.error('SCRIPT ERROR:', err);
    } finally {
        if (browser) await browser.close();
    }
})();
