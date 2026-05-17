const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE_ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text(), msg.location().url);
  });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 5000 });
    console.log('Page loaded successfully.');
    // wait a bit for react errors
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.error('Failed to load page:', err);
  }
  
  await browser.close();
})();
