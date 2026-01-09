import { useState } from 'react';
import { Activity } from '../types/activity';
import { formatDate, formatPace, formatTimeFromSecondsSimple } from '../util/time';
import CloseIcon from '../components/CloseIcon';
import { updateActivityName } from '../api/activities';
import { useActivities } from '../contexts/ActivitiesContext';

interface ActivityModalProps {
  activity: Activity;
  onClose: () => void;
}

export const ActivityModal = ({ activity, onClose }: ActivityModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(activity.name || '');
  const [nameBeforeEdit, setNameBeforeEdit] = useState(editedName);
  const [isSaving, setIsSaving] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  const { loadActivities } = useActivities();

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNameBeforeEdit(editedName);
    setIsEditing(true);
    setEditMessage('');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameSubmit = async () => {
    if (nameBeforeEdit === editedName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setEditMessage('Saving name...');
    try {
      await updateActivityName(activity.stravaId.toString(), editedName.trim());
      setIsEditing(false);
      setEditedName(editedName.trim());
      setEditMessage('Name saved!');
      await loadActivities();
    } catch (error) {
      setEditMessage('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameCancel = () => {
    setEditedName(nameBeforeEdit);
    setIsEditing(false);
    setEditMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      if (isEditing) {
        e.stopPropagation();
        handleNameCancel();
      }
    }
  };

  const pace = formatPace(activity.averageSpeed);
  const averageSpeedMph = activity.averageSpeed !== null ? (activity.averageSpeed * 2.23694).toFixed(1) : null;
  const elevationGainFeet =
    activity.totalElevationGain !== null ? Math.round(activity.totalElevationGain * 3.28084) : null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4' onClick={onClose}>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm' />
      {/* Modal Content */}
      <div
        className='bg-white relative rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 flex items-start justify-between rounded-xl p-3' onClick={handleNameClick}>
          <div className='flex-1'>
            {activity.startDateLocal && (
              <div className='text-sm text-gray-500 mb-2'>{formatDate(activity.startDateLocal)}</div>
            )}
            <div className='text-lg font-bold text-gray-900 hover:shadow-md hover:border-gray-300 hover:cursor-pointer shadow-sm border border-gray-200 transition-colors rounded p-2'>
              {isEditing ? (
                <input
                  type='text'
                  value={editedName}
                  onChange={handleNameChange}
                  onBlur={handleNameSubmit}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className='w-full outline-none border-none p-0 m-0'
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3>{editedName || 'Unnamed Activity'}</h3>
              )}
            </div>
            {editMessage && <div className='text-sm text-gray-500 mb-2'>{editMessage}</div>}
          </div>
          <button
            onClick={onClose}
            className='ml-4 text-gray-400 hover:text-gray-600 transition-colors'
            aria-label='Close'
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Primary stats */}
          <div className='grid grid-cols-3 gap-6 pb-6 border-b border-gray-200'>
            {activity.distance !== null ? (
              <div className='text-center'>
                <p className='text-4xl font-bold text-gray-900'>{activity.distance.toFixed(2)}</p>
                <p className='text-sm text-gray-500 mt-1'>miles</p>
              </div>
            ) : (
              <div className='text-center'>
                <p className='text-4xl font-bold text-gray-400'>—</p>
                <p className='text-sm text-gray-400 mt-1'>distance</p>
              </div>
            )}

            {pace !== null ? (
              <div className='text-center'>
                <p className='text-4xl font-bold text-gray-900'>{pace}</p>
                <p className='text-sm text-gray-500 mt-1'>pace</p>
              </div>
            ) : (
              <div className='text-center'>
                <p className='text-4xl font-bold text-gray-400'>—</p>
                <p className='text-sm text-gray-400 mt-1'>pace</p>
              </div>
            )}

            {activity.movingTime !== null ? (
              <div className='text-center'>
                <p className='text-4xl font-bold text-gray-900'>{formatTimeFromSecondsSimple(activity.movingTime)}</p>
                <p className='text-sm text-gray-500 mt-1'>moving time</p>
              </div>
            ) : (
              <div className='text-center'>
                <p className='text-4xl font-bold text-gray-400'>—</p>
                <p className='text-sm text-gray-400 mt-1'>time</p>
              </div>
            )}
          </div>

          {/* Additional stats */}
          <div className='grid grid-cols-2 gap-6'>
            {/* Activity type */}
            {activity.type ? (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-xs text-gray-500 mb-1'>Activity Type</p>
                <p className='text-xl font-semibold text-gray-900'>{activity.type}</p>
              </div>
            ) : null}

            {/* Elapsed time */}
            {activity.elapsedTime !== null ? (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-xs text-gray-500 mb-1'>Elapsed Time</p>
                <p className='text-xl font-semibold text-gray-900'>
                  {formatTimeFromSecondsSimple(activity.elapsedTime)}
                </p>
              </div>
            ) : null}

            {/* Elevation gain */}
            {elevationGainFeet !== null && elevationGainFeet > 0 ? (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-xs text-gray-500 mb-1'>Elevation Gain</p>
                <p className='text-xl font-semibold text-gray-900'>{elevationGainFeet.toLocaleString()} ft</p>
              </div>
            ) : null}

            {/* Average speed */}
            {averageSpeedMph !== null ? (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-xs text-gray-500 mb-1'>Average Speed</p>
                <p className='text-xl font-semibold text-gray-900'>{averageSpeedMph} mph</p>
              </div>
            ) : null}

            {/* Heart rate */}
            {activity.averageHeartRate !== null && activity.averageHeartRate > 0 ? (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-xs text-gray-500 mb-1'>Average Heart Rate</p>
                <p className='text-xl font-semibold text-gray-900'>{activity.averageHeartRate} bpm</p>
              </div>
            ) : null}

            {/* Calories */}
            {activity.calories !== null && activity.calories > 0 ? (
              <div className='bg-gray-50 rounded-lg p-4'>
                <p className='text-xs text-gray-500 mb-1'>Calories</p>
                <p className='text-xl font-semibold text-gray-900'>{activity.calories.toLocaleString()}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
