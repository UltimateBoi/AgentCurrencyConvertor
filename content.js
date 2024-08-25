async function waitForSelectorWithText(selector) {
    return new Promise((resolve) => {
        const poller = () => {
            const element = document.querySelector(selector);
            if (element && element.tagName === 'P' && element.querySelector('span') && element.querySelector('span').textContent.trim()) {
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
        console.log('Fetching currency rate...');
        chrome.runtime.sendMessage({ action: "fetchCurrency" }, response => {
            if (response.error) {
                console.error('Error fetching currency:', response.error);
                reject(new Error(response.error));
            } else {
                console.log('Fetched currency rate:', response.rate);
                resolve(response.rate);
            }
        });
    });
}

async function convertCurrency(observer, goodsTxtSelector) {
    console.log('Starting currency conversion...');
    const goodsTxtElement = await waitForSelectorWithText(goodsTxtSelector);
    console.log('goodsTxtElement:', goodsTxtElement);

    const spanElement = goodsTxtElement.querySelector('span');
    const amountCNYText = spanElement.textContent.match(/CNY ￥(\d+(\.\d+)?)/);
    const amountCNY = amountCNYText ? parseFloat(amountCNYText[1]) : NaN;
    console.log('amountCNY:', amountCNY);

    if (!isNaN(amountCNY)) {
        try {
            const rate = await fetchCurrency();
            const amountGBP = amountCNY * rate;
            console.log('Converted amountGBP:', amountGBP);

            // Temporarily disconnect the observer to prevent infinite loop
            observer.disconnect();
            spanElement.textContent = `CNY ￥${amountCNY.toFixed(2)} ≈£${amountGBP.toFixed(2)}`;
            observer.observe(goodsTxtElement, { childList: true, subtree: true, characterData: true });

            const goodsRmbElement = document.querySelector('.goods-rmb');
            if (goodsRmbElement) {
                goodsRmbElement.textContent = '£';
                console.log('Updated .goods-rmb text to £');
            }
        } catch (error) {
            console.error('Error during conversion:', error);
        }
    } else {
        console.error('Invalid amountCNY:', amountCNY);
    }
}

(async function() {
    'use strict';

    console.log('Initializing currency conversion script...');

    // Get the current site's hostname
    const hostname = window.location.hostname;

    console.log('hostname:', hostname);

    // Determine the selector based on the hostname
    let goodsTxtSelector;
    if (hostname === 'www.superbuy.com' || hostname === 'www.allchinabuy.com') {
        goodsTxtSelector = '.goods-txt';
    } else if (hostname === 'www.cssbuy.com') {
        goodsTxtSelector = '.price';
    } else {
        console.error('Unsupported site:', hostname);
        return;
    }

    const goodsTxtElement = await waitForSelectorWithText(goodsTxtSelector);

    if (goodsTxtElement) {
        console.log(`Setting up MutationObserver on ${goodsTxtSelector}`);
        const observer = new MutationObserver((mutationsList) => {
            console.log(`${goodsTxtSelector} content changed, re-running conversion...`);
            mutationsList.forEach((mutation) => {
                console.log('Mutation detected:', mutation);
            });
            convertCurrency(observer, goodsTxtSelector);
        });

        observer.observe(goodsTxtElement, { childList: true, subtree: true, characterData: true });

        // Initial conversion
        await convertCurrency(observer, goodsTxtSelector);
    } else {
        console.error(`${goodsTxtSelector} element not found`);
    }
})();