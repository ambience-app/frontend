import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useIPFS } from '@/hooks/useIPFS';
import { FileText, Image, Upload, X } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (cid: string, fileName: string) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  maxSizeMB = 100,
  acceptedTypes = ['image/*', 'application/pdf', 'text/plain'],
  className = '',
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, status, error } = useIPFS();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Check file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `File size exceeds the maximum limit of ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (
      acceptedTypes.length > 0 &&
      !acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const typePrefix = type.split('/')[0];
          return selectedFile.type.startsWith(typePrefix);
        }
        return selectedFile.type === type;
      })
    ) {
      toast({
        title: 'Unsupported file type',
        description: `Please upload a file of type: ${acceptedTypes.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const cid = await uploadFile(file);
      
      if (cid) {
        onUploadComplete(cid, file.name);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        toast({
          title: 'File uploaded successfully',
          description: 'Your file has been uploaded to IPFS',
        });
      }
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: error || 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            Drag and drop your file here, or{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => fileInputRef.current?.click()}
            >
              browse files
            </button>
          </p>
          <p className="text-xs text-gray-400">
            Max file size: {maxSizeMB}MB • {acceptedTypes.join(', ')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={acceptedTypes.join(',')}
          />
        </div>
      </div>

      {file && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(file.type)}
              <div className="text-sm">
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {status === 'uploading' && (
            <div className="mt-3">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-right mt-1 text-gray-500">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="mt-4">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="w-full"
            >
              {status === 'uploading' ? 'Uploading...' : 'Upload to IPFS'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
