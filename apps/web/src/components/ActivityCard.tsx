import { useState } from 'react';
import { Activity } from '../types/activity';
import { updateActivityName } from '../api/activities';
import { formatDate, formatPace, formatTimeFromSecondsSimple } from '../util/time';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
}

export function ActivityCard({ activity, onUpdate }: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(activity.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const pace = formatPace(activity.averageSpeed);

  const handleNameClick = () => {
    setIsEditing(true);
    setEditedName(activity.name || '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameSubmit = async () => {
    if (editedName.trim() === activity.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateActivityName(activity.stravaId.toString(), editedName.trim());
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update activity name:', error);
      alert('Failed to update activity name. Please try again.');
      setEditedName(activity.name || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameCancel = () => {
    setEditedName(activity.name || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col'>
      <div className='flex items-start justify-between mb-3'>
        {activity.startDateLocal && (
          <span className='text-xs text-gray-500'>{formatDate(activity.startDateLocal)}</span>
        )}
      </div>

      {/* Activity name */}
      {isEditing ? (
        <div className='mb-2'>
          <input
            type='text'
            value={editedName}
            onChange={handleNameChange}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className='w-full text-lg font-bold text-gray-900 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            autoFocus
          />
          {isSaving && <p className='text-xs text-gray-500 mt-1'>Saving...</p>}
        </div>
      ) : (
        <h3
          className='text-lg font-bold text-gray-900 line-clamp-2 mb-1 cursor-pointer hover:text-blue-600 transition-colors'
          onClick={handleNameClick}
          title='Click to edit name'
        >
          {activity.name || 'Unnamed Activity'}
        </h3>
      )}

      {/* Stats grid */}
      <div className='flex flex-col gap-2 mb-2 grow'>
        {/* Miles and pace row */}
        <div className='grid grid-cols-2 gap-4'>
          {activity.distance !== null && (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-900'>{activity.distance.toFixed(2)}</p>
              <p className='text-xs text-gray-500 mt-0.5'>mi</p>
            </div>
          )}

          {pace !== null ? (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-900'>{pace}</p>
              <p className='text-xs text-gray-500 mt-0.5'>pace</p>
            </div>
          ) : (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-400'>—</p>
              <p className='text-xs text-gray-400 mt-0.5'>pace</p>
            </div>
          )}
        </div>

        {/* Time row */}
        {activity.movingTime !== null && (
          <div className='text-center px-1'>
            <p className='text-2xl font-bold text-gray-900'>{formatTimeFromSecondsSimple(activity.movingTime)}</p>
            <p className='text-xs text-gray-500 mt-0.5'>time</p>
          </div>
        )}

        {/* Other info row */}
        <div className='grid grid-cols-2 gap-4'>
          {activity.averageHeartRate !== null && activity.averageHeartRate > 0 ? (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-900'>{activity.averageHeartRate}</p>
              <p className='text-xs text-gray-500 mt-0.5'>bpm</p>
            </div>
          ) : (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-400'>—</p>
              <p className='text-xs text-gray-400 mt-0.5'>hr</p>
            </div>
          )}

          {activity.calories !== null && activity.calories > 0 ? (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-900'>{activity.calories}</p>
              <p className='text-xs text-gray-500 mt-0.5'>cal</p>
            </div>
          ) : (
            <div className='text-center px-1'>
              <p className='text-2xl font-bold text-gray-400'>—</p>
              <p className='text-xs text-gray-400 mt-0.5'>cal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
