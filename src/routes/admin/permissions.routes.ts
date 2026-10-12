// attendance-api/src/routes/admin/permissions.routes.ts

import type
{
    Env
}
from "../../types/env";
//--------------------------------------------------------------------------------------------------
import type
{
    UpdatePermissionsRequest,    
    UserPermissionRecord
}
from "../../types/user";
//--------------------------------------------------------------------------------------------------
import
{
    jsonResponse,
    RESPONSE_SUCCESS,
    RESPONSE_FORBIDDEN,
    RESPONSE_INVALID_JSON,
    RESPONSE_INVALID_USER_ID,
    RESPONSE_USER_NOT_FOUND,
    RESPONSE_INVALID_PERMISSION_ROLE,
    RESPONSE_INVALID_PERMISSIONS,
    RESPONSE_INVALID_COURSE_ID,
    RESPONSE_DUPLICATE_COURSE,
    RESPONSE_INVALID_PERMISSION_VALUES,
    RESPONSE_INVALID_COURSES,
    RESPONSE_PERMISSIONS_UPDATED
}
from "../../utils/response";
//--------------------------------------------------------------------------------------------------
import
{
    ST_GET_USER_ROLE,
    ST_DELETE_USER_PERMISSIONS,
    ST_CREATE_PERMISSION,
    ST_GET_USER_PERMISSIONS,
    getActiveCoursesStatement
}
from "../../queries/admin/permissions.queries";
//--------------------------------------------------------------------------------------------------
import
{
    authenticate
}
from "../../security/auth";
//--------------------------------------------------------------------------------------------------


const PATH_PERMISSIONS =
    /^\/api\/admin\/users\/(\d+)\/permissions$/;


//==================================================================================================
// ROUTER
//==================================================================================================

export async function handleAdminPermissionRoutes(request: Request, env: Env, url: URL): Promise<Response | null>
{
    const match = url.pathname.match(PATH_PERMISSIONS);

    if (!match)
    {
        return null;
    }

    if (request.method === "GET")
    {
        return getPermissions(request, env, match);
    }

    if (request.method === "PUT")
    {
        return updatePermissions(request, env, match);
    }

    return null;
}

//==================================================================================================
// GET PERMISSIONS
//==================================================================================================

async function getPermissions(request: Request, env: Env, match: RegExpMatchArray): Promise<Response>
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

    const userId = Number(match[1]);

    if (!Number.isInteger(userId) || userId <= 0)
    {
        return jsonResponse(RESPONSE_INVALID_USER_ID, 400);
    }

    const targetUser = await env.DB.prepare(ST_GET_USER_ROLE).bind(userId).first<{id: number; role: string;}>();

    if (!targetUser)
    {
        return jsonResponse(RESPONSE_USER_NOT_FOUND, 404);
    }

    const result = await env.DB.prepare(ST_GET_USER_PERMISSIONS).bind(userId).all<UserPermissionRecord>();

    const permissions = result.results.map(
        permission =>
        ({
            courseId: permission.courseId,

            level: permission.level,
            letter: permission.letter,
            name: permission.name,

            canRead:
                permission.canRead === 1,

            canWrite:
                permission.canWrite === 1,

            canEdit:
                permission.canEdit === 1,

            canDelete:
                permission.canDelete === 1
        })
    );

    return jsonResponse({...RESPONSE_SUCCESS, user:{ id: targetUser.id, role: targetUser.role }, permissions });
}

//==================================================================================================
// UPDATE PERMISSIONS
//==================================================================================================

async function updatePermissions(request: Request, env: Env, match: RegExpMatchArray): Promise<Response>
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

    const userId = Number(match[1]);

    if (!Number.isInteger(userId) || userId <= 0)
    {
        return jsonResponse(RESPONSE_INVALID_USER_ID, 400);
    }

    const targetUser = await env.DB.prepare(ST_GET_USER_ROLE).bind(userId).first<{id: number; role: string;}>();

    if (!targetUser)
    {
        return jsonResponse(RESPONSE_USER_NOT_FOUND, 404);
    }

    if (targetUser.role !== "INSPECTOR" && targetUser.role !== "COORDINATOR")
    {
        return jsonResponse(RESPONSE_INVALID_PERMISSION_ROLE, 400);
    }

    let data: UpdatePermissionsRequest;

    try
    {
        data = await request.json<UpdatePermissionsRequest>();
    }
    catch
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    if (!Array.isArray(data.permissions))
    {
        return jsonResponse(RESPONSE_INVALID_PERMISSIONS, 400);
    }

    const courseIds = new Set<number>();

    for (const permission of data.permissions)
    {
        if (!Number.isInteger(permission.courseId) || permission.courseId <= 0)
        {
            return jsonResponse(RESPONSE_INVALID_COURSE_ID, 400);
        }

        if (courseIds.has(permission.courseId))
        {
            return jsonResponse(RESPONSE_DUPLICATE_COURSE, 400);
        }

        courseIds.add(permission.courseId);

        if 
        (
            typeof permission.canRead !== "boolean" ||
            typeof permission.canWrite !== "boolean" ||
            typeof permission.canEdit !== "boolean" ||
            typeof permission.canDelete !== "boolean"
        )
        {
            return jsonResponse(RESPONSE_INVALID_PERMISSION_VALUES, 400);
        }
    }

    if (courseIds.size > 0)
    {
        const ids = Array.from(courseIds);

        const statement = getActiveCoursesStatement(ids.length);

        const result = await env.DB.prepare(statement).bind(...ids).all<{ id: number }>();

        if (result.results.length !== ids.length)
        {
            return jsonResponse(RESPONSE_INVALID_COURSES, 400);
        }
    }

    const statements: D1PreparedStatement[] =
    [
        env.DB.prepare(ST_DELETE_USER_PERMISSIONS).bind(userId)
    ];


    for (const permission of data.permissions)
    {
        statements.push(env.DB.prepare(ST_CREATE_PERMISSION).bind
        (
            userId,
            permission.courseId,
            permission.canRead ? 1 : 0,
            permission.canWrite ? 1 : 0,
            permission.canEdit ? 1 : 0,
            permission.canDelete ? 1 : 0
        ));
    }

    await env.DB.batch
    (
        statements
    );

    return jsonResponse(RESPONSE_PERMISSIONS_UPDATED);
}