// attendance-api/src/routes/admin/courses.routes.ts

import type
{
    Env
}
from "../../types/env";
//--------------------------------------------------------------------------------------------------
import type
{
    AdminCourseRecord,
    CreateCourseRequest,
    UpdateCourseRequest,
    AcademicYearRecord
}
from "../../types/course";
//--------------------------------------------------------------------------------------------------
import
{
    jsonResponse,
    RESPONSE_SUCCESS,
    RESPONSE_FORBIDDEN,
    RESPONSE_INVALID_JSON,
    RESPONSE_REQUIRED_FIELDS,
    RESPONSE_ACADEMIC_YEAR_NOT_FOUND,
    RESPONSE_INVALID_COURSE_LEVEL,
    RESPONSE_INVALID_COURSE_LETTER,
    RESPONSE_COURSE_EXISTS,
    RESPONSE_COURSE_NOT_FOUND,
    RESPONSE_COURSE_CREATED,
    RESPONSE_COURSE_UPDATED,
    RESPONSE_INVALID_COURSE_ID
}
from "../../utils/response";
//--------------------------------------------------------------------------------------------------
import
{
    ST_GET_ACTIVE_ACADEMIC_YEAR,
    ST_GET_ADMIN_COURSES,
    ST_GET_COURSE,
    ST_CHECK_COURSE,
    ST_CHECK_COURSE_EXCEPT_ID,
    ST_CREATE_COURSE,
    ST_UPDATE_COURSE
}
from "../../queries/admin/courses.queries";
//--------------------------------------------------------------------------------------------------
import
{
    authenticate
}
from "../../security/auth";
//--------------------------------------------------------------------------------------------------


const PATH_COURSES =
    "/api/admin/courses";

const PATH_COURSE =
    /^\/api\/admin\/courses\/(\d+)$/;


//==================================================================================================
// ROUTER
//==================================================================================================

export async function handleAdminCourseRoutes(request: Request, env: Env, url: URL): Promise<Response | null>
{
    if (request.method === "GET" && url.pathname === PATH_COURSES)
    {
        return getCourses(request, env);
    }

    if (request.method === "POST" && url.pathname === PATH_COURSES)
    {
        return createCourse(request, env);
    }

    const courseMatch = url.pathname.match(PATH_COURSE);

    if (request.method === "PUT" && courseMatch)
    {
        return updateCourse(request, env, courseMatch);
    }

    return null;
}

//==================================================================================================
// GET COURSES
//==================================================================================================

async function getCourses(request: Request, env: Env): Promise<Response>
{
    const auth = await authenticate(request, env.DB);

    if (!auth.authenticated)
    {
        return auth.response;
    }

    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(RESPONSE_FORBIDDEN, 403);
    }

    const result = await env.DB.prepare(ST_GET_ADMIN_COURSES).all<AdminCourseRecord>();

    const courses = result.results.map
    (
        course =>
        ({
            id: course.id,
            academicYearId: course.academicYearId,
            year: course.year,
            level: course.level,
            letter: course.letter,
            name: course.name,
            active: course.state === "ACTIVE"
        })
    );

    return jsonResponse({...RESPONSE_SUCCESS, courses});
}

//==================================================================================================
// CREATE COURSE
//==================================================================================================

async function createCourse(request: Request, env: Env): Promise<Response>
{
    const auth = await authenticate(request, env.DB);

    if (!auth.authenticated)
    {
        return auth.response;
    }

    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(RESPONSE_FORBIDDEN, 403);
    }

    let data: CreateCourseRequest;

    try
    {
        data = await request.json<CreateCourseRequest>();
    }
    catch
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const level = Number(data.level);
    const letter = data.letter?.trim().toUpperCase();

    const validationResponse = validateCourse(level, letter);

    if (validationResponse)
    {
        return validationResponse;
    }

    const academicYear = await env.DB.prepare(ST_GET_ACTIVE_ACADEMIC_YEAR).first<AcademicYearRecord>();

    if (!academicYear)
    {
        return jsonResponse(RESPONSE_ACADEMIC_YEAR_NOT_FOUND, 409);
    }

    const existingCourse = await env.DB.prepare(ST_CHECK_COURSE).bind(academicYear.id, level, letter).first<{ id: number }>();

    if (existingCourse)
    {
        return jsonResponse(RESPONSE_COURSE_EXISTS, 409);
    }

    const name = buildCourseName(level, letter);

    const result = await env.DB.prepare(ST_CREATE_COURSE).bind(academicYear.id, level, letter, name).run();

    const courseId = Number(result.meta.last_row_id);

    return jsonResponse
    (
        {
            ...RESPONSE_COURSE_CREATED,
            course:
            {
                id: courseId,
                academicYearId: academicYear.id,
                year: academicYear.year,
                level,
                letter,
                name,
                active: true
            }
        },
        201
    );
}

//==================================================================================================
// UPDATE COURSE
//==================================================================================================

async function updateCourse(request: Request, env: Env, match: RegExpMatchArray): Promise<Response>
{
    const auth = await authenticate(request, env.DB);


    if (!auth.authenticated)
    {
        return auth.response;
    }

    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(RESPONSE_FORBIDDEN, 403);
    }

    const courseId = Number(match[1]);

    if (!Number.isInteger(courseId) || courseId <= 0)
    {
        return jsonResponse(RESPONSE_INVALID_COURSE_ID, 400);
    }

    const course = await env.DB.prepare(ST_GET_COURSE).bind(courseId).first<AdminCourseRecord>();

    if (!course)
    {
        return jsonResponse(RESPONSE_COURSE_NOT_FOUND, 404);
    }

    let data: UpdateCourseRequest;

    try
    {
        data = await request.json<UpdateCourseRequest>();
    }
    catch
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const level = Number(data.level);

    const letter = data.letter?.trim().toUpperCase();

    const validationResponse = validateCourse(level, letter);

    if (validationResponse)
    {
        return validationResponse;
    }

    if (typeof data.active !== "boolean")
    {
        return jsonResponse(RESPONSE_REQUIRED_FIELDS, 400);
    }

    const existingCourse = await env.DB.prepare(ST_CHECK_COURSE_EXCEPT_ID).bind(course.academicYearId, level, letter, courseId).first<{ id: number }>();

    if (existingCourse)
    {
        return jsonResponse(RESPONSE_COURSE_EXISTS, 409);
    }

    const name = buildCourseName(level, letter);

    const state = data.active ? "ACTIVE" : "INACTIVE";

    await env.DB.prepare(ST_UPDATE_COURSE).bind(level, letter, name, state, courseId).run();

    return jsonResponse(RESPONSE_COURSE_UPDATED);
}

//==================================================================================================
// VALIDATION
//==================================================================================================

function validateCourse(level: number, letter: string | undefined): Response | null
{
    if (!Number.isInteger(level) || level <= 0)
    {
        return jsonResponse(RESPONSE_INVALID_COURSE_LEVEL, 400);
    }

    if (!letter || !/^[A-Z]$/.test(letter))
    {
        return jsonResponse(RESPONSE_INVALID_COURSE_LETTER, 400);
    }

    return null;
}


//==================================================================================================
// COURSE NAME
//==================================================================================================

function buildCourseName(level: number, letter: string): string
{
    return `${level}°${letter}`;
}