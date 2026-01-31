import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="space-y-6">
        <p className="text-slate-600 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            onClick={() => {
              if (onConfirm) onConfirm();
            }} 
            className={
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500' 
                : 'bg-primary-600 hover:bg-primary-700 text-white border-transparent focus:ring-primary-500'
            }
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
