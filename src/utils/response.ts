// attendance-api/src/utils/response.ts

const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json; charset=utf-8" };
export const RESPONSE_SUCCESS = { success: true } as const;
export const RESPONSE_ERROR = { success: false } as const;
export const RESPONSE_NOT_FOUND = { success: false, message: "Not found" } as const;
export const RESPONSE_UNAUTHORIZED = { success: false, message: "Unauthorized" } as const;
export const RESPONSE_FORBIDDEN = { success: false, message: "Forbidden"} as const;
export const RESPONSE_INVALID_JSON = { success: false, message: "Invalid JSON" } as const;
export const RESPONSE_EMPTY_LOGIN = { success: false, message: "Username and password are required" } as const;
/*
export const RESPONSE_INACTIVE_USER = {success: false, message: "This user has been deactivated"} as const;
export const RESPONSE_INVALID_USER= {success: false, message: "Invalid username"} as const;
export const RESPONSE_INVALID_PASSWORD = {success: false, message: "Wrong password"} as const;
*/
export const RESPONSE_INVALID_LOGIN = {success: false, message: "Invalid username or password"} as const;
export const RESPONSE_INACTIVE_USER = RESPONSE_INVALID_LOGIN;
export const RESPONSE_INVALID_USER = RESPONSE_INVALID_LOGIN;
export const RESPONSE_INVALID_PASSWORD = RESPONSE_INVALID_LOGIN;
export const RESPONSE_SESSION_CLOSED = { success: true, message: "Session closed successfully" } as const;
export const RESPONSE_API_OK = { success: true, service: "attendance-api" }
export const RESPONSE_REQUIRED_FIELDS = {success: false, message: "Missing required fields"} as const;
export const RESPONSE_PASSWORD_TOO_SHORT = { success: false, message: "Password must contain at least 12 characters" } as const;
export const RESPONSE_INVALID_ROLE = { success: false, message: "Invalid role"} as const;
export const RESPONSE_USERNAME_EXISTS = { success: false, message: "Username already exists"} as const;
export const RESPONSE_ROLE_NOT_FOUND = { success: false, message: "Role was not found"} as const;
export const RESPONSE_CREATE_USER_FAILED = { success: false, message: "Unable to create user"} as const;
export const RESPONSE_INVALID_USER_ID = { success: false, message: "Invalid user id"} as const;
export const RESPONSE_USER_NOT_FOUND = { success: false, message: "User not found"} as const;
export const RESPONSE_INVALID_PERMISSION_ROLE = { success: false, message: "Course permissions cannot be assigned to this role"} as const;
export const RESPONSE_INVALID_PERMISSIONS = { success: false, message: "Permissions must be an array"} as const;
export const RESPONSE_DUPLICATE_COURSE = { success: false, message: "A course cannot appear more than once"} as const;
export const RESPONSE_INVALID_PERMISSION_VALUES = { success: false, message: "Invalid permission values" } as const;
export const RESPONSE_INVALID_COURSES = { success: false, message: "One or more courses are invalid" } as const;
export const RESPONSE_PERMISSIONS_UPDATED = { success: true, message: "Permissions updated successfully" } as const;
export const RESPONSE_USER_UPDATED = { success: true, message: "User updated successfully"} as const;
export const RESPONSE_PASSWORD_UPDATED = { success: true, message: "Password updated successfully"} as const;
export const RESPONSE_CANNOT_MODIFY_SELF = { success: false, message: "This operation cannot be performed on the current user"} as const;
export const RESPONSE_ACADEMIC_YEAR_NOT_FOUND = { success: false, message: "Active academic year not found"} as const;
export const RESPONSE_INVALID_COURSE_LEVEL = { success: false, message: "Invalid course level" } as const;
export const RESPONSE_INVALID_COURSE_LETTER = { success: false, message: "Invalid course letter" } as const;
export const RESPONSE_INVALID_COURSE_ID = { success: false, message: "Invalid course id"} as const;
export const RESPONSE_COURSE_EXISTS = { success: false, message: "Course already exists" } as const;
export const RESPONSE_COURSE_NOT_FOUND = { success: false, message: "Course not found" } as const;
export const RESPONSE_COURSE_CREATED = { success: true, message: "Course created successfully" } as const;
export const RESPONSE_COURSE_UPDATED = { success: true, message: "Course updated successfully" } as const;
export const RESPONSE_STUDENT_NOT_FOUND = { success: false, message: "Student not found"} as const;
export const RESPONSE_STUDENT_CODE_FAILED = { success: false, message: "Unable to generate student code"} as const;
export const RESPONSE_STUDENT_CREATED = { success: true, message: "Student created successfully"} as const;
export const RESPONSE_STUDENT_UPDATED = { success: true, message: "Student updated successfully"} as const;
export const RESPONSE_INVALID_STUDENT_ID = { success: false, message: "Invalid student id"} as const;
export function jsonResponse(data: unknown, status = 200): Response { return new Response(JSON.stringify(data), {status, headers: JSON_HEADERS}); }