import { hashSessionToken } from "./session";


export interface AuthenticatedUser {
    id: number;
    username: string;
    firstNames: string;
    paternalLastName: string;
    maternalLastName: string | null;
    role: string;
}


interface SessionRecord {
    session_id: number;
    user_id: number;
    username: string;

    first_names: string;
    paternal_last_name: string;
    maternal_last_name: string | null;

    role: string;
}


export type AuthResult =
    | {
        authenticated: true;
        sessionId: number;
        user: AuthenticatedUser;
    }
    | {
        authenticated: false;
        response: Response;
    };


function unauthorized(): Response {
    return Response.json(
        {
            success: false,
            message: "Unauthorized"
        },
        {
            status: 401
        }
    );
}


export async function authenticate(
    request: Request,
    db: D1Database
): Promise<AuthResult> {

    const authorization =
        request.headers.get("Authorization");

    if (!authorization) {
        return {
            authenticated: false,
            response: unauthorized()
        };
    }


    const [scheme, token] =
        authorization.split(" ");


    if (
        scheme !== "Bearer" ||
        !token
    ) {
        return {
            authenticated: false,
            response: unauthorized()
        };
    }


    const tokenHash =
        await hashSessionToken(token);


    const now =
        Math.floor(Date.now() / 1000);


    const session = await db
        .prepare(`
            SELECT
                se.id AS session_id,

                u.id AS user_id,
                u.username,

                st.first_names,
                st.paternal_last_name,
                st.maternal_last_name,

                r.name AS role

            FROM sessions AS se

            INNER JOIN users AS u
                ON u.id = se.user_id

            INNER JOIN staff AS st
                ON st.id = u.staff_id

            INNER JOIN roles AS r
                ON r.id = u.role_id

            WHERE se.token_hash = ?
              AND se.revoked_at IS NULL
              AND se.expires_at > ?
              AND u.active = 1
              AND st.state = 'ACTIVE'

            LIMIT 1
        `)
        .bind(
            tokenHash,
            now
        )
        .first<SessionRecord>();


    if (!session) {
        return {
            authenticated: false,
            response: unauthorized()
        };
    }


    await db
        .prepare(`
            UPDATE sessions
            SET last_used_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
        .bind(session.session_id)
        .run();


    return {
        authenticated: true,

        sessionId:
            session.session_id,

        user: {
            id:
                session.user_id,

            username:
                session.username,

            firstNames:
                session.first_names,

            paternalLastName:
                session.paternal_last_name,

            maternalLastName:
                session.maternal_last_name,

            role:
                session.role
        }
    };
}