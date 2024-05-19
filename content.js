async function waitForSelectorWithText(selector) {
    return new Promise((resolve) => {
        const poller = () => {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                console.log('Found', selector);
                resolve(element);
            } else {
                console.log('Still waiting for', selector);
                setTimeout(poller, 1000);
            }
        };
        poller();
    });
}

async function fetchCurrency() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "fetchCurrency" }, response => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response.rate);
            }
        });
    });
}

(async function() {
    'use strict';

    const goodsTxtElement = await waitForSelectorWithText('.goods-txt');
    const amountCNY = parseFloat(goodsTxtElement.textContent.trim());

    if (!isNaN(amountCNY)) {
        try {
            const rate = await fetchCurrency();
            const amountGBP = amountCNY * rate;

            goodsTxtElement.textContent = amountGBP.toFixed(2);

            const goodsRmbElement = document.querySelector('.goods-rmb');
            if (goodsRmbElement) {
                goodsRmbElement.textContent = '£';
            }
        } catch (error) {
            console.error(error);
        }
    }
})();
