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

async function convertCurrency(observer) {
    console.log('Starting currency conversion...');
    const goodsTxtElement = await waitForSelectorWithText('.goods-txt');
    console.log('goodsTxtElement:', goodsTxtElement);

    const amountCNY = parseFloat(goodsTxtElement.textContent.trim());
    console.log('amountCNY:', amountCNY);

    if (!isNaN(amountCNY)) {
        try {
            const rate = await fetchCurrency();
            const amountGBP = amountCNY * rate;
            console.log('Converted amountGBP:', amountGBP);

            // Temporarily disconnect the observer to prevent infinite loop
            observer.disconnect();
            goodsTxtElement.textContent = amountGBP.toFixed(2);
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
    const goodsTxtElement = await waitForSelectorWithText('.goods-txt');

    if (goodsTxtElement) {
        console.log('Setting up MutationObserver on .goods-txt');
        const observer = new MutationObserver((mutationsList) => {
            console.log('.goods-txt content changed, re-running conversion...');
            mutationsList.forEach((mutation) => {
                console.log('Mutation detected:', mutation);
            });
            convertCurrency(observer);
        });

        observer.observe(goodsTxtElement, { childList: true, subtree: true, characterData: true });

        // Initial conversion
        await convertCurrency(observer);
    } else {
        console.error('.goods-txt element not found');
    }
})();