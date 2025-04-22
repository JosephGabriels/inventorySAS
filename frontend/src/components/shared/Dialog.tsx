import React from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  if (!isOpen) return null

  const buttonClasses = {
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-primary'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-dark-800 p-6 rounded-lg w-full max-w-md shadow-xl transform transition-all animate-slide-up">
        <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex space-x-4">
          <button
            onClick={onConfirm}
            className={`flex-1 Ksh {buttonClasses[type]}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}