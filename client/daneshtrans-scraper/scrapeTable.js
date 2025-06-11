const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function scrapeTable() {
  console.log('[INFO] Starting scraping process...');

  // Configure Chrome options
  let options = new chrome.Options();
  options.addArguments(
    '--headless=new', // modern headless mode
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1920,1080',
    '--remote-debugging-port=9222'
  );

  let driver;
  try {
    console.log('[INFO] Launching Chrome browser...');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    console.log('[INFO] Navigating to the target page...');
    await driver.get('https://www.daneshtrans.com/rules/official-translation-price/');

    console.log('[INFO] Waiting for table to load...');
    await driver.wait(until.elementLocated(By.css('table')), 10000);

    let table = await driver.findElement(By.css('table'));
    let rows = await table.findElements(By.css('tr'));
    let tableData = [];

    console.log('[INFO] Extracting table data...');
    for (let row of rows) {
      let cells = await row.findElements(By.css('th, td'));
      let rowData = [];
      for (let cell of cells) {
        let text = await cell.getText();
        rowData.push(text);
      }
      if (rowData.length > 0) {
        tableData.push(rowData);
      }
    }

    console.log('[SUCCESS] Table data extracted successfully:');
    console.table(tableData);

    fs.writeFileSync('translation_prices.json', JSON.stringify(tableData, null, 2));
    console.log('[SUCCESS] Data has been saved to translation_prices.json');

  } catch (error) {
    console.error('[ERROR] Something went wrong:', error);
  } finally {
    if (driver) {
      console.log('[INFO] Closing browser...');
      await driver.quit();
    }
    console.log('[INFO] Scraping process finished.');
  }
})();
