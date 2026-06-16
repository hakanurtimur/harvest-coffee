export interface ValidationFailure {
  message: string;
  title: string;
}

export type ValidationResult<T> = { ok: true; value: T } | ({ ok: false } & ValidationFailure);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateDeliveryAddress(address: string): ValidationResult<string> {
  const value = address.trim();
  if (value.length < 3) {
    return {
      ok: false,
      title: "Delivery address required",
      message: "Please add a delivery address before placing the order.",
    };
  }
  return { ok: true, value };
}

export function validateAddressForm(title: string, address: string): ValidationResult<{ address: string; title: string }> {
  const nextTitle = title.trim();
  const nextAddress = address.trim();

  if (!nextTitle || nextAddress.length < 3) {
    return {
      ok: false,
      title: "Address required",
      message: "Add an address title and a valid delivery address.",
    };
  }

  return { ok: true, value: { address: nextAddress, title: nextTitle } };
}

export function validateOrderNumber(orderNumber: string): ValidationResult<string> {
  const value = orderNumber.trim().toUpperCase();
  if (!value) {
    return {
      ok: false,
      title: "Order number required",
      message: "Enter an order number to track.",
    };
  }

  if (!/^HC\d{6,}$/.test(value)) {
    return {
      ok: false,
      title: "Invalid order number",
      message: "Order numbers should look like HC20480914.",
    };
  }

  return { ok: true, value };
}

export function validateRentalDates(startDate: string, endDate: string): ValidationResult<{ endDate: string; startDate: string }> {
  const start = parseInputDate(startDate);
  const end = parseInputDate(endDate);

  if (!start || !end) {
    return {
      ok: false,
      title: "Rental dates required",
      message: "Use YYYY-MM-DD for both start and end dates.",
    };
  }

  if (end.getTime() < start.getTime()) {
    return {
      ok: false,
      title: "Invalid rental dates",
      message: "End date must be the same day or later than the start date.",
    };
  }

  return {
    ok: true,
    value: {
      endDate: formatDateInput(end),
      startDate: formatDateInput(start),
    },
  };
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string) {
  const normalized = value.trim();
  if (!ISO_DATE_PATTERN.test(normalized)) return null;

  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return formatDateInput(date) === normalized ? date : null;
}
