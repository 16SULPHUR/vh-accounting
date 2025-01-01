import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Receipt, CreditCard } from 'lucide-react'

type VoucherType = 'receipt' | 'payment';

interface VoucherTypeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: VoucherType) => void;
}

const VoucherTypeDialog: React.FC<VoucherTypeDialogProps> = ({
  isOpen,
  onOpenChange,
  onSelect
}) => {
  const [selectedType, setSelectedType] = useState<VoucherType>('receipt');

  // Handle F1 key press to open dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault(); // Prevent default F1 help behavior
        onOpenChange(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  // Handle arrow keys and enter for selection
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setSelectedType('receipt');
          break;
        case 'ArrowRight':
          setSelectedType('payment');
          break;
        case 'Enter':
          if (selectedType) {
            onSelect(selectedType);
            onOpenChange(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedType, onSelect, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="mb-4 flex items-center gap-2">
          Add New Entry
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 py-3 font-mono text-[20px] font-medium text-muted-foreground">
            <span>F1</span>
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Voucher Type</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Use ← → arrow keys to select and Enter to confirm
          </p>
        </DialogHeader>
        <RadioGroup
          value={selectedType}
          onValueChange={(value: string) => setSelectedType(value as VoucherType)}
          className="grid grid-cols-2 gap-4 pt-4"
        >
          <div className="relative">
            <RadioGroupItem
              value="receipt"
              id="receipt"
              className="peer sr-only"
              onClick={() => {
                onSelect('receipt')
              }}
            />
            <Label
              htmlFor="receipt"
              className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 ${selectedType === 'receipt' ? 'border-primary' : 'border-muted'
                } bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all`}
            >
              <Receipt className="mb-3 h-8 w-8" />
              <span className="text-lg font-medium">Receipt</span>
              <span className="text-sm text-muted-foreground">Money coming in</span>
              <kbd className="pointer-events-none absolute bottom-4 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>←</span>
              </kbd>
            </Label>
          </div>

          <div className="relative">
            <RadioGroupItem
              value="payment"
              id="payment"
              className="peer sr-only"
              onClick={() => {
                onSelect('payment')
              }}
            />
            <Label
              htmlFor="payment"
              className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 ${selectedType === 'payment' ? 'border-primary' : 'border-muted'
                } bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all`}
            >
              <CreditCard className="mb-3 h-8 w-8" />
              <span className="text-lg font-medium">Payment</span>
              <span className="text-sm text-muted-foreground">Money going out</span>
              <kbd className="pointer-events-none absolute bottom-4 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>→</span>
              </kbd>
            </Label>
          </div>
        </RadioGroup>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherTypeDialog;