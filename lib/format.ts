// Single place to change the store currency and locale.
// en-US keeps the "$8.99" format the store uses; prices are in USD.
const STORE_LOCALE = "en-US";
const STORE_CURRENCY = "USD";

const priceFormatter = new Intl.NumberFormat(STORE_LOCALE, {
  style: "currency",
  currency: STORE_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPrice = (value: number): string => priceFormatter.format(value);
