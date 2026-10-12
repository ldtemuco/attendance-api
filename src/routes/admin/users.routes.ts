// attendance-api/src/routes/admin/users.routes.ts

import type
{
    Env
}
from "../../types/env";
//--------------------------------------------------------------------------------------------------
import type
{
    CreateUserRequest,
    UpdateUserRequest,
    ChangePasswordRequest,
    RoleRecord,
    AdminUserRecord
}
from "../../types/user";
//--------------------------------------------------------------------------------------------------
import
{
    jsonResponse,
    RESPONSE_SUCCESS,
    RESPONSE_FORBIDDEN,
    RESPONSE_INVALID_JSON,
    RESPONSE_REQUIRED_FIELDS,
    RESPONSE_PASSWORD_TOO_SHORT,
    RESPONSE_INVALID_ROLE,
    RESPONSE_USERNAME_EXISTS,
    RESPONSE_ROLE_NOT_FOUND,
    RESPONSE_CREATE_USER_FAILED,
    RESPONSE_INVALID_USER_ID,
    RESPONSE_USER_NOT_FOUND,
    RESPONSE_CANNOT_MODIFY_SELF,
    RESPONSE_USER_UPDATED,
    RESPONSE_PASSWORD_UPDATED
}
from "../../utils/response";
//--------------------------------------------------------------------------------------------------
import
{
    ST_GET_USERS,
    ST_CHECK_USERNAME,
    ST_GET_ROLE,
    ST_CREATE_STAFF,
    ST_CREATE_USER,
    ST_DELETE_STAFF,
    ST_GET_USER,
    ST_CHECK_USERNAME_EXCEPT_USER,
    ST_UPDATE_STAFF,
    ST_UPDATE_USER,
    ST_REVOKE_USER_SESSIONS,
    ST_UPDATE_PASSWORD

}
from "../../queries/admin/users.queries";
//--------------------------------------------------------------------------------------------------
import
{
    authenticate
}
from "../../security/auth";
//--------------------------------------------------------------------------------------------------
import
{
    hashPassword
}
from "../../security/password";
//--------------------------------------------------------------------------------------------------


const PATH_USERS = "/api/admin/users";

const PATH_USER = /^\/api\/admin\/users\/(\d+)$/;

const PATH_USER_PASSWORD = /^\/api\/admin\/users\/(\d+)\/password$/;

const VALID_ROLES = [
    "ADMIN",
    "COORDINATOR",
    "INSPECTOR"
] as const;


//==================================================================================================
// ROUTER
//==================================================================================================

export async function handleAdminUserRoutes(request: Request, env: Env, url: URL): Promise<Response | null>
{
    if (request.method === "GET" && url.pathname === PATH_USERS)
    {
        return getUsers(request, env);
    }
    if (request.method === "POST" && url.pathname === PATH_USERS)
    {
        return createUser(request, env);
    }
    const passwordMatch = url.pathname.match(PATH_USER_PASSWORD);

    if (request.method === "PUT" && passwordMatch)
    {
        return changePassword(request, env, passwordMatch);
    }
    const userMatch = url.pathname.match(PATH_USER);

    if (request.method === "PUT" && userMatch)
    {
        return updateUser(request, env, userMatch);
    }
    return null;
}

//==================================================================================================
// GET USERS
//==================================================================================================

async function getUsers(request: Request, env: Env): Promise<Response>
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

    const result = await env.DB.prepare(ST_GET_USERS).all<AdminUserRecord>();

    const users = result.results.map(
        user =>
        ({
            id: user.id,
            staffId: user.staffId,

            username: user.username,
            active: user.active === 1,
            lastAccess: user.lastAccess,

            role: user.role,

            firstNames: user.firstNames,
            paternalLastName: user.paternalLastName,
            maternalLastName: user.maternalLastName,

            staffState: user.staffState
        })
    );

    return jsonResponse({...RESPONSE_SUCCESS, users});
}


//==================================================================================================
// CREATE USER
//==================================================================================================

async function createUser(request: Request, env: Env): Promise<Response>
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

    let data: CreateUserRequest;

    try
    {
        data = await request.json<CreateUserRequest>();
    }
    catch
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }

    const firstNames = data.firstNames?.trim();
    const paternalLastName = data.paternalLastName?.trim();
    const maternalLastName = data.maternalLastName?.trim() || null;
    const username = data.username?.trim().toLowerCase();
    const password = data.password;
    const roleName = data.role?.trim().toUpperCase();

    if (!firstNames || !paternalLastName || !username || !password || !roleName)
    {
        return jsonResponse(RESPONSE_REQUIRED_FIELDS, 400);
    }

    if (password.length < 12)
    {
        return jsonResponse(RESPONSE_PASSWORD_TOO_SHORT, 400);
    }

    if (!VALID_ROLES.includes(roleName as typeof VALID_ROLES[number]))
    {
        return jsonResponse(RESPONSE_INVALID_ROLE, 400);
    }

    const existingUser = await env.DB.prepare(ST_CHECK_USERNAME).bind(username).first<{ id: number }>();

    if (existingUser)
    {
        return jsonResponse(RESPONSE_USERNAME_EXISTS, 409);
    }

    const role = await env.DB.prepare(ST_GET_ROLE).bind(roleName).first<RoleRecord>();

    if (!role)
    {
        return jsonResponse(RESPONSE_ROLE_NOT_FOUND, 400);
    }

    const passwordHash = await hashPassword(password);

    let staffId: number | null = null;

    try
    {
        const staffResult = await env.DB.prepare(ST_CREATE_STAFF).bind(firstNames,paternalLastName, maternalLastName)            .run();

        staffId = Number(staffResult.meta.last_row_id);

        if (!Number.isInteger(staffId) || staffId <= 0)
        {
            throw new Error( "Unable to obtain staff id");
        }

        const userResult = await env.DB.prepare(ST_CREATE_USER).bind(staffId, role.id, username, passwordHash).run();

        const userId = Number(userResult.meta.last_row_id);

        if (!Number.isInteger(userId) || userId <= 0)
        {
            throw new Error("Unable to obtain user id");
        }

        return createUserSuccessResponse(userId, staffId, username, role.name, firstNames, paternalLastName, maternalLastName);
    }
    catch (error)
    {
        if (staffId !== null)
        {
            try
            {
                await env.DB.prepare(ST_DELETE_STAFF).bind(staffId).run();
            }
            catch (cleanupError)
            {
                console.error("Unable to remove orphan staff:", cleanupError);
            }
        }

        console.error("Unable to create user:", error);

        return jsonResponse(RESPONSE_CREATE_USER_FAILED, 500);
    }
}

