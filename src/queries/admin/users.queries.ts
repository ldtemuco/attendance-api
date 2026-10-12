// attendance-api/src/queries/admin/users.queries.ts

export const ST_CHECK_USERNAME =
`
    SELECT id
    FROM users
    WHERE username = ?
    LIMIT 1
`;


export const ST_GET_ROLE =
`
    SELECT
        id,
        name

    FROM roles

    WHERE name = ?

    LIMIT 1
`;


export const ST_CREATE_STAFF =
`
    INSERT INTO staff
    (
        first_names,
        paternal_last_name,
        maternal_last_name,
        state
    )
    VALUES (?, ?, ?, 'ACTIVE')
`;


export const ST_CREATE_USER =
`
    INSERT INTO users
    (
        staff_id,
        role_id,
        username,
        password_hash,
        active
    )
    VALUES (?, ?, ?, ?, 1)
`;


export const ST_DELETE_STAFF =
`
    DELETE FROM staff
    WHERE id = ?
`;

export const ST_GET_USERS =
`
    SELECT
        u.id,
        u.staff_id AS staffId,
        u.username,
        u.active,
        u.last_access AS lastAccess,

        r.name AS role,

        s.first_names AS firstNames,
        s.paternal_last_name AS paternalLastName,
        s.maternal_last_name AS maternalLastName,
        s.state AS staffState

    FROM users AS u

    INNER JOIN staff AS s
        ON s.id = u.staff_id

    INNER JOIN roles AS r
        ON r.id = u.role_id

    ORDER BY
        s.paternal_last_name,
        s.maternal_last_name,
        s.first_names
`;

export const ST_GET_USER =
`
    SELECT
        u.id,
        u.staff_id AS staffId,
        u.username,
        u.active,
        r.name AS role

    FROM users AS u

    INNER JOIN roles AS r
        ON r.id = u.role_id

    WHERE u.id = ?

    LIMIT 1
`;


export const ST_CHECK_USERNAME_EXCEPT_USER =
`
    SELECT id
    FROM users

    WHERE username = ?
      AND id <> ?

    LIMIT 1
`;


export const ST_UPDATE_STAFF =
`
    UPDATE staff

    SET
        first_names = ?,
        paternal_last_name = ?,
        maternal_last_name = ?,
        state = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
`;


export const ST_UPDATE_USER =
`
    UPDATE users

    SET
        role_id = ?,
        username = ?,
        active = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
`;


export const ST_UPDATE_PASSWORD =
`
    UPDATE users

    SET
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
`;


export const ST_REVOKE_USER_SESSIONS =
`
    UPDATE sessions

    SET revoked_at = CURRENT_TIMESTAMP

    WHERE user_id = ?
      AND revoked_at IS NULL
`;