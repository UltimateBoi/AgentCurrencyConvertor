chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchCurrency") {
      fetchCurrency().then(rate => {
        sendResponse({ rate });
      }).catch(error => {
        sendResponse({ error: error.message });
      });
      return true; // indicates that sendResponse will be called asynchronously
    }
  });
  
  async function fetchCurrency() {
    const response = await fetch('https://api.sandbox.transferwise.tech/v3/quotes/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "sourceCurrency": "CNY",
        "targetCurrency": "GBP",
        "sourceAmount": null,
        "targetAmount": null
      })
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json();
    return data.rate;
  } // TODO: not sure if needed anymore??