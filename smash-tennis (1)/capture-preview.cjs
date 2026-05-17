import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    console.error(error.stack);
  });
  
  await page.goto('http://localhost:4173/'); // vite preview runs on 4173 usually
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();
