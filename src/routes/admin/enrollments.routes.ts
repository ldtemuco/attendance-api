import type { Env } from "../../types/env";
import type
{
    AdminEnrollmentRecord,
    CreateEnrollmentRequest,
    UpdateEnrollmentRequest,
    EnrollmentCourseRecord
}
from "../../types/enrollment";
import
{
    jsonResponse,
    RESPONSE_SUCCESS,
    RESPONSE_FORBIDDEN,
    RESPONSE_INVALID_JSON,
    RESPONSE_REQUIRED_FIELDS,
    RESPONSE_STUDENT_NOT_FOUND,
    RESPONSE_COURSE_NOT_FOUND,
    RESPONSE_ACADEMIC_YEAR_NOT_FOUND
}
from "../../utils/response";
import
{
    RESPONSE_INVALID_ENROLLMENT_ID,
    RESPONSE_ENROLLMENT_NOT_FOUND,
    RESPONSE_ENROLLMENT_EXISTS,
    RESPONSE_ALREADY_ENROLLED_THIS_YEAR,
    RESPONSE_ENROLLMENT_NUMBER_EXISTS,
    RESPONSE_ENROLLMENT_CONFLICT,
    RESPONSE_INVALID_ENROLLMENT_NUMBER,
    RESPONSE_INVALID_ENROLLMENT_DATE,
    RESPONSE_INVALID_ENROLLMENT_FILTER,
    RESPONSE_ACADEMIC_YEAR_CLOSED_FOR_ENROLLMENT,
    RESPONSE_ENROLLMENT_CREATED,
    RESPONSE_ENROLLMENT_UPDATED,
    RESPONSE_ENROLLMENT_WRITE_FAILED
}
from "../../utils/enrollment-response";
import
{
    ST_GET_ADMIN_ENROLLMENTS,
    ST_GET_ADMIN_ENROLLMENT,
    ST_GET_ACTIVE_ACADEMIC_YEAR_ENROLLMENTS,
    ST_GET_ENROLLABLE_COURSE,
    ST_GET_ACTIVE_STUDENT_FOR_ENROLLMENT,
    ST_CHECK_STUDENT_ENROLLMENT,
    ST_CHECK_ACTIVE_YEAR_ENROLLMENT,
    ST_CHECK_ENROLLMENT_NUMBER,
    ST_CREATE_ENROLLMENT,
    ST_UPDATE_ENROLLMENT
}
from "../../queries/admin/enrollments.queries";
import { authenticate } from "../../security/auth";

const PATH_ENROLLMENTS = "/api/admin/enrollments";
const PATH_ENROLLMENT = /^\/api\/admin\/enrollments\/(\d+)$/;

//==================================================================================================
// ROUTER
//==================================================================================================

export async function handleAdminEnrollmentRoutes(
    request: Request,
    env: Env,
    url: URL
): Promise<Response | null>
{
    const match = url.pathname.match(PATH_ENROLLMENT);

    if (url.pathname !== PATH_ENROLLMENTS && !match)
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

    if (request.method === "GET" && url.pathname === PATH_ENROLLMENTS)
    {
        return getEnrollments(env, url);
    }

    if (request.method === "POST" && url.pathname === PATH_ENROLLMENTS)
    {
        return createEnrollment(request, env);
    }

    if (match)
    {
        const enrollmentId = Number(match[1]);

        if (!isPositiveId(enrollmentId))
        {
            return jsonResponse(RESPONSE_INVALID_ENROLLMENT_ID, 400);
        }

        if (request.method === "GET")
        {
            return getEnrollment(env, enrollmentId);
        }

        if (request.method === "PUT")
        {
            return updateEnrollment(request, env, enrollmentId);
        }
    }

    return null;
}

//==================================================================================================
// GET ENROLLMENTS - default current academic year; optional historical year and filters
//==================================================================================================

async function getEnrollments(env: Env, url: URL): Promise<Response>
{
    const rawYear = url.searchParams.get("year");
    const rawCourseId = url.searchParams.get("courseId");
    const rawStudentId = url.searchParams.get("studentId");
    const rawActive = url.searchParams.get("active");

    const year = rawYear === null ? null : Number(rawYear);
    const courseId = rawCourseId === null ? null : Number(rawCourseId);
    const studentId = rawStudentId === null ? null : Number(rawStudentId);

    if (
        (rawYear !== null && (!/^\d{4}$/.test(rawYear) || year === null || year < 1900 || year > 9999)) ||
        (rawCourseId !== null && (!/^[1-9]\d*$/.test(rawCourseId) || !isPositiveId(courseId))) ||
        (rawStudentId !== null && (!/^[1-9]\d*$/.test(rawStudentId) || !isPositiveId(studentId))) ||
        (rawActive !== null && rawActive !== "true" && rawActive !== "false")
    )
    {
        return jsonResponse(RESPONSE_INVALID_ENROLLMENT_FILTER, 400);
    }

    let selectedYear = year;

    if (selectedYear === null)
    {
        const academicYear = await env.DB
            .prepare(ST_GET_ACTIVE_ACADEMIC_YEAR_ENROLLMENTS)
            .first<{ id: number; year: number }>();

        if (!academicYear)
        {
            return jsonResponse(RESPONSE_ACADEMIC_YEAR_NOT_FOUND, 409);
        }

        selectedYear = academicYear.year;
    }

    const state = rawActive === null
        ? null
        : (rawActive === "true" ? "ACTIVE" : "INACTIVE");

    const result = await env.DB
        .prepare(ST_GET_ADMIN_ENROLLMENTS)
        .bind(selectedYear, courseId, courseId, studentId, studentId, state, state)
        .all<AdminEnrollmentRecord>();

    return jsonResponse
    ({
        ...RESPONSE_SUCCESS,
        year: selectedYear,
        enrollments: result.results.map(toEnrollmentResponse)
    });
}

