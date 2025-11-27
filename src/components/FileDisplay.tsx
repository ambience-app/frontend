import { FileText, Image, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIPFS } from '@/hooks/useIPFS';

interface FileDisplayProps {
  cid: string;
  fileName: string;
  mimeType?: string;
  className?: string;
  showDownloadButton?: boolean;
}

export function FileDisplay({
  cid,
  fileName,
  mimeType = '',
  className = '',
  showDownloadButton = true,
}: FileDisplayProps) {
  const { getFileUrl, downloadFile } = useIPFS();
  const fileUrl = getFileUrl(cid, fileName);
  const isImage = mimeType.startsWith('image/');
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  const handleDownload = async () => {
    try {
      await downloadFile(cid, fileName);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const renderFilePreview = () => {
    if (isImage) {
      return (
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Image className="w-12 h-12 text-gray-300" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-16 h-16 flex items-center justify-center bg-blue-50 text-blue-500 rounded-full mb-3">
          <FileText className="w-8 h-8" />
        </div>
        <span className="text-sm font-medium text-gray-900 truncate max-w-full">
          {fileName}
        </span>
        <span className="text-xs text-gray-500 uppercase mt-1">{fileExtension}</span>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-lg overflow-hidden">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-90 transition-opacity"
        >
          {renderFilePreview()}
        </a>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-gray-500">
            {isImage ? 'Image' : fileExtension?.toUpperCase() || 'File'} • IPFS
          </p>
        </div>
        
        <div className="flex space-x-1">
          {showDownloadButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-gray-500 hover:text-gray-700"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FileDisplay;
