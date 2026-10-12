import type { Env } from "../../types/env";
import type
{
    AttendancePeriodRecord,
    CreateAttendancePeriodRequest,
    UpdateAttendancePeriodRequest,
    PeriodCourseRecord
}
from "../../types/attendance-period";
import
{
    authenticate
}
from "../../security/auth";
import
{
    jsonResponse,
    RESPONSE_SUCCESS,
    RESPONSE_FORBIDDEN,
    RESPONSE_INVALID_JSON,
    RESPONSE_REQUIRED_FIELDS,
    RESPONSE_COURSE_NOT_FOUND,
    RESPONSE_ACADEMIC_YEAR_NOT_FOUND
}
from "../../utils/response";
import
{
    RESPONSE_INVALID_PERIOD_ID,
    RESPONSE_PERIOD_NOT_FOUND,
    RESPONSE_INVALID_PERIOD_FILTER,
    RESPONSE_INVALID_PERIOD_MONTH,
    RESPONSE_INVALID_PERIOD_DATES,
    RESPONSE_PERIOD_EXISTS,
    RESPONSE_PERIOD_LOCKED,
    RESPONSE_PERIOD_YEAR_CLOSED,
    RESPONSE_PERIOD_CONFLICT,
    RESPONSE_PERIOD_CREATED,
    RESPONSE_PERIOD_UPDATED,
    RESPONSE_PERIOD_CLOSED,
    RESPONSE_PERIOD_REOPENED,
    RESPONSE_PERIOD_WRITE_FAILED
}
from "../../utils/attendance-period-response";
import
{
    ST_GET_ATTENDANCE_PERIODS,
    ST_GET_ATTENDANCE_PERIOD,
    ST_GET_ACTIVE_YEAR_FOR_PERIODS,
    ST_GET_ACTIVE_COURSE_FOR_PERIODS,
    ST_GET_PERIOD_BY_COURSE_AND_MONTH,
    ST_CREATE_ATTENDANCE_PERIOD,
    ST_UPDATE_ATTENDANCE_PERIOD_DATES,
    ST_CLOSE_ATTENDANCE_PERIOD,
    ST_REOPEN_ATTENDANCE_PERIOD
}
from "../../queries/admin/attendance-periods.queries";
import
{
    areValidPeriodDates,
    getMonthBounds,
    isPositiveInteger
}
from "../../services/attendance-period-validation";

const PATH_PERIODS = "/api/admin/attendance-periods";
const PATH_PERIOD = /^\/api\/admin\/attendance-periods\/(\d+)$/;
const PATH_PERIOD_ACTION = /^\/api\/admin\/attendance-periods\/(\d+)\/(close|reopen)$/;

//==================================================================================================
// ROUTER - ADMINISTRATOR ONLY
//==================================================================================================

export async function handleAdminAttendancePeriodRoutes(
    request: Request,
    env: Env,
    url: URL
): Promise<Response | null>
{
    const periodMatch = url.pathname.match(PATH_PERIOD);
    const actionMatch = url.pathname.match(PATH_PERIOD_ACTION);

    if (url.pathname !== PATH_PERIODS && !periodMatch && !actionMatch)
    {
        return null;
    }

    const auth = await authenticate(request, env.DB);

    if (!auth.authenticated)
    {
        return auth.response;
    }

    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(RESPONSE_FORBIDDEN, 403);
    }

    if (request.method === "GET" && url.pathname === PATH_PERIODS)
    {
        return getPeriods(env, url);
    }

    if (request.method === "POST" && url.pathname === PATH_PERIODS)
    {
        return createPeriod(request, env);
    }

    if (periodMatch)
    {
        const periodId = Number(periodMatch[1]);

        if (!isPositiveInteger(periodId))
        {
            return jsonResponse(RESPONSE_INVALID_PERIOD_ID, 400);
        }

        if (request.method === "GET")
        {
            return getPeriod(env, periodId);
        }

        if (request.method === "PUT")
        {
            return updatePeriod(request, env, periodId);
        }
    }

    if (actionMatch && request.method === "POST")
    {
        const periodId = Number(actionMatch[1]);

        if (!isPositiveInteger(periodId))
        {
            return jsonResponse(RESPONSE_INVALID_PERIOD_ID, 400);
        }

        return setPeriodState(env, periodId, auth.user.id, actionMatch[2] === "close");
    }

    return null;
}

//==================================================================================================
// LIST PERIODS - defaults to ACTIVE academic year; historical records remain queryable
//==================================================================================================

