const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  // Make window.open read-only to simulate AI Studio iframe
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, 'open', {
      value: window.open,
      writable: false,
      configurable: false
    });
  });

  page.on('pageerror', error => {
    console.error('PAGE ERROR CATCHED:', error.message);
    console.error('STACK:', error.stack);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.error('PAGE CONSOLE ERROR:', msg.text());
       
       // Sometimes console.error comes with location/trace
       const location = msg.location();
       console.error('LOCATION:', location);
    }
  });

  const { exec } = require('child_process');
  // Start vite dev server on a specific fixed port
  const server = exec('npx vite --port 4321 --strictPort');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log("Navigating to page...");
    await page.goto('http://localhost:4321/');
    console.log("Waiting 3 seconds...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("Clicking body...");
    try { await page.click('body'); } catch(e){}
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    console.error('Puppeteer navigation error:', e);
  } finally {
    server.kill();
    await browser.close();
    process.exit(0);
  }
})();
