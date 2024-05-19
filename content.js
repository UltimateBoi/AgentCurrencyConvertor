// ==UserScript==
// @name         Convert CNY to GBP
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Convert CNY to GBP using Wise Currency Conversion API and update the page content
// @author       coder_ultimate (u/UltimateBoiReal)
// @match        *://*.superbuy.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      api.sandbox.transferwise.tech
// ==/UserScript==

(async function() {
    'use strict';

    const convertCurrency = async () => {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'https://api.sandbox.transferwise.tech/v3/quotes/',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    "sourceCurrency": "CNY",
                    "targetCurrency": "GBP",
                    "sourceAmount": null,
                    "targetAmount": null
                }),
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        const data = JSON.parse(response.responseText);
                        resolve(data.rate);
                    } else {
                        reject(new Error(`Error: ${response.status}`));
                    }
                },
                onerror: function(err) {
                    reject(err);
                }
            });
        });
    };

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

    const goodsTxtElement = await waitForSelectorWithText('.goods-txt');
    const amountCNY = parseFloat(goodsTxtElement.textContent.trim());

    if (!isNaN(amountCNY)) {
        try {
            const rate = await convertCurrency();
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
