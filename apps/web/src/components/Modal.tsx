import { ReactNode } from 'react';
import CloseIcon from '../icons/CloseIcon';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  closeOnEscape?: boolean;
  closeDisabled?: boolean;
  containerClassName?: string;
  backdropClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  closeOnEscape = true,
  closeDisabled = false,
  containerClassName = '',
  backdropClassName = 'absolute inset-0 bg-black bg-opacity-50',
  panelClassName = 'relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto',
  contentClassName = 'p-6',
}: ModalProps) {
  useEscapeKey(onClose, isOpen && closeOnEscape && !closeDisabled);

  if (!isOpen) return null;

  const handleBackdropClick = closeDisabled ? undefined : onClose;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${containerClassName}`}>
      <div className={backdropClassName} onClick={handleBackdropClick} aria-hidden />
      <div className={panelClassName} onClick={(e) => e.stopPropagation()} role='dialog' aria-modal='true'>
        {title != null ? (
          <div className={contentClassName}>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>{title}</h2>
              <button
                type='button'
                onClick={onClose}
                disabled={closeDisabled}
                className='text-gray-400 hover:text-gray-600 transition-colors'
                aria-label='Close'
              >
                <CloseIcon />
              </button>
            </div>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
