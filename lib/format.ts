// Single place to change the store currency and locale.
const STORE_LOCALE = "es-CL";
const STORE_CURRENCY = "CLP";

const priceFormatter = new Intl.NumberFormat(STORE_LOCALE, {
  style: "currency",
  currency: STORE_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (value: number): string => priceFormatter.format(value);
