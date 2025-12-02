import { Activity } from '../types/activity';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const formatTime = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getActivityTypeColor = (type: string | null): string => {
    const colors: Record<string, string> = {
      Run: 'bg-blue-100 text-blue-800',
      Ride: 'bg-green-100 text-green-800',
      Walk: 'bg-purple-100 text-purple-800',
      Swim: 'bg-cyan-100 text-cyan-800',
      Hike: 'bg-orange-100 text-orange-800',
      Workout: 'bg-red-100 text-red-800',
    };
    return colors[type || ''] || 'bg-gray-100 text-gray-800';
  };

  const location = [activity.locationCity, activity.locationState, activity.locationCountry].filter(Boolean).join(', ');

  return (
    <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
      <div className='flex justify-between items-start mb-4'>
        <h3 className='text-xl font-bold text-gray-900'>{activity.name || 'Unnamed Activity'}</h3>
        {activity.type && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getActivityTypeColor(activity.type)}`}>
            {activity.type}
          </span>
        )}
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
        {activity.distance !== null && (
          <div>
            <p className='text-sm text-gray-500'>Distance</p>
            <p className='text-lg font-semibold text-gray-900'>{activity.distance.toFixed(2)} km</p>
          </div>
        )}

        {activity.movingTime !== null && (
          <div>
            <p className='text-sm text-gray-500'>Moving Time</p>
            <p className='text-lg font-semibold text-gray-900'>{formatTime(activity.movingTime)}</p>
          </div>
        )}

        {activity.totalElevationGain !== null && activity.totalElevationGain > 0 && (
          <div>
            <p className='text-sm text-gray-500'>Elevation</p>
            <p className='text-lg font-semibold text-gray-900'>{Math.round(activity.totalElevationGain)} m</p>
          </div>
        )}

        {activity.startDateLocal && (
          <div>
            <p className='text-sm text-gray-500'>Date</p>
            <p className='text-lg font-semibold text-gray-900'>{formatDate(activity.startDateLocal).split(',')[0]}</p>
          </div>
        )}
      </div>

      <div className='flex items-center justify-between text-sm text-gray-600 pt-4 border-t'>
        {location && (
          <span className='flex items-center'>
            <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            {location}
          </span>
        )}
        <div className='flex items-center space-x-4'>
          {activity.kudosCount !== null && activity.kudosCount > 0 && (
            <span className='flex items-center'>
              <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z' />
              </svg>
              {activity.kudosCount}
            </span>
          )}
          {activity.commentCount !== null && activity.commentCount > 0 && (
            <span className='flex items-center'>
              <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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
      </div>
    </div>
  );
}
