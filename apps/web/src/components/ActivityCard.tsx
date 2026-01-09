import { useState } from 'react';
import { Activity } from '../types/activity';
import { updateActivityName } from '../api/activities';
import { formatPace, formatTimeFromSecondsSimple } from '../util/time';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
  onCardClick?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onUpdate, onCardClick }: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(activity.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const pace = formatPace(activity.averageSpeed);

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(activity.name || '');
  };

  const handleCardClick = () => {
    if (!isEditing && onCardClick) {
      onCardClick(activity);
    }
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
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col h-full min-h-[180px] ${
        isEditing ? '' : 'cursor-pointer'
      }`}
      onClick={handleCardClick}
    >
      {/* Activity name */}
      <div className='mb-4 shrink-0'>
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
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
            className='text-lg font-bold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors min-h-14'
            onClick={handleNameClick}
            title='Click to edit name'
          >
            {activity.name || 'Unnamed Activity'}
          </h3>
        )}
      </div>

      {/* Primary stats: Distance, Pace, Time */}
      <div className='grid grid-cols-3 gap-3 flex-1 items-end'>
        {activity.distance !== null ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap'>
              {activity.distance.toFixed(2)}
            </p>
            <p className='text-xs text-gray-500 mt-0.5'>mi</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400 leading-tight'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>distance</p>
          </div>
        )}

        {pace !== null ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap'>{pace}</p>
            <p className='text-xs text-gray-500 mt-0.5'>pace</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400 leading-tight'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>pace</p>
          </div>
        )}

        {activity.movingTime !== null ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap'>
              {formatTimeFromSecondsSimple(activity.movingTime)}
            </p>
            <p className='text-xs text-gray-500 mt-0.5'>time</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400 leading-tight'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>time</p>
          </div>
        )}
      </div>
    </div>
  );
}
