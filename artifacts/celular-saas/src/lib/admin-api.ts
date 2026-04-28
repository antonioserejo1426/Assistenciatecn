import { customFetch } from "@workspace/api-client-react";

export interface BackupFileDto {
  filename: string;
  size: number;
  createdAt: string;
}

export function listBackups(): Promise<BackupFileDto[]> {
  return customFetch<BackupFileDto[]>("/api/admin/backups");
}

export function triggerBackup(): Promise<BackupFileDto> {
  return customFetch<BackupFileDto>("/api/admin/backups", { method: "POST" });
}

export function deleteBackup(filename: string): Promise<{ ok: true }> {
  return customFetch<{ ok: true }>(`/api/admin/backups/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

export function backupDownloadUrl(filename: string): string {
  return `/api/admin/backups/${encodeURIComponent(filename)}/download`;
}
