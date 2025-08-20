// Configuration
const CONFIG = {
    merchantAccountID: 50,
    certificate: 'eSW32UuxujH9dzww1w0uNy9WNgmLneV4Da9a6HZNUawDhSQXW2RDaxLGuzKxPxGWSvNcFSBK6LpPN1m5CuejLJqjVLeQibpzacKe',
    callbackURL: 'https://suyool.com/',
    desktopURL: 'https://sandbox.suyool.com/paysuyoolqrtest/',
    mobileURL: 'https://sandbox.suyool.com/paysuyoolmobile/'
};

function generateTranID() {
    return 'trx' + Math.random().toString(36).substr(2, 9) + Date.now();
}

function getUnixTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
}

function isMobile() {
    return window.innerWidth <= 768;
}

function generateDesktopHash(params) {
    // Desktop concatenation order: TranID + TS + Amount + Currency + CallBackURL + TranTS + AdditionalInfo + Certificate
    const concatenated = params.tranID + 
                         params.ts + 
                         params.amount + 
                         params.currency + 
                         params.callBackURL + 
                         params.tranTS + 
                         params.additionalInfo + 
                         CONFIG.certificate;
    
    console.log('Desktop hash concatenation:', concatenated);
    return CryptoJS.SHA512(concatenated).toString(CryptoJS.enc.Base64);
}

function generateMobileHash(params) {
    // Mobile concatenation order: TranID + MerchantID + Amount + Currency + CallBackURL + TranTS + AdditionalInfo + Certificate
    // All parameters in lowercase for concatenation as per documentation
    const concatenated = params.tranID + 
                         CONFIG.merchantAccountID + 
                         params.amount + 
                         params.currency.toUpperCase() + 
                         params.callBackURL + 
                         params.tranTS + 
                         params.additionalInfo + 
                         CONFIG.certificate;
    
    console.log('Mobile hash concatenation:', concatenated);
    return CryptoJS.SHA512(concatenated).toString(CryptoJS.enc.Base64);
}

function processPayment() {
    const amountInput = document.getElementById('amount').value;
    const amount = parseFloat(amountInput);
    const currency = document.getElementById('currency').value;
    const additionalInfo = document.getElementById('additionalInfo').value || '';
   
    // Debug logging
    console.log('Amount input:', amountInput);
    console.log('Parsed amount:', amount);
    console.log('Currency:', currency);
   
    // Validate amount is a valid number
    if (!amountInput || amountInput.trim() === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }
   
    if (!currency) {
        alert('Please select a currency');
        return;
    }
   
    const params = {
        tranID: generateTranID(),
        amount: amount.toFixed(2),
        currency: currency,
        tranTS: getUnixTimestamp(),
        ts: getUnixTimestamp(),
        callBackURL: CONFIG.callbackURL,
        additionalInfo: additionalInfo || '' 
    };
    
    // Debug: Log all parameters
    console.log('Payment parameters:', params);

    if (isMobile()) {
        // Mobile: redirect to Suyool app
        const hash = generateMobileHash(params);
        const url = CONFIG.mobileURL +
                   `?AdditionalInfo=${params.additionalInfo}` +
                   `&TranID=${params.tranID}` +
                   `&Amount=${params.amount}` +
                   `&Currency=${params.currency.toUpperCase()}` + // Display as uppercase
                   `&TranTS=${params.tranTS}` +
                   `&CallBackURL=${encodeURIComponent(params.callBackURL)}` +
                   `&BrowserType=${encodeURIComponent('Mobile')}` +
                   `&SecureHash=${encodeURIComponent(hash)}` +
                   `&TS=${params.ts}` +
                   `&MerchantID=${CONFIG.merchantAccountID}` +
                   `&CurrentURL=https://domain.com/checkout`;
        
        // Debug: Log the final URL
        console.log('Mobile URL:', url);
        console.log('Generated hash:', hash);
        
        window.location.href = url;
    } else {
        // Desktop: show QR in iframe
        const hash = generateDesktopHash(params);
        const url = CONFIG.desktopURL +
                   `?TranID=${params.tranID}` +
                   `&Amount=${params.amount}` +
                   `&Currency=${params.currency.toUpperCase()}` + // Display as uppercase
                   `&TranTS=${params.tranTS}` +
                   `&CallBackURL=${encodeURIComponent(params.callBackURL)}` +
                   `&SecureHash=${encodeURIComponent(hash)}` +
                   `&TS=${params.ts}` +
                   `&MerchantAccountID=${CONFIG.merchantAccountID}` +
                   `&AdditionalInfo=${params.additionalInfo}`;
        
        // Debug: Log the final URL
        console.log('Desktop URL:', url);
        console.log('Generated hash:', hash);
        
        document.getElementById('paymentContainer').innerHTML =
            `<iframe src="${url}" width="100%" height="500"></iframe>`;
    }
}