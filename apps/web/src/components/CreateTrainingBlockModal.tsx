import { useState } from 'react';
import { createTrainingBlock, CreateTrainingBlockDto, type TrainingBlock } from '../api/training-blocks';
import LoadingIcon from '../icons/LoadingIcon';
import { Modal } from './Modal';

interface CreateTrainingBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (block: TrainingBlock) => void;
}

export function CreateTrainingBlockModal({ isOpen, onClose, onSuccess }: CreateTrainingBlockModalProps) {
  const [formData, setFormData] = useState<CreateTrainingBlockDto>({
    raceName: '',
    identifier: '',
    raceDate: new Date(),
    startDate: new Date(),
    goalTime: '',
    goalDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const created = await createTrainingBlock({
        ...formData,
        goalTime: formData.goalTime?.trim() || undefined,
        goalDescription: formData.goalDescription?.trim() || undefined,
      });
      setFormData({
        raceName: '',
        identifier: '',
        raceDate: new Date(),
        startDate: new Date(),
        goalTime: '',
        goalDescription: '',
      });
      onSuccess?.(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create training block');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateTrainingBlockDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field.includes('Date') ? new Date(value) : value,
    }));
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Create Training Block' closeDisabled={loading}>
      {error && (
        <div className='mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          <p className='text-sm'>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
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
            required
            disabled={loading}
          />
        </div>

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
            required
            disabled={loading}
          />
          <p className='mt-1 text-xs text-gray-500'>Short code to identify this training block</p>
        </div>

        <div>
          <label htmlFor='startDate' className='block text-sm font-medium text-gray-700 mb-1'>
            Start Date *
          </label>
          <input
            type='date'
            id='startDate'
            value={formatDateForInput(formData.startDate)}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor='goalDescription' className='block text-sm font-medium text-gray-700 mb-1'>
            Goal
          </label>
          <input
            type='text'
            id='goalDescription'
            value={formData.goalDescription ?? ''}
            onChange={(e) => handleChange('goalDescription', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            placeholder='e.g. Boston or bust marathon'
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor='goalTime' className='block text-sm font-medium text-gray-700 mb-1'>
            Goal time
          </label>
          <input
            type='text'
            id='goalTime'
            value={formData.goalTime ?? ''}
            onChange={(e) => handleChange('goalTime', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            placeholder='e.g. 3:00'
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor='raceDate' className='block text-sm font-medium text-gray-700 mb-1'>
            Race Date *
          </label>
          <input
            type='date'
            id='raceDate'
            value={formatDateForInput(formData.raceDate)}
            onChange={(e) => handleChange('raceDate', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            required
            disabled={loading}
          />
        </div>

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
                Creating...
              </span>
            ) : (
              'Create Training Block'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
