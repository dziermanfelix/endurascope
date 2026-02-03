import { useState, useEffect } from 'react';
import { updateTrainingBlock, TrainingBlock, UpdateTrainingBlockDto } from '../api/training-blocks';
import CloseIcon from '../icons/CloseIcon';
import LoadingIcon from '../icons/LoadingIcon';

interface EditTrainingBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trainingBlock: TrainingBlock | null;
}

export function EditTrainingBlockModal({ isOpen, onClose, onSuccess, trainingBlock }: EditTrainingBlockModalProps) {
  const [formData, setFormData] = useState<UpdateTrainingBlockDto>({
    raceName: '',
    identifier: '',
    raceDate: new Date(),
    startDate: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trainingBlock) {
      setFormData({
        raceName: trainingBlock.raceName,
        identifier: trainingBlock.identifier,
        raceDate: new Date(trainingBlock.raceDate),
        startDate: new Date(trainingBlock.startDate),
      });
    }
  }, [trainingBlock]);

  if (!isOpen || !trainingBlock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateTrainingBlock(trainingBlock.id, formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update training block');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateTrainingBlockDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field.includes('Date') ? new Date(value) : value,
    }));
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black bg-opacity-50' onClick={onClose} />

      {/* Modal */}
      <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>Edit Training Block</h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
              disabled={loading}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
              <p className='text-sm'>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Race Name */}
            <div>
              <label htmlFor='raceName' className='block text-sm font-medium text-gray-700 mb-1'>
                Race Name *
              </label>
              <input
                type='text'
                id='raceName'
                value={formData.raceName}
                onChange={(e) => handleChange('raceName', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                placeholder='e.g., Boston Marathon 2025'
                required
                disabled={loading}
              />
            </div>

            {/* Identifier */}
            <div>
              <label htmlFor='identifier' className='block text-sm font-medium text-gray-700 mb-1'>
                Identifier *
              </label>
              <input
                type='text'
                id='identifier'
                value={formData.identifier}
                onChange={(e) => handleChange('identifier', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                placeholder='e.g., BM2025'
                required
                disabled={loading}
              />
              <p className='mt-1 text-xs text-gray-500'>Short code to identify this training block</p>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor='startDate' className='block text-sm font-medium text-gray-700 mb-1'>
                Start Date *
              </label>
              <input
                type='date'
                id='startDate'
                value={formatDateForInput(formData.startDate as Date)}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                required
                disabled={loading}
              />
            </div>

            {/* Race Date */}
            <div>
              <label htmlFor='raceDate' className='block text-sm font-medium text-gray-700 mb-1'>
                Race Date *
              </label>
              <input
                type='date'
                id='raceDate'
                value={formatDateForInput(formData.raceDate as Date)}
                onChange={(e) => handleChange('raceDate', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                required
                disabled={loading}
              />
            </div>

            {/* Buttons */}
            <div className='flex gap-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50'
                disabled={loading}
              >
                {loading ? (
                  <span className='flex items-center justify-center'>
                    <LoadingIcon />
                    Updating...
                  </span>
                ) : (
                  'Update Training Block'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
