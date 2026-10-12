// attendance-api/src/routes/auth.routes.ts

import type 
{ 
    Env 
} 
from "../types/env";
//--------------------------------------------------------------------------------------------------
import type 
{ 
    LoginRequest,
    UserRecord 
} 
from "../types/auth";
//--------------------------------------------------------------------------------------------------
import 
{ 
    jsonResponse, 
    RESPONSE_EMPTY_LOGIN,
    RESPONSE_INVALID_USER, 
    RESPONSE_INVALID_PASSWORD,
    RESPONSE_INACTIVE_USER,
    RESPONSE_INVALID_JSON,
    RESPONSE_SESSION_CLOSED,
    RESPONSE_SUCCESS
} 
from "../utils/response";
//--------------------------------------------------------------------------------------------------
import 
{ 
    ST_GET_LOGIN_DATA,
    ST_DELETE_EXPIRED_SESSIONS,
    ST_CREATE_SESSION,
    ST_UPDATE_LAST_ACCESS,
    ST_REVOKE_SESSION
} 
from "../queries/auth.queries";
//--------------------------------------------------------------------------------------------------
import 
{ 
    verifyPassword 
} 
from "../security/password";
//--------------------------------------------------------------------------------------------------
import 
{ 
    authenticate 
} 
from "../security/auth";
//--------------------------------------------------------------------------------------------------
import 
{ 
    generateSessionToken, 
    hashSessionToken 
} 
from "../security/session";
//--------------------------------------------------------------------------------------------------

const SESSION_DURATION_SECONDS: number = 12 * 60 * 60;

const PATH_ME = "/api/auth/me";
const PATH_LOGIN = "/api/auth/login";
const PATH_LOGOUT = "/api/auth/logout";

export async function handleAuthRoutes(request: Request, env: Env, url: URL): Promise<Response | null> 
{
    if (request.method === "POST" && url.pathname === PATH_LOGIN)
    {
        return login(request, env);
    }

    if (request.method === "GET" && url.pathname === PATH_ME) 
    {
        return currentUser(request, env);
    }

    if (request.method === "POST" && url.pathname === PATH_LOGOUT) 
    {
        return logout(request, env);
    }

    return null;
}

function loginSuccessResponse(user: UserRecord, token: string, expiresAt: number): Response 
{
    const response = 
    {
        success: true,
        token,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        user: 
        {
            id: user.id,
            username: user.username,
            firstNames: user.first_names,
            paternalLastName: user.paternal_last_name,
            maternalLastName: user.maternal_last_name,
            role:user.role
        }
    }

    return jsonResponse(response);
}


async function login(request: Request, env: Env): Promise<Response> 
{    
      
    let data: LoginRequest;    
    try 
    {
        data = await request.json<LoginRequest>();
    }
    catch 
    {
        return jsonResponse(RESPONSE_INVALID_JSON, 400);            
    }
    
    const username = data.username?.trim().toLowerCase();
    const password = data.password;

    if (!username || !password) 
    {
        return jsonResponse(RESPONSE_EMPTY_LOGIN, 400);              
    }

    const user = await env.DB.prepare(ST_GET_LOGIN_DATA).bind(username).first<UserRecord>();
    
    if (!user) 
    {
        return jsonResponse(RESPONSE_INVALID_USER, 401);
    }

    if (user.active !== 1) 
    {
        return jsonResponse(RESPONSE_INACTIVE_USER, 401);                
    }
    
    const validPassword = await verifyPassword(password, user.password_hash);
    
    if (!validPassword) 
    {
        return jsonResponse(RESPONSE_INVALID_PASSWORD, 401);  
    }

  
    
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(ST_DELETE_EXPIRED_SESSIONS).bind(now).run();
    

    
    const token = generateSessionToken();    
    const tokenHash = await hashSessionToken(token);
    const expiresAt = now + SESSION_DURATION_SECONDS;
    
    await env.DB.prepare(ST_CREATE_SESSION).bind(user.id, tokenHash, expiresAt).run();    
    await env.DB.prepare(ST_UPDATE_LAST_ACCESS).bind(user.id).run();

    return loginSuccessResponse(user, token, expiresAt);
        
}

async function currentUser(request: Request, env: Env): Promise<Response> 
{

    const auth = await authenticate(request, env.DB);

    if (!auth.authenticated) 
    {
        return auth.response;
    }

    return jsonResponse({...RESPONSE_SUCCESS, user: auth.user});
}

async function logout(request: Request, env: Env): Promise<Response> 
{
    const auth = await authenticate(request, env.DB);

    if (!auth.authenticated) 
    {
        return auth.response;
    }
    await env.DB.prepare(ST_REVOKE_SESSION).bind(auth.sessionId).run();

    return jsonResponse(RESPONSE_SESSION_CLOSED);
}