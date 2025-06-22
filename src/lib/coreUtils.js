import { supabase } from '@/lib/supabaseClient.js';

export const generateId = (prefix = 'EGS') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export const uploadFilesToSupabase = async (files, folderId) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file) => {
    if (!file.fileObject) {
        console.error('File object is missing for:', file.name);
        return null;
    }
    const filePath = `${folderId}/${Date.now()}-${file.fileObject.name}`;
    const { error } = await supabase.storage
      .from('task_documents')
      .upload(filePath, file.fileObject);

    if (error) {
      console.error('Error uploading file:', file.name, error);
      return null;
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      isCertificate: file.isCertificate || false,
      path: filePath,
    };
  });

  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
};
