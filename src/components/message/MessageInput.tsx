import { useRef, useState, KeyboardEvent, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, File as FileIcon, Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';

type FileUploadProps = {
  onFileChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

const FileUpload = ({ 
  onFileChange, 
  accept, 
  multiple = false, 
  disabled = false, 
  children 
}: FileUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(Array.from(e.target.files));
      // Reset the input to allow selecting the same file again
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload" style={{ margin: 0 }}>
        {children}
      </label>
    </div>
  );
};

export interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  className?: string;
  isSending?: boolean;
}

export function MessageInput({ 
  onSend, 
  disabled = false, 
  className, 
  isSending = false 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage || attachments.length > 0) {
      onSend(trimmedMessage, attachments);
      setMessage('');
      setAttachments([]);
      textareaRef.current?.focus();
    }
  }, [message, attachments, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (files: File[]) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + emoji + message.substring(end);
    
    setMessage(newMessage);
    // Move cursor after the inserted emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const isSendDisabled = (message.trim() === '' && attachments.length === 0) || disabled || isSending;

  return (
    <div className={cn('border-t bg-background', className)}>
      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 border-b">
          {attachments.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="relative group bg-background rounded-lg border p-2 max-w-[200px]"
            >
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="sr-only">Remove attachment</span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end p-2 gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-32 resize-none pr-10"
            disabled={disabled || isSending}
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled || isSending}
            >
              <Smile className="h-4 w-4" />
              <span className="sr-only">Add emoji</span>
            </Button>
            {showEmojiPicker && (
              <div className="absolute bottom-10 right-0 z-10">
                <EmojiPicker onSelect={handleEmojiSelect} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <FileUpload
            onFileChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
            multiple
            disabled={disabled || isSending}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              disabled={disabled || isSending}
            >
              <ImageIcon className="h-5 w-5" />
              <span className="sr-only">Attach file</span>
            </Button>
          </FileUpload>
          
          <Button 
            type="button"
            onClick={handleSend} 
            size="icon" 
            disabled={isSendDisabled}
            className="h-10 w-10 rounded-full"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
