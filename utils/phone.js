const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const localDigits = digits.startsWith('380') ? digits.slice(3) : digits.replace(/^0/, '');
  return localDigits.slice(-9);
};

const toStoredPhone = (value) => `+380${normalizePhone(value)}`;

module.exports = { normalizePhone, toStoredPhone };
