const ST_PERIOD_COLUMNS =
`
    SELECT
        ap.id,
        ap.course_id AS courseId,
        c.name AS courseName,
        c.state AS courseState,
        ap.year,
        ay.status AS academicYearStatus,
        ap.month,
        ap.date_start AS dateStart,
        ap.date_end AS dateEnd,
        ap.state,
        ap.closed_by AS closedBy,
        ap.closed_at AS closedAt,
        ap.created_at AS createdAt,
        ap.updated_at AS updatedAt,
        (
            SELECT COUNT(*)
            FROM attendances AS a
            WHERE a.attendance_period_id = ap.id
        ) AS attendanceCount

    FROM attendance_periods AS ap

    INNER JOIN courses AS c
        ON c.id = ap.course_id

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id
`;

export const ST_GET_ATTENDANCE_PERIODS =
`
    ${ST_PERIOD_COLUMNS}

    WHERE ap.year = ?
      AND (? IS NULL OR ap.course_id = ?)
      AND (? IS NULL OR ap.state = ?)

    ORDER BY c.level, c.letter, ap.month
`;

export const ST_GET_ATTENDANCE_PERIOD =
`
    ${ST_PERIOD_COLUMNS}

    WHERE ap.id = ?

    LIMIT 1
`;

export const ST_GET_ACTIVE_YEAR_FOR_PERIODS =
`
    SELECT id, year

    FROM academic_years

    WHERE status = 'ACTIVE'

    ORDER BY year DESC

    LIMIT 1
`;

export const ST_GET_ACTIVE_COURSE_FOR_PERIODS =
`
    SELECT c.id, ay.year

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE c.id = ?
      AND c.state = 'ACTIVE'
      AND ay.status = 'ACTIVE'

    LIMIT 1
`;

export const ST_GET_PERIOD_BY_COURSE_AND_MONTH =
`
    SELECT id

    FROM attendance_periods

    WHERE course_id = ?
      AND year = ?
      AND month = ?

    LIMIT 1
`;

export const ST_CREATE_ATTENDANCE_PERIOD =
`
    INSERT INTO attendance_periods
    (
        course_id, year, month, date_start, date_end, state
    )
    SELECT c.id, ay.year, ?, ?, ?, 'OPEN'

    FROM courses AS c

    INNER JOIN academic_years AS ay
        ON ay.id = c.academic_year_id

    WHERE c.id = ?
      AND c.state = 'ACTIVE'
      AND ay.status = 'ACTIVE'
`;

export const ST_UPDATE_ATTENDANCE_PERIOD_DATES =
`
    UPDATE attendance_periods

    SET date_start = ?,
        date_end = ?,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
      AND state = 'OPEN'
      AND EXISTS
      (
          SELECT 1
          FROM courses AS c
          INNER JOIN academic_years AS ay
              ON ay.id = c.academic_year_id
          WHERE c.id = attendance_periods.course_id
            AND c.state = 'ACTIVE'
            AND ay.status = 'ACTIVE'
      )
      AND NOT EXISTS
      (
          SELECT 1
          FROM attendances AS a
          WHERE a.attendance_period_id = attendance_periods.id
            AND (a.date < ? OR a.date > ?)
      )
`;

export const ST_CLOSE_ATTENDANCE_PERIOD =
`
    UPDATE attendance_periods

    SET state = 'CLOSED',
        closed_by = ?,
        closed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
      AND state = 'OPEN'
      AND EXISTS
      (
          SELECT 1
          FROM courses AS c
          INNER JOIN academic_years AS ay
              ON ay.id = c.academic_year_id
          WHERE c.id = attendance_periods.course_id
            AND ay.status = 'ACTIVE'
      )
`;

export const ST_REOPEN_ATTENDANCE_PERIOD =
`
    UPDATE attendance_periods

    SET state = 'OPEN',
        closed_by = NULL,
        closed_at = NULL,
        updated_at = CURRENT_TIMESTAMP

    WHERE id = ?
      AND state = 'CLOSED'
      AND EXISTS
      (
          SELECT 1
          FROM courses AS c
          INNER JOIN academic_years AS ay
              ON ay.id = c.academic_year_id
          WHERE c.id = attendance_periods.course_id
            AND c.state = 'ACTIVE'
            AND ay.status = 'ACTIVE'
      )
`;
