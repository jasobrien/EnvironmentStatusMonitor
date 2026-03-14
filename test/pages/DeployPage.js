const { expect } = require('@playwright/test');

class DeployPage {
  constructor(page) {
    this.page = page;
  }

  getUrl(env) {
    return `/readyToDeploy/${env}`;
  }

  getUrlWithTrans(env, trans) {
    return `/readyToDeploy/${env}/${trans}`;
  }

  async gotoEnvironment(env) {
    await this.page.goto(this.getUrl(env));
  }

  async gotoEnvironmentTrans(env, trans) {
    await this.page.goto(this.getUrlWithTrans(env, trans));
  }

  async expectResponseOk() {
    const content = await this.page.evaluate(() => document.body.innerText);
    expect(content.length).toBeGreaterThan(0);
  }

  async expectJsonArrayResponse() {
    const content = await this.page.evaluate(() => {
      try {
        return JSON.parse(document.body.innerText);
      } catch {
        return null;
      }
    });
    expect(Array.isArray(content)).toBeTruthy();
  }
}

module.exports = { DeployPage };