//==================================================================================================
// GET ENROLLMENT
//==================================================================================================

async function getEnrollment(env: Env, enrollmentId: number): Promise<Response>
{
    const enrollment = await getEnrollmentRecord(env.DB, enrollmentId);

    if (!enrollment)
    {
        return jsonResponse(RESPONSE_ENROLLMENT_NOT_FOUND, 404);
    }

    return jsonResponse({ ...RESPONSE_SUCCESS, enrollment: toEnrollmentResponse(enrollment) });
}

//==================================================================================================
// CREATE ENROLLMENT
//==================================================================================================

async function createEnrollment(request: Request, env: Env): Promise<Response>
{
    const data = await getRequestData(request);

    if (data === null)
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const input = data as Partial<CreateEnrollmentRequest>;
    const studentId = input.studentId;
    const courseId = input.courseId;
    const number = input.number === undefined ? null : input.number;
    const dateEntry = input.dateEntry === undefined ? null : input.dateEntry;

    if (!isPositiveId(studentId) || !isPositiveId(courseId))
    {
        return jsonResponse(RESPONSE_REQUIRED_FIELDS, 400);
    }

    if (!isNullablePositiveInteger(number))
    {
        return jsonResponse(RESPONSE_INVALID_ENROLLMENT_NUMBER, 400);
    }

    if (!isNullableIsoDate(dateEntry))
    {
        return jsonResponse(RESPONSE_INVALID_ENROLLMENT_DATE, 400);
    }

    const student = await env.DB
        .prepare(ST_GET_ACTIVE_STUDENT_FOR_ENROLLMENT)
        .bind(studentId)
        .first<{ id: number }>();

    if (!student)
    {
        return jsonResponse(RESPONSE_STUDENT_NOT_FOUND, 404);
    }

    const course = await getEnrollableCourse(env.DB, courseId);

    if (!course)
    {
        return jsonResponse(RESPONSE_COURSE_NOT_FOUND, 404);
    }

    const existing = await env.DB
        .prepare(ST_CHECK_STUDENT_ENROLLMENT)
        .bind(studentId, courseId)
        .first<{ id: number }>();

    if (existing)
    {
        return jsonResponse(RESPONSE_ENROLLMENT_EXISTS, 409);
    }

    if (await hasActiveEnrollment(env.DB, studentId, course.academicYearId, null))
    {
        return jsonResponse(RESPONSE_ALREADY_ENROLLED_THIS_YEAR, 409);
    }

    if (number !== null && await isNumberAssigned(env.DB, courseId, number, null))
    {
        return jsonResponse(RESPONSE_ENROLLMENT_NUMBER_EXISTS, 409);
    }

    try
    {
        const result = await env.DB
            .prepare(ST_CREATE_ENROLLMENT)
            .bind(studentId, courseId, number, dateEntry)
            .run();

        const enrollmentId = Number(result.meta.last_row_id);
        const enrollment = await getEnrollmentRecord(env.DB, enrollmentId);

        if (!enrollment)
        {
            return jsonResponse(RESPONSE_ENROLLMENT_WRITE_FAILED, 500);
        }

        return jsonResponse
        ({
            ...RESPONSE_ENROLLMENT_CREATED,
            enrollment: toEnrollmentResponse(enrollment)
        }, 201);
    }
    catch (error)
    {
        return enrollmentWriteError(error);
    }
}

//==================================================================================================
// UPDATE ENROLLMENT - studentId and courseId are immutable
//==================================================================================================

