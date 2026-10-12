// attendance-api/src/routes/courses.routes.ts

import type 
{ 
    Env 
} 
from "../types/env";
//--------------------------------------------------------------------------------------------------
import type 
{ 
    CourseRecord 
} 
from "../types/course";
//--------------------------------------------------------------------------------------------------
import 
{ 
    authenticate 
} 
from "../security/auth";
//--------------------------------------------------------------------------------------------------
import 
{ 
    ST_GET_COURSES,
    ST_GET_ACCESSIBLE_COURSES
} 
from "../queries/courses.queries";
//--------------------------------------------------------------------------------------------------
import 
{ 
    jsonResponse,
    RESPONSE_SUCCESS
} 
from "../utils/response";
//--------------------------------------------------------------------------------------------------

const PATH_COURSES = "/api/courses";

export async function handleCourseRoutes(request: Request, env: Env, url: URL): Promise<Response | null> 
{
    if (request.method === "GET" && url.pathname === PATH_COURSES) 
    {
        return getCourses(request, env);
    }
    return null;
}

async function getCourses(request: Request, env: Env): Promise<Response> 
{
    const auth = await authenticate(request, env.DB);

    if (!auth.authenticated) 
    {
        return auth.response;
    }

    if (auth.user.role === "ADMIN") 
    {

        const result = await env.DB.prepare(ST_GET_COURSES).all<CourseRecord>();
        return jsonResponse({...RESPONSE_SUCCESS, courses: result.results});

    }

    const result = await env.DB.prepare(ST_GET_ACCESSIBLE_COURSES).bind(auth.user.id).all<CourseRecord>();
    return jsonResponse({...RESPONSE_SUCCESS, courses: result.results});    
}