async function getPeriods(env: Env, url: URL): Promise<Response>
{
    const rawYear = url.searchParams.get("year");
    const rawCourseId = url.searchParams.get("courseId");
    const state = url.searchParams.get("state");

    if (
        (rawYear !== null && (!/^\d{4}$/.test(rawYear) || Number(rawYear) < 1900)) ||
        (rawCourseId !== null && (!/^[1-9]\d*$/.test(rawCourseId) || !Number.isSafeInteger(Number(rawCourseId)))) ||
        (state !== null && state !== "OPEN" && state !== "CLOSED")
    )
    {
        return jsonResponse(RESPONSE_INVALID_PERIOD_FILTER, 400);
    }

    let year = rawYear === null ? null : Number(rawYear);
    const courseId = rawCourseId === null ? null : Number(rawCourseId);

    if (year === null)
    {
        const current = await env.DB
            .prepare(ST_GET_ACTIVE_YEAR_FOR_PERIODS)
            .first<{ id: number; year: number }>();

        if (!current)
        {
            return jsonResponse(RESPONSE_ACADEMIC_YEAR_NOT_FOUND, 409);
        }

        year = current.year;
    }

    const result = await env.DB
        .prepare(ST_GET_ATTENDANCE_PERIODS)
        .bind(year, courseId, courseId, state, state)
        .all<AttendancePeriodRecord>();

    return jsonResponse
    ({
        ...RESPONSE_SUCCESS,
        year,
        periods: result.results.map(toPeriodResponse)
    });
}

//==================================================================================================
// GET PERIOD
//==================================================================================================

async function getPeriod(env: Env, periodId: number): Promise<Response>
{
    const period = await findPeriod(env.DB, periodId);

    if (!period)
    {
        return jsonResponse(RESPONSE_PERIOD_NOT_FOUND, 404);
    }

    return jsonResponse({ ...RESPONSE_SUCCESS, period: toPeriodResponse(period) });
}

//==================================================================================================
// CREATE PERIOD
//==================================================================================================

async function createPeriod(request: Request, env: Env): Promise<Response>
{
    const data = await readBody(request);

    if (!data)
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const input = data as Partial<CreateAttendancePeriodRequest>;

    if (!isPositiveInteger(input.courseId))
    {
        return jsonResponse(RESPONSE_REQUIRED_FIELDS, 400);
    }

    if (typeof input.month !== "number" || !Number.isInteger(input.month) || input.month < 1 || input.month > 12)
    {
        return jsonResponse(RESPONSE_INVALID_PERIOD_MONTH, 400);
    }

    const course = await env.DB
        .prepare(ST_GET_ACTIVE_COURSE_FOR_PERIODS)
        .bind(input.courseId)
        .first<PeriodCourseRecord>();

    if (!course)
    {
        return jsonResponse(RESPONSE_COURSE_NOT_FOUND, 404);
    }

    const bounds = getMonthBounds(course.year, input.month);
    const dateStart = input.dateStart === undefined ? bounds.dateStart : input.dateStart;
    const dateEnd = input.dateEnd === undefined ? bounds.dateEnd : input.dateEnd;

    if (!areValidPeriodDates(course.year, input.month, dateStart, dateEnd))
    {
        return jsonResponse(RESPONSE_INVALID_PERIOD_DATES, 400);
    }

    const existing = await env.DB
        .prepare(ST_GET_PERIOD_BY_COURSE_AND_MONTH)
        .bind(input.courseId, course.year, input.month)
        .first<{ id: number }>();

    if (existing)
    {
        return jsonResponse(RESPONSE_PERIOD_EXISTS, 409);
    }

    try
    {
        const result = await env.DB
            .prepare(ST_CREATE_ATTENDANCE_PERIOD)
            .bind(input.month, dateStart, dateEnd, input.courseId)
            .run();

        if (result.meta.changes !== 1)
        {
            return jsonResponse(RESPONSE_PERIOD_CONFLICT, 409);
        }

        const period = await findPeriod(env.DB, Number(result.meta.last_row_id));

        if (!period)
        {
            return jsonResponse(RESPONSE_PERIOD_WRITE_FAILED, 500);
        }

        return jsonResponse
        ({
            ...RESPONSE_PERIOD_CREATED,
            period: toPeriodResponse(period)
        }, 201);
    }
    catch (error)
    {
        return periodWriteError(error);
    }
}

//==================================================================================================
// UPDATE DATES - ONLY OPEN PERIODS; NO ATTENDANCE RECORD MAY BE LEFT OUTSIDE
//==================================================================================================

