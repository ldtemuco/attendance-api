import type { Env } from "./types/env";

import
{
    handleAdminCourseRoutes
}
from "./routes/admin/courses.routes";

import
{
    handleAdminStudentRoutes
}
from "./routes/admin/students.routes";

import
{
    handleAdminEnrollmentRoutes
}
from "./routes/admin/enrollments.routes";

import
{
    handleAdminAttendancePeriodRoutes
}
from "./routes/admin/attendance-periods.routes";

import 
{
    handleAuthRoutes
} 
from "./routes/auth.routes";

import 
{
    handleCourseRoutes
} 
from "./routes/courses.routes";

import 
{
    handleAdminUserRoutes
} 
from "./routes/admin/users.routes";

import 
{
    handleAdminPermissionRoutes
} 
from "./routes/admin/permissions.routes";

import 
{
    jsonResponse,
	RESPONSE_API_OK,
    RESPONSE_NOT_FOUND
} 
from "./utils/response";

const PATH_HEALTH = "/health";

export default 
{
    async fetch(request: Request, env: Env): Promise<Response> 
	{
        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === PATH_HEALTH) 
		{
            return jsonResponse(RESPONSE_API_OK);
        }

        const handlers = 
		[
            handleAuthRoutes,
            handleCourseRoutes,
            handleAdminUserRoutes,
            handleAdminPermissionRoutes,
			handleAdminCourseRoutes,
			handleAdminStudentRoutes,
            handleAdminEnrollmentRoutes,
            handleAdminAttendancePeriodRoutes
        ];

        for (const handler of handlers)
		{
            const response = await handler( request, env, url);

            if (response !== null) 
			{
                return response;
            }
        }

        return jsonResponse(RESPONSE_NOT_FOUND, 404);
    }

} satisfies ExportedHandler<Env>;
