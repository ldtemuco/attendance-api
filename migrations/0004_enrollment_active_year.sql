-- Una matrícula activa por estudiante y año académico.
-- No se agrega academic_year_id a enrollments: se obtiene desde courses.
-- Estos triggers resuelven conflictos incluso con solicitudes concurrentes.

CREATE TRIGGER trg_enrollments_single_active_year_insert
BEFORE INSERT ON enrollments
WHEN NEW.state = 'ACTIVE'
BEGIN
    SELECT RAISE(ABORT, 'student_already_enrolled_in_academic_year')
    WHERE EXISTS
    (
        SELECT 1
        FROM enrollments AS e
        INNER JOIN courses AS previous_course
            ON previous_course.id = e.course_id
        INNER JOIN courses AS requested_course
            ON requested_course.id = NEW.course_id
        WHERE e.student_id = NEW.student_id
          AND e.state = 'ACTIVE'
          AND previous_course.academic_year_id = requested_course.academic_year_id
    );
END;

CREATE TRIGGER trg_enrollments_single_active_year_update
BEFORE UPDATE OF student_id, course_id, state ON enrollments
WHEN NEW.state = 'ACTIVE'
BEGIN
    SELECT RAISE(ABORT, 'student_already_enrolled_in_academic_year')
    WHERE EXISTS
    (
        SELECT 1
        FROM enrollments AS e
        INNER JOIN courses AS previous_course
            ON previous_course.id = e.course_id
        INNER JOIN courses AS requested_course
            ON requested_course.id = NEW.course_id
        WHERE e.student_id = NEW.student_id
          AND e.state = 'ACTIVE'
          AND e.id <> OLD.id
          AND previous_course.academic_year_id = requested_course.academic_year_id
    );
END;
