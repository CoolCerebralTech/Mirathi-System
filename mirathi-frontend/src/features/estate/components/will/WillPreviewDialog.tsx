import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Button,
  ScrollArea
} from '@/components/ui';
import { Printer } from 'lucide-react';

interface WillPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

export const WillPreviewDialog: React.FC<WillPreviewDialogProps> = ({ isOpen, onClose, htmlContent }) => {
  
  const handlePrint = () => {
    // Open a new window for printing the HTML content
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-center pr-6">
            <DialogTitle>Document Preview</DialogTitle>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 border rounded-md p-4 bg-gray-50">
          <div 
            className="prose prose-sm max-w-none mx-auto bg-white p-8 shadow-sm min-h-full"
            // We trust the backend HTML generator
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};