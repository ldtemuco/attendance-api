export function isPositiveInteger(value: unknown): value is number
{
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function isValidIsoDate(value: unknown): value is string
{
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getMonthBounds(year: number, month: number): { dateStart: string; dateEnd: string }
{
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

    return {
        dateStart: `${prefix}-01`,
        dateEnd: `${prefix}-${String(lastDay).padStart(2, "0")}`
    };
}

export function areValidPeriodDates(
    year: number,
    month: number,
    dateStart: unknown,
    dateEnd: unknown
): dateStart is string
{
    if (!Number.isInteger(year) || year < 1900 || year > 9999 ||
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !isValidIsoDate(dateStart) || !isValidIsoDate(dateEnd))
    {
        return false;
    }

    const prefix = `${year}-${String(month).padStart(2, "0")}-`;

    return dateStart.startsWith(prefix) &&
        dateEnd.startsWith(prefix) &&
        dateStart <= dateEnd;
}
