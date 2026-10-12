export interface CreateUserRequest 
{
    firstNames: string;
    paternalLastName: string;
    maternalLastName?: string;
    username: string;
    password: string;
    role: "ADMIN" | "COORDINATOR" | "INSPECTOR";
}

export interface RoleRecord 
{
    id: number;
    name: string;
}

export interface CoursePermissionInput 
{
    courseId: number;
    canRead: boolean;
    canWrite: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export interface UpdatePermissionsRequest 
{
    permissions: CoursePermissionInput[];
}

export interface AdminUserRecord
{
    id: number;
    staffId: number;

    username: string;
    active: number;
    lastAccess: string | null;

    role: string;

    firstNames: string;
    paternalLastName: string;
    maternalLastName: string | null;

    staffState: string;
}


export interface UserPermissionRecord
{
    courseId: number;

    level: number;
    letter: string;
    name: string;

    canRead: number;
    canWrite: number;
    canEdit: number;
    canDelete: number;
}

export interface UpdateUserRequest
{
    firstNames: string;
    paternalLastName: string;
    maternalLastName?: string;

    username: string;
    role: "ADMIN" | "COORDINATOR" | "INSPECTOR";

    active: boolean;
}


export interface ChangePasswordRequest
{
    password: string;
}