import { useState } from 'react';
import { Activity } from '../types/activity';
import { updateActivityName } from '../api/activities';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
}

export function ActivityCard({ activity, onUpdate }: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(activity.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const formatTime = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    // Format as HH:MM:SS with zero-padding
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActivityTypeColor = (type: string | null): string => {
    const colors: Record<string, string> = {
      Run: 'bg-blue-500',
      Ride: 'bg-green-500',
      Walk: 'bg-purple-500',
      Swim: 'bg-cyan-500',
      Hike: 'bg-orange-500',
      Workout: 'bg-red-500',
      Elliptical: 'bg-orange-500',
    };
    return colors[type || ''] || 'bg-gray-500';
  };

  // Calculate pace in minutes:seconds per mile
  const calculatePace = (distanceMiles: number | null, timeSeconds: number | null): string | null => {
    if (!distanceMiles || !timeSeconds || distanceMiles === 0) return null;
    const secondsPerMile = timeSeconds / distanceMiles;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const pace = calculatePace(activity.distance, activity.movingTime);

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
      {/* Header with type badge */}
      <div className='flex items-start justify-between mb-3'>
        {activity.type && (
          <span
            className={`${getActivityTypeColor(activity.type)} text-white px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide`}
          >
            {activity.type}
          </span>
        )}
        {activity.startDateLocal && (
          <span className='text-xs text-gray-500'>{formatDate(activity.startDateLocal)}</span>
        )}
      </div>

      {/* Activity name */}
      {isEditing ? (
        <div className='mb-4'>
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
          className='text-lg font-bold text-gray-900 mb-4 line-clamp-2 min-h-[3.5rem] cursor-pointer hover:text-blue-600 transition-colors'
          onClick={handleNameClick}
          title='Click to edit name'
        >
          {activity.name || 'Unnamed Activity'}
        </h3>
      )}

      {/* Stats grid */}
      <div className='grid grid-cols-3 gap-3 mb-4 flex-grow'>
        {activity.distance !== null && (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{activity.distance.toFixed(2)}</p>
            <p className='text-xs text-gray-500 mt-0.5'>mi</p>
          </div>
        )}

        {activity.movingTime !== null && (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{formatTime(activity.movingTime)}</p>
            <p className='text-xs text-gray-500 mt-0.5'>time</p>
          </div>
        )}

        {pace !== null ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{pace}</p>
            <p className='text-xs text-gray-500 mt-0.5'>pace</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>pace</p>
          </div>
        )}

        {activity.averageHeartRate !== null && activity.averageHeartRate > 0 ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{activity.averageHeartRate}</p>
            <p className='text-xs text-gray-500 mt-0.5'>bpm</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>hr</p>
          </div>
        )}

        {activity.calories !== null && activity.calories > 0 ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{activity.calories}</p>
            <p className='text-xs text-gray-500 mt-0.5'>cal</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>cal</p>
          </div>
        )}
      </div>

    </div>
  );
}