async function updatePeriod(request: Request, env: Env, periodId: number): Promise<Response>
{
    const existing = await findPeriod(env.DB, periodId);

    if (!existing)
    {
        return jsonResponse(RESPONSE_PERIOD_NOT_FOUND, 404);
    }

    if (existing.academicYearStatus !== "ACTIVE")
    {
        return jsonResponse(RESPONSE_PERIOD_YEAR_CLOSED, 409);
    }

    if (existing.state !== "OPEN")
    {
        return jsonResponse(RESPONSE_PERIOD_LOCKED, 409);
    }

    const data = await readBody(request);

    if (!data)
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const input = data as Partial<UpdateAttendancePeriodRequest>;
    const dateStart = input.dateStart === undefined ? existing.dateStart : input.dateStart;
    const dateEnd = input.dateEnd === undefined ? existing.dateEnd : input.dateEnd;

    if (!areValidPeriodDates(existing.year, existing.month, dateStart, dateEnd))
    {
        return jsonResponse(RESPONSE_INVALID_PERIOD_DATES, 400);
    }

    try
    {
        const result = await env.DB
            .prepare(ST_UPDATE_ATTENDANCE_PERIOD_DATES)
            .bind(dateStart, dateEnd, periodId, dateStart, dateEnd)
            .run();

        if (result.meta.changes !== 1)
        {
            return jsonResponse(RESPONSE_PERIOD_CONFLICT, 409);
        }

        const updated = await findPeriod(env.DB, periodId);

        return jsonResponse
        ({
            ...RESPONSE_PERIOD_UPDATED,
            period: updated ? toPeriodResponse(updated) : null
        });
    }
    catch (error)
    {
        return periodWriteError(error);
    }
}

//==================================================================================================
// CLOSE / REOPEN - ATOMIC STATE CHANGES
//==================================================================================================

async function setPeriodState(
    env: Env,
    periodId: number,
    userId: number,
    closing: boolean
): Promise<Response>
{
    const existing = await findPeriod(env.DB, periodId);

    if (!existing)
    {
        return jsonResponse(RESPONSE_PERIOD_NOT_FOUND, 404);
    }

    if (existing.academicYearStatus !== "ACTIVE")
    {
        return jsonResponse(RESPONSE_PERIOD_YEAR_CLOSED, 409);
    }

    if (existing.state !== (closing ? "OPEN" : "CLOSED"))
    {
        return jsonResponse(RESPONSE_PERIOD_CONFLICT, 409);
    }

    try
    {
        const result = closing
            ? await env.DB.prepare(ST_CLOSE_ATTENDANCE_PERIOD).bind(userId, periodId).run()
            : await env.DB.prepare(ST_REOPEN_ATTENDANCE_PERIOD).bind(periodId).run();

        if (result.meta.changes !== 1)
        {
            return jsonResponse(RESPONSE_PERIOD_CONFLICT, 409);
        }

        const updated = await findPeriod(env.DB, periodId);

        return jsonResponse
        ({
            ...(closing ? RESPONSE_PERIOD_CLOSED : RESPONSE_PERIOD_REOPENED),
            period: updated ? toPeriodResponse(updated) : null
        });
    }
    catch (error)
    {
        return periodWriteError(error);
    }
}

//==================================================================================================
// HELPERS
//==================================================================================================

async function readBody(request: Request): Promise<Record<string, unknown> | null>
{
    try
    {
        const data: unknown = await request.json();

        if (data === null || Array.isArray(data) || typeof data !== "object")
        {
            return null;
        }

        return data as Record<string, unknown>;
    }
    catch
    {
        return null;
    }
}

async function findPeriod(db: D1Database, periodId: number): Promise<AttendancePeriodRecord | null>
{
    return db.prepare(ST_GET_ATTENDANCE_PERIOD).bind(periodId).first<AttendancePeriodRecord>();
}

function toPeriodResponse(record: AttendancePeriodRecord)
{
    const { academicYearStatus, courseState, ...fields } = record;
    return fields;
}

function periodWriteError(error: unknown): Response
{
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("UNIQUE constraint failed") || message.includes("SQLITE_CONSTRAINT_UNIQUE"))
    {
        return jsonResponse(RESPONSE_PERIOD_EXISTS, 409);
    }

    console.error("Unable to save attendance period:", error);
    return jsonResponse(RESPONSE_PERIOD_WRITE_FAILED, 500);
}
