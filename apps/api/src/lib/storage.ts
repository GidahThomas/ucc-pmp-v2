import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from '@supabase/supabase-js';

import { env } from '../config';
import { AppError } from './errors';

type UploadInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder: string;
};

function sanitizeName(fileName: string) {
  return fileName.replace(/[^A-Za-z0-9._-]/g, '-');
}

export async function storeFile({ buffer, fileName, mimeType, folder }: UploadInput) {
  const timestampedName = `${Date.now()}-${sanitizeName(fileName)}`;

  if (env.STORAGE_MODE === 'supabase') {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError(500, 'Supabase storage credentials are not configured');
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const storagePath = `${folder}/${timestampedName}`;
    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (error) {
      throw new AppError(500, 'Failed to upload file to Supabase storage', error);
    }

    const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  const uploadRoot = path.resolve(process.cwd(), 'uploads', folder);
  await mkdir(uploadRoot, { recursive: true });
  const filePath = path.join(uploadRoot, timestampedName);
  await writeFile(filePath, buffer);

  return `${env.UPLOAD_BASE_URL}/uploads/${folder}/${timestampedName}`;
}
