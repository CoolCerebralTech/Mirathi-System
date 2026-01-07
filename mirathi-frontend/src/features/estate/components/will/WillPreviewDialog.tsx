import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Button,
  ScrollArea,
  Alert,
  AlertDescription
} from '@/components/ui';
import { Printer, Download, Info } from 'lucide-react';

interface WillPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  testatorName?: string;
}

export const WillPreviewDialog: React.FC<WillPreviewDialogProps> = ({ 
  isOpen, 
  onClose, 
  htmlContent,
  testatorName 
}) => {
  
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Last Will and Testament - ${testatorName || 'Preview'}</title>
            <style>
              @media print {
                @page { margin: 2cm; }
                body { 
                  font-family: 'Times New Roman', serif; 
                  font-size: 12pt;
                  line-height: 1.6;
                  color: #000;
                }
              }
              body {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                font-family: 'Times New Roman', serif;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Last Will and Testament - ${testatorName || 'Preview'}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Will_${testatorName || 'Preview'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0 border-b">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">Will Document Preview</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review before printing and signing
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Important Notice */}
        <div className="px-6 py-3 flex-shrink-0">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Next Steps:</strong> After printing, sign the document in the presence of 
              your 2 witnesses. All parties must sign on the same date. Store the signed original 
              in a safe place and inform your executor of its location.
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Document Preview */}
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="bg-white border rounded-lg shadow-sm">
            <div 
              className="prose prose-sm max-w-none p-8 md:p-12"
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '14px',
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </ScrollArea>

        {/* Footer Instructions */}
        <div className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Signing Instructions:</p>
            <ol className="list-decimal pl-5 space-y-0.5">
              <li>Print this document</li>
              <li>Gather your 2 nominated witnesses</li>
              <li>Sign the document in their presence</li>
              <li>Have both witnesses sign immediately after you</li>
              <li>Store the original in a secure location</li>
              <li>Inform your executor where the will is kept</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};