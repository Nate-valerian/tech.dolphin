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

for(const site of ['', 'netlify-abroad']) {
 test('A5: brief fits short and keyboard-sized viewports '+site,async({page})=>{
  await page.setViewportSize({width:320,height:568});await open(page,site);await page.locator('#lead-chat-toggle').click();
  for(const height of [568,300]) {
   await page.setViewportSize({width:320,height});
   await expect.poll(()=>page.locator('#lead-chat-panel').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight;})).toBe(true);
   const close=page.locator('.lead-chat-close');await expect(close).toBeInViewport();
  }
  await page.locator('.lead-chat-close').click();await expect(page.locator('#lead-chat-panel')).toBeHidden();
 });
}

for(const site of ['', 'netlify-abroad']) {
 test('A6: keyboard FAQ, pricing, labelled fields and modal focus '+site,async({page})=>{
  await open(page,site,'faq.html');const question=page.locator('.faq-q').first();await question.focus();await page.keyboard.press('Enter');
  await expect(question).toHaveAttribute('aria-expanded','true');await expect(page.locator('.faq-a').first()).toBeVisible();
  await open(page,site,'pricing.html');const choice=page.locator('.calc-choice').first();await choice.focus();await page.keyboard.press('Space');
  await expect(page.locator('.calc-choice').first()).toBeChecked();
  await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('main')).toHaveCount(1);
  await open(page,site,'contact.html');for(const id of ['ct-name','ct-phone','ct-email','ct-message']) expect(await page.locator('#'+id).evaluate(el=>el.labels.length)).toBe(1);
  await page.setViewportSize({width:390,height:844});await page.locator('#nav-hamburger').click();
  for(let i=0;i<18;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement.closest('.nav-links'))).toBe(true);}
  await page.keyboard.press('Escape');await expect(page.locator('#nav-hamburger')).toBeFocused();
 });
}

for(const site of ['', 'netlify-abroad']) {
 test('A7: pricing choices become an editable enquiry summary '+site,async({page})=>{
  await open(page,site,'pricing.html');await page.locator('#calc-c1').check();
  await page.locator('#calc-cta').click();await expect(page.locator('#estimate-summary')).toBeVisible();
  expect(await page.locator('#ct-message').inputValue()).toMatch(site ? /1,200/ : /30/);
  const before=await page.locator('#ct-message').inputValue();await page.locator('#ct-message').fill(before+'\nMy additional requirement');
  await page.evaluate(()=>toggleLang());expect(await page.locator('#ct-message').inputValue()).toContain('My additional requirement');
  await page.locator('#estimate-summary button').click();await expect(page.locator('#estimate-summary')).toBeHidden();
  await open(page,site,'pricing.html');await expect(page.locator('.calc-choice:checked')).toHaveCount(0);
 });
}
