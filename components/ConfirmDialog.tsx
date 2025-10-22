import React, { useState } from 'react'
import { AlertTriangle, Loader2, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'success'
  isLoading?: boolean
  icon?: LucideIcon
  iconColor?: string
  iconBgColor?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'destructive',
  isLoading,
  icon,
  iconColor,
  iconBgColor,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const loading = isLoading !== undefined ? isLoading : internalLoading

  const handleConfirm = async () => {
    if (isLoading !== undefined) {
      // Se isLoading è fornito dall'esterno, non gestiamo lo stato interno
      await onConfirm()
    } else {
      // Altrimenti usiamo lo stato interno
      setInternalLoading(true)
      try {
        await onConfirm()
        onOpenChange(false)
      } catch (error) {
        console.error('Error in confirm action:', error)
      } finally {
        setInternalLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {(icon || variant === 'destructive') && (
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full" 
                style={{ backgroundColor: iconBgColor || (variant === 'destructive' ? '#fee2e2' : variant === 'success' ? '#dcfce7' : '#e0e7ff') }}
              >
                {icon ? (
                  React.createElement(icon, { 
                    className: "h-5 w-5", 
                    style: { color: iconColor || (variant === 'destructive' ? '#dc2626' : variant === 'success' ? '#16a34a' : '#4f46e5') } 
                  })
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600 whitespace-pre-line">{description}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'success' ? 'default' : variant}
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
