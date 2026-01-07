import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculatePace, formatTimeFromSecondsSimple } from '../util/time';
import { DayData } from '../pages/Weekly';

interface WeeklyChartProps {
  weekData: DayData[] | never[];
}

const WeeklyChart = ({ weekData }: WeeklyChartProps) => {
  return (
    <>
      {/* Bar Chart */}
      <ResponsiveContainer width='100%' height={400}>
        <BarChart data={weekData}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='dayLabel' />
          <YAxis label={{ value: 'Miles', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;

              const data = payload[0].payload as DayData;
              const miles = data.miles;
              const timeSeconds = data.time;

              const pace = calculatePace(miles, timeSeconds);
              const timeFormatted = formatTimeFromSecondsSimple(timeSeconds);

              return (
                <div className='bg-white border border-gray-200 rounded-lg shadow-lg p-3'>
                  <p className='font-semibold text-gray-900 mb-2'>{label}</p>
                  <div className='space-y-1 text-sm'>
                    <div className='text-gray-700'>
                      Miles: <span className='font-medium'>{miles.toFixed(2)}</span>
                    </div>
                    {pace && (
                      <div className='text-gray-700'>
                        Pace: <span className='font-medium'>{pace}</span>
                      </div>
                    )}
                    {timeSeconds > 0 && (
                      <div className='text-gray-700'>
                        Time: <span className='font-medium'>{timeFormatted}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey='miles' fill='#3b82f6' radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};
export default WeeklyChart;
