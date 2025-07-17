"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

interface SwapDetails {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: string;
  protocol: string;
  chain: string;
}

interface SwapConfirmationProps {
  details: SwapDetails;
  onConfirm: (confirm: 'Yes' | 'No') => void;
  onClose?: () => void;
}

const SwapConfirmation = ({ details, onConfirm, onClose }: SwapConfirmationProps) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onConfirm('No');
    if (onClose) onClose();
  };

  const handleConfirm = () => {
    setOpen(false);
    onConfirm('Yes');
    if (onClose) onClose();
  };

  const handleCancel = () => {
    setOpen(false);
    onConfirm('No');
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Swap</DialogTitle>
          <DialogDescription>
            Please review the details of your swap before proceeding.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="flex flex-col space-y-2 bg-secondary p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20">
                    {details.tokenIn.substring(0, 1)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{details.tokenIn}</p>
                  <p className="text-xs text-muted-foreground">Sell</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{details.amountIn}</p>
                <p className="text-xs text-muted-foreground">${(0).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-primary/10 p-1 rounded-full">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20">
                    {details.tokenOut.substring(0, 1)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{details.tokenOut}</p>
                  <p className="text-xs text-muted-foreground">Receive</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{details.amountOut}</p>
                <p className="text-xs text-muted-foreground">${(0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Rate</p>
              <p className="text-sm">
                1 {details.tokenIn} = {(Number(details.amountOut) / details.amountIn).toFixed(6)} {details.tokenOut}
              </p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Protocol</p>
              <p className="text-sm capitalize">{details.protocol}</p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="text-sm capitalize">{details.chain}</p>
            </div>
          </div>
          
          <div className="bg-secondary p-3 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-xs">
              Please ensure you have enough funds and that your wallet is connected to {details.chain}.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapConfirmation; 