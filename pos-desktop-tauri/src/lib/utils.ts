// Dynamic offline-first currency formatter
export const formatCurrency = (value: number) => {
  const symbol = localStorage.getItem('currency_symbol') || 'MT';
  const decimals = parseInt(localStorage.getItem('currency_decimals') || '2', 10);
  const decimalSep = localStorage.getItem('currency_decimal_separator') || ',';
  
  const num = (value || 0).toFixed(decimals);
  const thousandSep = decimalSep === ',' ? '.' : ' ';
  
  const parts = num.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  const formatted = parts.join(decimalSep);

  return `${formatted} ${symbol}`;
};
