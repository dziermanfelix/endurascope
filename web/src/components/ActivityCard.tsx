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
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${secs}s`;
    }
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

  // Convert meters to feet (1 meter = 3.28084 feet)
  const metersToFeet = (meters: number): number => meters * 3.28084;

  const location = [activity.locationCity, activity.locationState, activity.locationCountry].filter(Boolean).join(', ');

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

        {activity.totalElevationGain !== null && activity.totalElevationGain > 0 ? (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{Math.round(metersToFeet(activity.totalElevationGain))}</p>
            <p className='text-xs text-gray-500 mt-0.5'>ft</p>
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-400'>—</p>
            <p className='text-xs text-gray-400 mt-0.5'>elev</p>
          </div>
        )}
      </div>

      {/* Footer with location and social stats */}
      <div className='pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600'>
        {location ? (
          <span className='flex items-center truncate flex-1 min-w-0'>
            <svg className='w-3.5 h-3.5 mr-1.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            <span className='truncate'>{location}</span>
          </span>
        ) : (
          <span className='text-gray-400'>No location</span>
        )}

        {(activity.kudosCount !== null && activity.kudosCount > 0) ||
        (activity.commentCount !== null && activity.commentCount > 0) ? (
          <div className='flex items-center space-x-3 ml-3 flex-shrink-0'>
            {activity.kudosCount !== null && activity.kudosCount > 0 && (
              <span className='flex items-center'>
                <svg className='w-3.5 h-3.5 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z' />
                </svg>
                {activity.kudosCount}
              </span>
            )}
            {activity.commentCount !== null && activity.commentCount > 0 && (
              <span className='flex items-center'>
                <svg className='w-3.5 h-3.5 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
                {activity.commentCount}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
