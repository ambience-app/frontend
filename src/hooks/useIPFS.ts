import { useState, useCallback } from 'react';
import { uploadToIPFS, getFromIPFS, getMimeType, getDownloadUrl } from '@/utils/ipfs';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UseIPFSReturn {
  uploadFile: (file: File) => Promise<string | null>;
  getFileUrl: (cid: string, filename?: string) => string;
  downloadFile: (cid: string, filename: string) => Promise<void>;
  status: UploadStatus;
  error: string | null;
}

export function useIPFS(): UseIPFSReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!file) {
      setError('No file provided');
      return null;
    }

    setStatus('uploading');
    setError(null);

    try {
      const cid = await uploadToIPFS(file);
      setStatus('success');
      return cid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      setStatus('error');
      return null;
    }
  }, []);

  const getFileUrl = useCallback((cid: string, filename?: string): string => {
    if (!cid) return '';
    
    if (filename) {
      return getDownloadUrl(cid, filename);
    }
    
    return `https://ipfs.io/ipfs/${cid}`;
  }, []);

  const downloadFile = useCallback(async (cid: string, filename: string): Promise<void> => {
    try {
      const response = await getFromIPFS(cid);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    uploadFile,
    getFileUrl,
    downloadFile,
    status,
    error,
  };
}

export default useIPFS;
