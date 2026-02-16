export const TAX_RATES: Record<string, number> = {
  US: 0.0,
  CA: 0.13,
  AU: 0.1,
  UK: 0.2,
  DE: 0.19,
  EU: 0.23,
};

export const getDefaultTaxRate = (): number => {
  const tax = process.env.DEFAULT_TAX_RATE;
  return tax ? parseFloat(tax) : 0;
};
