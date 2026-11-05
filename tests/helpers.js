const { test: base, expect } = require('@playwright/test');
const { pathToFileURL } = require('url');
const path = require('path');
const test = base.extend({ page: async ({ page }, use) => {
  await page.route(/ipapi\.co|geojs\.io/, route => route.fulfill({ body: 'US' }));
  await page.route(/mc\.yandex\./, route => route.fulfill({contentType:'text/javascript',body:''}));
  await page.route('**/email.min.js', route => route.fulfill({contentType:'text/javascript',body:'window.emailjs={init(){},send(){return Promise.resolve({status:200})}}'}));
  await use(page);
} });
const open = (page, site, name='index.html') => page.goto(pathToFileURL(path.resolve(__dirname,'..',site,name)).href);
module.exports={test,expect,open};
