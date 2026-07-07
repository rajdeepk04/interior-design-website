// Use puppeteer-core to avoid automatic Chromium download; provide CHROME_PATH to run.
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const path = require('path');

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJwt(payload, secret = 'luxe-interiors-secret') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${h}.${p}.${sig}`;
}

(async () => {
  const token = signJwt({ id: 1, role: 'admin', email: 'admin@luxestudio.com', iat: Math.floor(Date.now()/1000) });
  // Launch configuration: prefer local Chrome if provided via CHROME_PATH.
  const launchOpts = {
    headless: process.env.HEADLESS === '1' ? true : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  if (process.env.CHROME_PATH) {
    launchOpts.executablePath = process.env.CHROME_PATH;
  }

  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();

  // inject localStorage before any scripts run
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem('luxeAuthToken', t);
    localStorage.setItem('luxeUser', JSON.stringify({ role: 'admin', name: 'E2E Test' }));
  }, token);

  try {
    await page.goto('http://localhost:5000/admin.html', { waitUntil: 'networkidle2' });

    // wait for avatar element
    await page.waitForSelector('#adminAvatar', { visible: true, timeout: 5000 });

    // set file input
    const filePath = path.resolve(__dirname, 'test-avatar.svg');
    const input = await page.$('#adminAvatarFile');
    if (!input) throw new Error('File input not found');

    await input.uploadFile(filePath);

    // wait for crop modal to appear
    await page.waitForSelector('#cropModal[data-open="true"]', { timeout: 5000 });

    // small pause for image load and canvas drawing
    await page.waitForTimeout(800);

    // click apply
    await page.click('#cropApplyBtn');

    // wait for status message to indicate success
    await page.waitForFunction(() => {
      const el = document.getElementById('statusMessage');
      return el && /avatar updated/i.test(el.textContent || '') ;
    }, { timeout: 8000 });

    console.log('E2E: Avatar crop + upload flow succeeded');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E test failed:', err);
    await browser.close();
    process.exit(2);
  }
})();
