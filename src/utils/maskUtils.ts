/**
 * Utilitários de Máscaras para Formulários Brasileiros (CPF, CNPJ, Celular, Telefone, CEP)
 * Aplica formatação automática progressiva conforme o usuário digita.
 */

/**
 * Remove todos os caracteres não numéricos.
 */
export function unmask(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Formata CPF progressivamente: 111.111.111-11
 */
export function maskCpf(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formata CNPJ progressivamente: 11.111.111/0001-11
 */
export function maskCnpj(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 14);
  if (!digits) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formata dinamicamente CPF (até 11 dígitos) ou CNPJ (12 a 14 dígitos)
 * Permite digitação contínua sem quebrar a máscara.
 */
export function maskCpfCnpj(value: string | null | undefined): string {
  const digits = unmask(value);
  if (digits.length <= 11) {
    return maskCpf(digits);
  }
  return maskCnpj(digits);
}

/**
 * Formata Celular com DDD (11 dígitos): (35) 99999-9999
 */
export function maskCellPhone(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formata Telefone Fixo com DDD (10 dígitos): (35) 3521-1122
 */
export function maskPhone(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 10);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Formata Telefone ou Celular dinamicamente (10 ou 11 dígitos):
 * - Até 10 dígitos: (35) 3521-1122
 * - 11 dígitos:     (35) 99999-9999
 */
export function maskPhoneOrCell(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formata CEP progressivamente: 12345-678
 */
export function maskCep(value: string | null | undefined): string {
  const digits = unmask(value).slice(0, 8);
  if (!digits) return '';
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Máscara para campos de preço com vírgula e 2 casas decimais:
 * - Aceita números e converte '.' para ','
 * - Garante no máximo 2 casas decimais após a vírgula
 * - Remove caracteres não numéricos exceto uma única vírgula
 */
export function maskCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  if (str === '') return '';

  // Converte ponto em vírgula
  str = str.replace('.', ',');

  // Remove caracteres inválidos (mantém dígitos e vírgula)
  str = str.replace(/[^\d,]/g, '');

  const parts = str.split(',');
  if (parts.length > 1) {
    const integerPart = parts[0];
    const decimalPart = parts.slice(1).join('').slice(0, 2);
    return `${integerPart},${decimalPart}`;
  }

  return parts[0];
}

/**
 * Garante a formatação com 2 casas decimais após a vírgula (ex: 150 -> "150,00", 12.5 -> "12,50").
 */
export function formatCurrencyTwoDecimals(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = typeof value === 'number' ? value : parseCurrency(value);
  if (isNaN(num)) return '0,00';
  return num.toFixed(2).replace('.', ',');
}

/**
 * Converte valor formatado em string com vírgula (ex: "150,50") ou número para float numérico padrão (150.5).
 */
export function parseCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  let str = String(value).trim();
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  const clean = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

