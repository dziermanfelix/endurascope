import { useState, useEffect } from 'react';
import { updateTrainingBlock, TrainingBlock, UpdateTrainingBlockDto } from '../api/training-blocks';
import LoadingIcon from '../icons/LoadingIcon';
import { Modal } from './Modal';

interface EditTrainingBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (block: TrainingBlock) => void;
  trainingBlock: TrainingBlock | null;
}

export function EditTrainingBlockModal({ isOpen, onClose, onSuccess, trainingBlock }: EditTrainingBlockModalProps) {
  const [formData, setFormData] = useState<UpdateTrainingBlockDto>({
    raceName: '',
    identifier: '',
    raceDate: new Date(),
    startDate: new Date(),
    goalTime: '',
    goalDescription: '',
    locked: false,
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
        goalTime: trainingBlock.goalTime ?? '',
        goalDescription: trainingBlock.goalDescription ?? '',
        locked: trainingBlock.locked,
      });
    }
  }, [trainingBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingBlock) return;

    setLoading(true);
    setError(null);

    try {
      const updated = await updateTrainingBlock(trainingBlock.id, {
        ...formData,
        goalTime: formData.goalTime?.trim() || null,
        goalDescription: formData.goalDescription?.trim() || null,
      });
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update training block');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateTrainingBlockDto, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field.includes('Date') ? new Date(value as string | number) : value,
    }));
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen && !!trainingBlock}
      onClose={onClose}
      title='Edit Training Block'
      closeDisabled={loading}
    >
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
            placeholder='e.g., Boston Marathon 2025'
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
            placeholder='e.g., BM2025'
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
            value={formatDateForInput(formData.startDate as Date)}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
            required
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
            value={formatDateForInput(formData.raceDate as Date)}
            onChange={(e) => handleChange('raceDate', e.target.value)}
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
            disabled={loading}
          />
        </div>

        <div className='flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3'>
          <input
            type='checkbox'
            id='locked'
            checked={formData.locked ?? false}
            onChange={(e) => handleChange('locked', e.target.checked)}
            disabled={loading}
            className='mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500'
          />
          <div>
            <label htmlFor='locked' className='block text-sm font-medium text-gray-700'>
              Locked
            </label>
            <p className='mt-0.5 text-xs text-gray-500'>
              Prevent editing planned miles, workout types, and week stories. You can unlock this later from this modal.
            </p>
          </div>
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
                Updating...
              </span>
            ) : (
              'Update Training Block'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
