export type RoleId = "admin" | "staff" | "scanner" | "passenger";

export interface PermissionModule {
  id: string;
  name: string;
  description: string;
  iconData?: string; // Tên Icon để render UI (có thể map lúc render)
}

export interface RoleDetail {
  id: RoleId;
  name: string;
  description: string;
  createdDate: string;
  creator: string;
  userCount: number;
  permissions: string[]; // Mảng các PermissionModule.id
}
