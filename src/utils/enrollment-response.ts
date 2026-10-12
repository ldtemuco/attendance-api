export const RESPONSE_INVALID_ENROLLMENT_ID =
    { success: false, message: "Invalid enrollment id" } as const;

export const RESPONSE_ENROLLMENT_NOT_FOUND =
    { success: false, message: "Enrollment not found" } as const;

export const RESPONSE_ENROLLMENT_EXISTS =
    { success: false, message: "Student is already enrolled in this course" } as const;

export const RESPONSE_ALREADY_ENROLLED_THIS_YEAR =
    { success: false, message: "Student already has an active enrollment for this academic year" } as const;

export const RESPONSE_ENROLLMENT_NUMBER_EXISTS =
    { success: false, message: "Enrollment number already belongs to another student in this course" } as const;

export const RESPONSE_ENROLLMENT_CONFLICT =
    { success: false, message: "Enrollment conflicts with an existing record" } as const;

export const RESPONSE_INVALID_ENROLLMENT_NUMBER =
    { success: false, message: "Invalid enrollment number" } as const;

export const RESPONSE_INVALID_ENROLLMENT_DATE =
    { success: false, message: "Invalid enrollment date or discharge date" } as const;

export const RESPONSE_INVALID_ENROLLMENT_FILTER =
    { success: false, message: "Invalid enrollment filter" } as const;

export const RESPONSE_ACADEMIC_YEAR_CLOSED_FOR_ENROLLMENT =
    { success: false, message: "Cannot modify enrollment from a closed academic year" } as const;

export const RESPONSE_ENROLLMENT_CREATED =
    { success: true, message: "Enrollment created successfully" } as const;

export const RESPONSE_ENROLLMENT_UPDATED =
    { success: true, message: "Enrollment updated successfully" } as const;

export const RESPONSE_ENROLLMENT_WRITE_FAILED =
    { success: false, message: "Unable to save enrollment" } as const;
