import { useState } from 'react';

const WORKOUT_DEFINITIONS = [
  { code: 'Nx1', description: '(n) => n x 1 mi @ pace + 1:30 recover' },
  { code: 'LC', description: '(n,m) => n x m mi @ pace + 1 mi recover' },
  { code: 'LAD', description: '(a,b,c) => a mi @ pace + 1:30 recover; b mi @ pace + 1:30 recover; c mi @ pace + 1:30 recover' },
  { code: 'MPF', description: '(a,b) => a mi easy + b mi @ pace' },
];

export function WorkoutLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className='mb-6 border border-gray-200 rounded-lg bg-white'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50'
      >
        <span>Workout notation legend</span>
        <span className='text-gray-400'>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className='px-4 pb-4 space-y-2 border-t border-gray-100'>
          {WORKOUT_DEFINITIONS.map(({ code, description }) => (
            <p key={code} className='text-sm text-gray-600'>
              <span className='font-mono font-medium text-gray-800'>{code}</span> {description}
            </p>
          ))}
          <p className='text-xs text-gray-500 pt-1'>
            Use Type for easy, workout, or long. Put detailed prescriptions (e.g. Nx1(3), 10E + 4 steady) in Story.
            Interval result summaries are not parsed yet.
          </p>
        </div>
      )}
    </div>
  );
}
