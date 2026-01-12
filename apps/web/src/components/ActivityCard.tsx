import { Activity } from '../types/activity';
import { formatPace, formatTimeFromSeconds } from '../util/time';

interface ActivityCardProps {
  activity: Activity;
  onCardClick?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onCardClick }: ActivityCardProps) {
  const pace = formatPace(activity.averageSpeed);

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(activity);
    }
  };

  return (
    <div
      className='bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col h-full hover:cursor-pointer'
      onClick={handleCardClick}
    >
      <div className='grid grid-cols-4 gap-4 items-center'>
        <h3 className='text-lg font-bold text-gray-900 truncate'>{activity.name || 'Unnamed Activity'}</h3>
        {/* Primary stats: Distance, Pace, Time */}
        {activity.distance !== null ? (
          <div className='flex items-baseline gap-1 justify-center'>
            <p className='text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap'>
              {activity.distance.toFixed(2)}
            </p>
            <p className='text-xs text-gray-500'>mi</p>
          </div>
        ) : (
          <div className='flex items-baseline gap-1 justify-center'>
            <p className='text-2xl font-bold text-gray-400 leading-tight'>—</p>
            <p className='text-xs text-gray-400'>distance</p>
          </div>
        )}

        {pace !== null ? (
          <div className='flex items-baseline gap-1 justify-center'>
            <p className='text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap'>{pace}</p>
            <p className='text-xs text-gray-500'>pace</p>
          </div>
        ) : (
          <div className='flex items-baseline gap-1 justify-center'>
            <p className='text-2xl font-bold text-gray-400 leading-tight'>—</p>
            <p className='text-xs text-gray-400'>pace</p>
          </div>
        )}

        {activity.movingTime !== null ? (
          <div className='flex items-baseline gap-1 justify-center'>
            <p className='text-2xl font-bold text-gray-900 leading-tight whitespace-nowrap'>
              {formatTimeFromSeconds(activity.movingTime)}
            </p>
            <p className='text-xs text-gray-500'>time</p>
          </div>
        ) : (
          <div className='flex items-baseline gap-1 justify-center'>
            <p className='text-2xl font-bold text-gray-400 leading-tight'>—</p>
            <p className='text-xs text-gray-400'>time</p>
          </div>
        )}
      </div>
    </div>
  );
}
