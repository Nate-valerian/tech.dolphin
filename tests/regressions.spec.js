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
