// attendance-api/src/queries/auth.queries.ts

export const ST_GET_LOGIN_DATA = 
`
    SELECT
        u.id,
        u.username,
        u.password_hash,
        u.active,

        s.first_names,
        s.paternal_last_name,
        s.maternal_last_name,

        r.name AS role

    FROM users AS u

    INNER JOIN staff AS s
        ON s.id = u.staff_id

    INNER JOIN roles AS r
        ON r.id = u.role_id

    WHERE u.username = ?

    LIMIT 1
`;

export const ST_DELETE_EXPIRED_SESSIONS = `DELETE FROM sessions WHERE expires_at <= ?`;

export const ST_CREATE_SESSION = 
`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (?, ?, ?)
`;

export const ST_UPDATE_LAST_ACCESS = `UPDATE users SET last_access = CURRENT_TIMESTAMP WHERE id = ?`;
export const ST_REVOKE_SESSION = `UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?`;