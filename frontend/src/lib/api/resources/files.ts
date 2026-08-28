import { apiFetch, API_BASE_URL } from '../client';

export interface UploadedFile {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  kind: string;
  url: string;
}

export const filesApi = {
  // Uploads a file to Postgres-backed storage. Returns the asset + servable url.
  upload(file: File, kind = 'attachment'): Promise<UploadedFile> {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    return apiFetch<UploadedFile>('/files', { method: 'POST', body: form });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return apiFetch(`/files/${id}`, { method: 'DELETE' });
  },

  // Absolute URL for embedding in <img src>. Files stream from the backend.
  urlFor(id: string): string {
    return `${API_BASE_URL}/files/${id}`;
  },
};
