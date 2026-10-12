INSERT INTO academic_years (
    year,
    status
)
VALUES (
    2026,
    'ACTIVE'
);
INSERT INTO roles (
    name,
    description
)
VALUES
    (
        'ADMIN',
        'Administrador del sistema con acceso completo a todas las funcionalidades'
    ),
    (
        'COORDINATOR',
        'Puede gestionar la asistencia y los cursos asignados'
    ),
    (
        'INSPECTOR',
        'Puede registrar y revisar la asistencia para los cursos asignados'
    );