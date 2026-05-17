import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  const page = await browser.newPage();
  
  // Expose a function to log from browser context
  await page.exposeFunction('logError', (msg, stack) => {
    console.error('INJECTED ERROR LOG:', msg);
    console.error(stack);
  });

  await page.evaluateOnNewDocument(() => {
    // Intercept unhandled rejections
    window.addEventListener('unhandledrejection', (event) => {
      window.logError('Unhandled rejection: ' + event.reason, event.reason && event.reason.stack);
    });
    // Intercept errors
    window.addEventListener('error', (event) => {
      window.logError('Error event: ' + event.message, event.error && event.error.stack);
    });
    
    // Attempt to hook window.open assignment immediately
    const originalOpen = window.open;
    try {
      Object.defineProperty(window, 'open', {
        get() { return originalOpen; },
        set(v) {
          window.logError('Someone tried to set window.open!', new Error().stack);
        }
      });
    } catch(e) {
      window.logError('Could not redefine window.open early', e.stack);
    }
  });

  page.on('pageerror', error => {
    console.error('PAGE ERROR (uncaught):', error.message);
    console.error('Stack:', error.stack);
  });
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})();
