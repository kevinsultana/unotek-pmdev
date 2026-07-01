export interface UserInfo {
  id: number;
  name: string;
  email: string;
  login: string;
}

export interface EmployeeInfo {
  id: number;
  name: string;
  job_title: string | null;
  department: string | null;
  work_email: string | null;
  work_phone: string | null;
  company: string | null;
}

export interface CrudPrivileges {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface Privileges {
  project: CrudPrivileges;
  task: CrudPrivileges;
  attendance: CrudPrivileges;
  time_off: CrudPrivileges;
}

export interface ProfileResponse {
  user: UserInfo;
  employee: EmployeeInfo;
  privileges: Privileges;
}