async function updateEnrollment(request: Request, env: Env, enrollmentId: number): Promise<Response>
{
    const existing = await getEnrollmentRecord(env.DB, enrollmentId);

    if (!existing)
    {
        return jsonResponse(RESPONSE_ENROLLMENT_NOT_FOUND, 404);
    }

    if (existing.academicYearStatus !== "ACTIVE")
    {
        return jsonResponse(RESPONSE_ACADEMIC_YEAR_CLOSED_FOR_ENROLLMENT, 409);
    }

    const data = await getRequestData(request);

    if (data === null)
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const input = data as Partial<UpdateEnrollmentRequest>;

    if (typeof input.active !== "boolean")
    {
        return jsonResponse(RESPONSE_REQUIRED_FIELDS, 400);
    }

    const number = input.number === undefined ? existing.number : input.number;
    const dateEntry = input.dateEntry === undefined ? existing.dateEntry : input.dateEntry;
    const dateDischarge = input.active
        ? (input.dateDischarge === undefined ? null : input.dateDischarge)
        : (input.dateDischarge === undefined ? existing.dateDischarge : input.dateDischarge);

    if (!isNullablePositiveInteger(number))
    {
        return jsonResponse(RESPONSE_INVALID_ENROLLMENT_NUMBER, 400);
    }

    if (
        !isNullableIsoDate(dateEntry) ||
        !isNullableIsoDate(dateDischarge) ||
        (input.active && dateDischarge !== null) ||
        (dateEntry !== null && dateDischarge !== null && dateDischarge < dateEntry)
    )
    {
        return jsonResponse(RESPONSE_INVALID_ENROLLMENT_DATE, 400);
    }

    if (input.active)
    {
        const student = await env.DB
            .prepare(ST_GET_ACTIVE_STUDENT_FOR_ENROLLMENT)
            .bind(existing.studentId)
            .first<{ id: number }>();

        const course = await getEnrollableCourse(env.DB, existing.courseId);

        if (!student || !course)
        {
            return jsonResponse(RESPONSE_ENROLLMENT_CONFLICT, 409);
        }

        if (await hasActiveEnrollment(env.DB, existing.studentId, existing.academicYearId, enrollmentId))
        {
            return jsonResponse(RESPONSE_ALREADY_ENROLLED_THIS_YEAR, 409);
        }
    }

    if (number !== null && await isNumberAssigned(env.DB, existing.courseId, number, enrollmentId))
    {
        return jsonResponse(RESPONSE_ENROLLMENT_NUMBER_EXISTS, 409);
    }

    try
    {
        await env.DB
            .prepare(ST_UPDATE_ENROLLMENT)
            .bind(number, dateEntry, dateDischarge, input.active ? "ACTIVE" : "INACTIVE", enrollmentId)
            .run();

        const updated = await getEnrollmentRecord(env.DB, enrollmentId);

        if (!updated)
        {
            return jsonResponse(RESPONSE_ENROLLMENT_WRITE_FAILED, 500);
        }

        return jsonResponse
        ({
            ...RESPONSE_ENROLLMENT_UPDATED,
            enrollment: toEnrollmentResponse(updated)
        });
    }
    catch (error)
    {
        return enrollmentWriteError(error);
    }
}

//==================================================================================================
// HELPERS
//==================================================================================================

async function getRequestData(request: Request): Promise<Record<string, unknown> | null>
{
    try
    {
        const data: unknown = await request.json();

        return data !== null && typeof data === "object" && !Array.isArray(data)
            ? data as Record<string, unknown>
            : null;
    }
    catch
    {
        return null;
    }
}

function isPositiveId(value: unknown): value is number
{
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNullablePositiveInteger(value: unknown): value is number | null
{
    return value === null || isPositiveId(value);
}

function isNullableIsoDate(value: unknown): value is string | null
{
    if (value === null)
    {
        return true;
    }

    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getEnrollmentRecord(db: D1Database, enrollmentId: number): Promise<AdminEnrollmentRecord | null>
{
    return db.prepare(ST_GET_ADMIN_ENROLLMENT).bind(enrollmentId).first<AdminEnrollmentRecord>();
}

async function getEnrollableCourse(db: D1Database, courseId: number): Promise<EnrollmentCourseRecord | null>
{
    return db.prepare(ST_GET_ENROLLABLE_COURSE).bind(courseId).first<EnrollmentCourseRecord>();
}

async function hasActiveEnrollment(
    db: D1Database,
    studentId: number,
    academicYearId: number,
    excludedEnrollmentId: number | null
): Promise<boolean>
{
    const existing = await db
        .prepare(ST_CHECK_ACTIVE_YEAR_ENROLLMENT)
        .bind(studentId, academicYearId, excludedEnrollmentId, excludedEnrollmentId)
        .first<{ id: number }>();

    return existing !== null;
}

async function isNumberAssigned(
    db: D1Database,
    courseId: number,
    number: number,
    excludedEnrollmentId: number | null
): Promise<boolean>
{
    const existing = await db
        .prepare(ST_CHECK_ENROLLMENT_NUMBER)
        .bind(courseId, number, excludedEnrollmentId, excludedEnrollmentId)
        .first<{ id: number }>();

    return existing !== null;
}

function toEnrollmentResponse(record: AdminEnrollmentRecord)
{
    const { studentState, courseState, academicYearStatus, state, ...fields } = record;

    return { ...fields, active: state === "ACTIVE" };
}

function enrollmentWriteError(error: unknown): Response
{
    const message = error instanceof Error ? error.message : String(error);

    if (
        message.includes("SQLITE_CONSTRAINT") ||
        message.includes("UNIQUE constraint failed") ||
        message.includes("student_already_enrolled_in_academic_year")
    )
    {
        return jsonResponse(RESPONSE_ENROLLMENT_CONFLICT, 409);
    }

    console.error("Unable to save enrollment:", error);
    return jsonResponse(RESPONSE_ENROLLMENT_WRITE_FAILED, 500);
}
