///////// Configuration here

// The currency configured here MUST match the one used in the page.
const currency = '$';
// Used to replace the label below the price.
const perMonthLabel = 'Per month';
const perYearLabel = 'Per year';
// Regex used to extract the discount from the "yearly" button label (e.g. "Yearly (-15%)").
const discountRegexInYearlyButton = /-(\d\d?)%/;
// If the discount couldn't be read (nothing that matches the regex), we use a default discount instead.
// Must be between 0 and 1. 0 means no discount, 1 means 100% discount (free)
const defaultDiscount = 0;

// Function that calculates the yearly price from the monthly one and the discount.
function calculateYearlyPrice(monthlyPrice, discount) {
  return monthlyPrice * 12 * (1 - discount);
}

///////// Implementation details below

// true is not supported yet (we should calculate monthly prices from annual prices)
const initialIsYearly = false;

const monthBtn = document.getElementById('pricing-monthly-btn');
const yearBtn = document.getElementById('pricing-yearly-btn');

const discount = readDiscount();
const activeClassName = initialIsYearly ? yearBtn.className : monthBtn.className;
const inactiveClassName = initialIsYearly ? monthBtn.className : yearBtn.className;

const prices = [];
for (let i = 1; i <= 3; i++) {
  const priceElt = document.getElementById(`price-${i}`);
  const labelElt = document.getElementById(`per-month-${i}`);
  const monthlyPriceNum = getAmountOrStr(priceElt);
  const monthlyPrice = toCurrency(monthlyPriceNum);
  const yearlyPrice = toCurrency(calculateYearlyPriceIfNumber(monthlyPriceNum));
  prices.push({ priceElt, labelElt, monthlyPrice, yearlyPrice });
}

const state = {
  _isYearly: initialIsYearly,
  get isYearly() {
    return this._isYearly;
  },
  set isYearly(isYearly) {
    if (this._isYearly === isYearly) {
      return;
    }
    this._isYearly = isYearly;
    render();
  },
};

yearBtn.onclick = e => {
  e.preventDefault();
  state.isYearly = true;
};

monthBtn.onclick = e => {
  e.preventDefault();
  state.isYearly = false;
};

render();

function render() {
  const yearly = state.isYearly;
  if (yearly) {
    activateYearlyBtn();
  } else {
    activateMonthlyBtn();
  }
  for (const { priceElt, labelElt, monthlyPrice, yearlyPrice } of prices) {
    const newPrice = yearly ? yearlyPrice : monthlyPrice;
    const oldPrice = priceElt.textContent.trim();
    if (newPrice !== oldPrice) {
      priceElt.innerHTML = newPrice;
    }

    const newLabel = yearly ? perYearLabel : perMonthLabel;
    const oldLabel = labelElt.textContent.trim();
    if (newLabel !== oldLabel) {
      labelElt.innerHTML = newLabel;
    }
  }
}

function activateMonthlyBtn() {
  monthBtn.className = activeClassName;
  yearBtn.className = inactiveClassName;
}

function activateYearlyBtn() {
  yearBtn.className = activeClassName;
  monthBtn.className = inactiveClassName;
}

function isYearly() {
  return yearBtn.classList.contains('active');
}

function readDiscount() {
  const match = yearBtn.textContent.match(discountRegexInYearlyButton);
  if (!match) {
    console.warn('Discount not recognized. It is ignored.');
  }
  return match ? parseFloat(match[1]) / 100 : defaultDiscount;
}

function getAmountOrStr(element) {
  const txt = element.textContent.trim();
  const match = txt.match(new RegExp(`\\${currency}(\\d+(\\.\\d+)?)`));
  return match ? parseFloat(match[1]) : txt;
}

function calculateYearlyPriceIfNumber(monthlyPrice) {
  return typeof monthlyPrice === 'number' ? calculateYearlyPrice(monthlyPrice, discount) : monthlyPrice;
}

function toCurrency(amount) {
  return typeof amount === 'number' ? `${currency}${Math.round(amount)}` : amount;
}