//==================================================================================================
// UPDATE USER
//==================================================================================================
async function updateUser(request: Request, env: Env, match: RegExpMatchArray): Promise<Response>
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

    const targetUser = await env.DB.prepare(ST_GET_USER).bind(userId).first<{id: number; staffId: number; username: string; active: number; role: string;}>();

    if (!targetUser)
    {
        return jsonResponse(RESPONSE_USER_NOT_FOUND, 404);
    }

    let data: UpdateUserRequest;

    try
    {
        data = await request.json<UpdateUserRequest>();
    }
    catch
    {
        return jsonResponse(
            RESPONSE_INVALID_JSON,
            400
        );
    }


    const firstNames = data.firstNames?.trim();
    const paternalLastName = data.paternalLastName?.trim();
    const maternalLastName = data.maternalLastName?.trim() || null;
    const username = data.username?.trim().toLowerCase();
    const roleName = data.role?.trim().toUpperCase();

    if 
    (
        !firstNames ||
        !paternalLastName ||
        !username ||
        !roleName ||
        typeof data.active !== "boolean"
    )
    {
        return jsonResponse(RESPONSE_REQUIRED_FIELDS, 400);
    }

    const validRoles =
    [
        "ADMIN",
        "COORDINATOR",
        "INSPECTOR"
    ];

    if (!validRoles.includes(roleName))
    {
        return jsonResponse(RESPONSE_INVALID_ROLE, 400 );
    }

    // Previene que el administrador deshabilite o degrade su propia cuenta.  
    if (
        userId === auth.user.id &&
        (
            data.active === false ||
            roleName !== "ADMIN"
        )
    )
    {
        return jsonResponse(RESPONSE_CANNOT_MODIFY_SELF, 400);
    }

    const existingUsername = await env.DB.prepare(ST_CHECK_USERNAME_EXCEPT_USER).bind(username, userId).first<{ id: number }>();

    if (existingUsername)
    {
        return jsonResponse(RESPONSE_USERNAME_EXISTS, 409);
    }

    const role = await env.DB.prepare(ST_GET_ROLE).bind(roleName).first<RoleRecord>();

    if (!role)
    {
        return jsonResponse(RESPONSE_ROLE_NOT_FOUND, 400);
    }

    const staffState = data.active ? "ACTIVE" : "INACTIVE";
    const statements: D1PreparedStatement[] =
    [
        env.DB
            .prepare(ST_UPDATE_STAFF)
            .bind(
                firstNames,
                paternalLastName,
                maternalLastName,
                staffState,
                targetUser.staffId
            ),

        env.DB
            .prepare(ST_UPDATE_USER)
            .bind(
                role.id,
                username,
                data.active ? 1 : 0,
                userId
            )
    ];


    // Un usuario marcado como inactivo debe perder inmediatamente todas sus sesiones activas.
    if (!data.active)
    {
        statements.push(env.DB.prepare(ST_REVOKE_USER_SESSIONS).bind(userId));
    }

    await env.DB.batch(statements);

    return jsonResponse(RESPONSE_USER_UPDATED);
}

//==================================================================================================
// CHANGE PASSWORD
//==================================================================================================
async function changePassword(request: Request, env: Env, match: RegExpMatchArray): Promise<Response>
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

    const targetUser = await env.DB.prepare(ST_GET_USER).bind(userId).first<{id: number;}>();

    if (!targetUser)
    {
        return jsonResponse(RESPONSE_USER_NOT_FOUND, 404);
    }

    let data: ChangePasswordRequest;

    try
    {
        data = await request.json<ChangePasswordRequest>();
    }
    catch
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);
    }
    const password = data.password;

    if (!password || password.length < 12)
    {
        return jsonResponse(RESPONSE_PASSWORD_TOO_SHORT, 400);
    }

    const passwordHash = await hashPassword(password);

    await env.DB.batch
    (
        [
            env.DB.prepare(ST_UPDATE_PASSWORD).bind(passwordHash,userId),
            env.DB.prepare(ST_REVOKE_USER_SESSIONS).bind(userId)
        ]
    );

    return jsonResponse(RESPONSE_PASSWORD_UPDATED);
}

//==================================================================================================
// RESPONSE
//==================================================================================================

function createUserSuccessResponse(userId: number, staffId: number, username: string, role: string, firstNames: string, paternalLastName: string, maternalLastName: string | null): Response
{
    const response =
    {
        ...RESPONSE_SUCCESS,
        user:
        {
            id: userId,
            staffId,
            username,
            role,
            firstNames,
            paternalLastName,
            maternalLastName
        }
    };

    return jsonResponse(response, 201);
}