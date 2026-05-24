import { z } from "zod";

const PERSON_NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const PASSWORD_LOWERCASE = /[a-z]/;
const PASSWORD_UPPERCASE = /[A-Z]/;
const PASSWORD_NUMBER = /\d/;
const PASSWORD_SYMBOL = /[^A-Za-z0-9]/;

export const STRONG_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.";

type ScheduleIssueContext = Pick<z.RefinementCtx, "addIssue">;

export type ScheduleValidationOptions = {
  startDate: string;
  startDateField: string;
  startTime: string;
  startTimeField: string;
  endDate?: string;
  endDateField?: string;
  endTime: string;
  endTimeField: string;
  allowPastStartDate?: boolean;
  requireFutureStart?: boolean;
  now?: Date;
};

export function sanitizePersonName(value: string) {
  return value
    .replace(/[^\p{L}' -]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 50);
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function localPhilippineMobile(value: string) {
  let digits = digitsOnly(value);

  if (digits.startsWith("639")) digits = digits.slice(2);
  if (digits.startsWith("09")) digits = digits.slice(1);

  return digits.slice(0, 10);
}

export function normalizePhilippineMobile(value: string) {
  const local = localPhilippineMobile(value);

  return local ? `+63${local}` : "";
}

export function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    PASSWORD_LOWERCASE.test(value) &&
    PASSWORD_UPPERCASE.test(value) &&
    PASSWORD_NUMBER.test(value) &&
    PASSWORD_SYMBOL.test(value)
  );
}

export function generateSecurePassword(length = 16) {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%^&*()-_=+[]{}?";
  const all = `${lowercase}${uppercase}${numbers}${symbols}`;
  const targetLength = Math.max(length, 12);
  const required = [
    randomChar(lowercase),
    randomChar(uppercase),
    randomChar(numbers),
    randomChar(symbols),
  ];

  while (required.length < targetLength) {
    required.push(randomChar(all));
  }

  return shuffle(required).join("");
}

export function sanitizeNumericInput(
  value: string,
  {
    allowDecimal = true,
    decimalScale,
  }: {
    allowDecimal?: boolean;
    decimalScale?: number;
  } = {},
) {
  let nextValue = value.replace(/[eE+-]/g, "");

  if (!allowDecimal) return nextValue.replace(/\D/g, "");

  nextValue = nextValue.replace(/[^\d.]/g, "");

  const [whole = "", ...decimalParts] = nextValue.split(".");
  const decimal = decimalParts.join("");

  if (!decimalParts.length) return whole;

  return `${whole}.${decimalScale ? decimal.slice(0, decimalScale) : decimal}`;
}

export function personNameSchema(label: string) {
  return z
    .string()
    .transform((value) => sanitizePersonName(value).trim())
    .pipe(
      z
        .string()
        .min(2, `${label} must be at least 2 characters.`)
        .max(50, `${label} must be 50 characters or fewer.`)
        .regex(
          PERSON_NAME_PATTERN,
          `${label} can only contain letters, spaces, apostrophes, and hyphens.`,
        ),
    );
}

export function requiredEmailSchema(label = "Email") {
  return z
    .string()
    .trim()
    .toLowerCase()
    .min(1, `${label} is required.`)
    .email(`Enter a valid ${label.toLowerCase()} address.`);
}

export function strongPasswordSchema(label = "Password") {
  return z
    .string()
    .min(1, `${label} is required.`)
    .refine(isStrongPassword, STRONG_PASSWORD_MESSAGE);
}

export function optionalStrongPasswordSchema() {
  return z
    .string()
    .optional()
    .refine((value) => !value || isStrongPassword(value), STRONG_PASSWORD_MESSAGE);
}

export function optionalEmailSchema(label = "Email") {
  return z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      `Enter a valid ${label.toLowerCase()} address.`,
    );
}

export function philippineMobileSchema(label = "Phone number") {
  return z
    .string()
    .transform(normalizePhilippineMobile)
    .pipe(
      z
        .string()
        .regex(
          /^\+639\d{9}$/,
          `${label} must start with 9 and contain 10 digits.`,
        ),
    );
}

export function optionalPhilippineMobileSchema(label = "Phone number") {
  return z
    .string()
    .transform((value) => normalizePhilippineMobile(value))
    .refine(
      (value) => value === "" || /^\+639\d{9}$/.test(value),
      `${label} must start with 9 and contain 10 digits.`,
    );
}

export const requiredDateSchema = (label: string) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .regex(ISO_DATE_PATTERN, `Enter a valid ${label.toLowerCase()}.`);

export const requiredTimeSchema = (label: string) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .regex(TIME_PATTERN, `Enter a valid ${label.toLowerCase()}.`);

type NumberStringSchemaOptions = {
  max?: number;
};

export const nonNegativeNumberStringSchema = (label: string, options: NumberStringSchemaOptions = {}) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} must be a valid number.`)
    .refine((value) => Number(value) >= 0, `${label} cannot be negative.`)
    .refine(
      (value) => options.max === undefined || Number(value) <= options.max,
      `${label} must be ${options.max ?? 0} or less.`,
    );

export const positiveNumberStringSchema = (label: string, options: NumberStringSchemaOptions = {}) =>
  nonNegativeNumberStringSchema(label, options).refine(
    (value) => Number(value) > 0,
    `${label} must be greater than 0.`,
  );

export function todayIsoDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function timeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;

  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function addScheduleIssues(
  context: ScheduleIssueContext,
  {
    startDate,
    startDateField,
    startTime,
    startTimeField,
    endDate,
    endDateField,
    endTime,
    endTimeField,
    allowPastStartDate = false,
    requireFutureStart = false,
    now = new Date(),
  }: ScheduleValidationOptions,
) {
  const today = todayIsoDate(now);
  const actualEndDate = endDate || startDate;
  const actualEndDateField = endDateField || startDateField;
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (!allowPastStartDate && startDate < today) {
    addCustomIssue(context, startDateField, "Date cannot be before today.");
  }

  if (actualEndDate < startDate) {
    addCustomIssue(context, actualEndDateField, "End date cannot be before the start date.");
  }

  if (startMinutes === null) {
    addCustomIssue(context, startTimeField, "Enter a valid start time.");
  }

  if (endMinutes === null) {
    addCustomIssue(context, endTimeField, "Enter a valid end time.");
  }

  if (startMinutes !== null && endMinutes !== null && actualEndDate === startDate && endMinutes <= startMinutes) {
    addCustomIssue(context, endTimeField, "End time must be after the start time.");
  }

  if (requireFutureStart && startDate === today && startMinutes !== null) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes < nowMinutes) {
      addCustomIssue(context, startTimeField, "Start time cannot be earlier than the current time.");
    }
  }
}

export function zodIssuesToFieldErrors<TField extends string = string>(issues: z.ZodIssue[]) {
  return issues.reduce<Partial<Record<TField, string>>>((errors, issue) => {
    const key = issue.path.join(".") as TField;
    errors[key] = issue.message;

    return errors;
  }, {});
}

function addCustomIssue(context: ScheduleIssueContext, field: string, message: string) {
  context.addIssue({
    code: "custom",
    path: [field],
    message,
  });
}

function randomChar(chars: string) {
  return chars[randomInt(chars.length)] ?? chars[0];
}

function randomInt(max: number) {
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);

    return array[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}
