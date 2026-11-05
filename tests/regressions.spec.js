const { test, expect, open } = require('./helpers');

for (const site of ['', 'netlify-abroad']) {
  test.describe(site || 'Russian site', () => {
    test('A1: duplicate submissions share one delivery and respect the email rate', async ({page}) => {
      await open(page,site,'contact.html');
      const result=await page.evaluate(async()=>{
        const sends=[];window.emailjs.send=(...args)=>{sends.push({at:Date.now(),id:args[2].lead_id});return Promise.resolve({status:200});};
        const params={name:'Audit',phone:'mock',message:'duplicate test'};
        const results=await Promise.all([sendLeadEmail(params),sendLeadEmail(params)]);
        await sendLeadEmail(params);
        return {sends,results};
      });
      expect(result.sends).toHaveLength(site ? 1 : 2);
      expect(result.results[0].leadId).toBe(result.results[1].leadId);
      if(!site)expect(result.sends[1].at-result.sends[0].at).toBeGreaterThanOrEqual(1000);
    });
  });
}

test('A1: partial delivery is success and complete failure remains retryable', async ({page})=>{
 await open(page,'','contact.html');
 await page.evaluate(()=>{let n=0;window.emailjs.send=()=>++n===1?Promise.resolve({status:200}):Promise.reject({status:429});});
 await page.locator('#ct-name').fill('Audit');await page.locator('#ct-phone').fill('mock');
 await page.locator('#ct-form button[type=submit]').click();
 await expect(page.locator('#ct-success')).toBeVisible();
 await expect(page.locator('#ct-error')).toBeHidden();
 await open(page,'netlify-abroad','contact.html');
 await page.evaluate(()=>{window.emailjs.send=()=>Promise.reject({status:429});});
 await page.locator('#ct-name').fill('Audit');await page.locator('#ct-phone').fill('mock');
 await page.locator('#ct-form button[type=submit]').click();
 await expect(page.locator('#ct-error')).toBeVisible();
 await expect(page.locator('#ct-form button[type=submit]')).toBeEnabled();
});

for(const site of ['', 'netlify-abroad']) {
 test('A2: language control is usable on mobile '+site,async({page})=>{
  await page.setViewportSize({width:320,height:568});await open(page,site);await page.locator('#nav-hamburger').click();
  await expect(page.locator('[data-lang-toggle]')).toBeVisible();
  const previous=await page.locator('html').getAttribute('lang');await page.locator('[data-lang-toggle]').click();
  await expect(page.locator('html')).not.toHaveAttribute('lang',previous);
 });
}
test('A2: international identity and USD pricing survive Russian translation',async({page})=>{
 await open(page,'netlify-abroad','contact.html');await page.evaluate(()=>applyLang('ru'));
 await expect(page.locator('[data-i18n=privacy_p1]')).toContainText('Datvida LLC');
 await expect(page.locator('#lang-toggle')).toBeVisible();
 await open(page,'netlify-abroad','pricing.html');await page.evaluate(()=>{applyLang('ru');toggleLeadChat(true);leadChatStep='budget';renderLeadChat();});
 await expect(page.locator('.calc-card').first()).toContainText('$1,200');
 expect((await page.locator('.chat-options').innerText())).not.toContain('₽');
});

for(const site of ['', 'netlify-abroad']) {
 test('A3: draft survives close, language switch and reload '+site,async({page})=>{
  await open(page,site);await page.evaluate(()=>{toggleLeadChat(true);leadChatStep='note';renderLeadChat();});
  await page.locator('#chat-note').fill('A useful project brief');
  await page.evaluate(()=>{toggleLeadChat(false);toggleLeadChat(true);});
  await expect(page.locator('#chat-note')).toHaveValue('A useful project brief');
  await page.locator('.chat-form button').click();
  await page.locator('#chat-name').fill('Visitor');await page.locator('#chat-contact').fill('visitor@example.test');
  await page.evaluate(()=>toggleLang());await expect(page.locator('#chat-contact')).toHaveValue('visitor@example.test');
  await page.reload();await page.evaluate(()=>toggleLeadChat(true));
  await expect(page.locator('#chat-name')).toHaveValue('Visitor');
  await expect(page.locator('#chat-contact')).toHaveValue('visitor@example.test');
  await page.evaluate(()=>resetLeadChat());await expect(page.locator('#chat-name')).toHaveCount(0);
 });
}

for(const site of ['', 'netlify-abroad']) {
 test('A4: small menu scrolls and restores on desktop resize '+site,async({page})=>{
  await page.setViewportSize({width:320,height:568});await open(page,site);
  await page.locator('#nav-hamburger').click();
  const links=page.locator('.nav-links');
  expect(await links.evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');
  await page.locator('.nav-close-btn').scrollIntoViewIfNeeded();await page.locator('.nav-close-btn').click();
  await expect(links).not.toHaveClass(/open/);
  await page.locator('#nav-hamburger').click();await page.setViewportSize({width:1440,height:900});
  await expect(links).not.toHaveClass(/open/);
  expect(await page.evaluate(()=>getComputedStyle(document.body).position)).not.toBe('fixed');
  expect(await links.evaluate(el=>!!el.closest('.nav'))).toBe(true);
  await page.evaluate(()=>scrollTo({top:1200,behavior:'instant'}));await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(1100);
 });
}
