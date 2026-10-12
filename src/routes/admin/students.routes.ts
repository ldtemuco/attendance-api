import type
{
    Env
}
from "../../types/env";
//--------------------------------------------------------------------------------------------------
import type
{
    AdminStudentRecord,
    CreateStudentRequest,
    UpdateStudentRequest
}
from "../../types/student";
//--------------------------------------------------------------------------------------------------
import
{
    jsonResponse,
    RESPONSE_SUCCESS,
    RESPONSE_FORBIDDEN,
    RESPONSE_INVALID_JSON,
    RESPONSE_REQUIRED_FIELDS,
    RESPONSE_INVALID_STUDENT_ID,
    RESPONSE_STUDENT_NOT_FOUND,
    RESPONSE_STUDENT_CODE_FAILED,
    RESPONSE_STUDENT_CREATED,
    RESPONSE_STUDENT_UPDATED
}
from "../../utils/response";
//--------------------------------------------------------------------------------------------------
import
{
    ST_GET_STUDENTS,
    ST_GET_STUDENT,
    ST_CREATE_STUDENT,
    ST_UPDATE_STUDENT
}
from "../../queries/admin/students.queries";
//--------------------------------------------------------------------------------------------------
import
{
    authenticate
}
from "../../security/auth";
//--------------------------------------------------------------------------------------------------
import
{
    generateStudentCode
}
from "../../services/student-code";
//--------------------------------------------------------------------------------------------------


const PATH_STUDENTS =
    "/api/admin/students";

const PATH_STUDENT =
    /^\/api\/admin\/students\/(\d+)$/;


//==================================================================================================
// ROUTER
//==================================================================================================

export async function handleAdminStudentRoutes(
    request: Request,
    env: Env,
    url: URL
): Promise<Response | null>
{
    if (
        request.method === "GET" &&
        url.pathname === PATH_STUDENTS
    )
    {
        return getStudents(
            request,
            env
        );
    }


    if (
        request.method === "POST" &&
        url.pathname === PATH_STUDENTS
    )
    {
        return createStudent(
            request,
            env
        );
    }


    const studentMatch =
        url.pathname.match(PATH_STUDENT);


    if (
        request.method === "PUT" &&
        studentMatch
    )
    {
        return updateStudent(
            request,
            env,
            studentMatch
        );
    }


    return null;
}


//==================================================================================================
// GET STUDENTS
//==================================================================================================

async function getStudents(
    request: Request,
    env: Env
): Promise<Response>
{
    const auth =
        await authenticate(
            request,
            env.DB
        );


    if (!auth.authenticated)
    {
        return auth.response;
    }


    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(
            RESPONSE_FORBIDDEN,
            403
        );
    }


    const result = await env.DB
        .prepare(ST_GET_STUDENTS)
        .all<AdminStudentRecord>();


    const students = result.results.map(
        student =>
        ({
            ...student,

            active:
                student.state === "ACTIVE"
        })
    );


    return jsonResponse(
        {
            ...RESPONSE_SUCCESS,
            students
        }
    );
}


//==================================================================================================
// CREATE STUDENT
//==================================================================================================

async function createStudent(
    request: Request,
    env: Env
): Promise<Response>
{
    const auth =
        await authenticate(
            request,
            env.DB
        );


    if (!auth.authenticated)
    {
        return auth.response;
    }


    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(
            RESPONSE_FORBIDDEN,
            403
        );
    }


    let data: CreateStudentRequest;


    try
    {
        data =
            await request.json<CreateStudentRequest>();
    }
    catch
    {
        return jsonResponse(
            RESPONSE_INVALID_JSON,
            400
        );
    }


    const firstNames =
        data.firstNames?.trim();

    const paternalLastName =
        data.paternalLastName?.trim();

    const maternalLastName =
        data.maternalLastName?.trim() || null;


    if (
        !firstNames ||
        !paternalLastName
    )
    {
        return jsonResponse(
            RESPONSE_REQUIRED_FIELDS,
            400
        );
    }


    const studentCode =
        await generateStudentCode(
            env.DB
        );


    if (studentCode === null)
    {
        return jsonResponse(
            RESPONSE_STUDENT_CODE_FAILED,
            500
        );
    }


    const result = await env.DB
        .prepare(ST_CREATE_STUDENT)
        .bind(
            studentCode,
            firstNames,
            paternalLastName,
            maternalLastName
        )
        .run();


    const studentId =
        Number(result.meta.last_row_id);


    return jsonResponse(
        {
            ...RESPONSE_STUDENT_CREATED,

            student:
            {
                id: studentId,
                studentCode,

                firstNames,
                paternalLastName,
                maternalLastName,

                active: true
            }
        },
        201
    );
}


//==================================================================================================
// UPDATE STUDENT
//==================================================================================================

async function updateStudent(
    request: Request,
    env: Env,
    match: RegExpMatchArray
): Promise<Response>
{
    const auth =
        await authenticate(
            request,
            env.DB
        );


    if (!auth.authenticated)
    {
        return auth.response;
    }


    if (auth.user.role !== "ADMIN")
    {
        return jsonResponse(
            RESPONSE_FORBIDDEN,
            403
        );
    }


    const studentId =
        Number(match[1]);


    if (
        !Number.isInteger(studentId) ||
        studentId <= 0
    )
    {
        return jsonResponse(
            RESPONSE_INVALID_STUDENT_ID,
            400
        );
    }


    const student = await env.DB
        .prepare(ST_GET_STUDENT)
        .bind(studentId)
        .first<AdminStudentRecord>();


    if (!student)
    {
        return jsonResponse(
            RESPONSE_STUDENT_NOT_FOUND,
            404
        );
    }


    let data: UpdateStudentRequest;


    try
    {
        data =
            await request.json<UpdateStudentRequest>();
    }
    catch
    {
        return jsonResponse(
            RESPONSE_INVALID_JSON,
            400
        );
    }


    const firstNames =
        data.firstNames?.trim();

    const paternalLastName =
        data.paternalLastName?.trim();

    const maternalLastName =
        data.maternalLastName?.trim() || null;


    if (
        !firstNames ||
        !paternalLastName ||
        typeof data.active !== "boolean"
    )
    {
        return jsonResponse(
            RESPONSE_REQUIRED_FIELDS,
            400
        );
    }


    const state =
        data.active
            ? "ACTIVE"
            : "INACTIVE";


    await env.DB
        .prepare(ST_UPDATE_STUDENT)
        .bind(
            firstNames,
            paternalLastName,
            maternalLastName,
            state,
            studentId
        )
        .run();


    return jsonResponse(
        RESPONSE_STUDENT_UPDATED
    );
}