import { WeeklyChart } from '../components/WeeklyChart';

export function WeeklyChartPage() {
  return (
    <>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900'>Weekly Training Progress</h2>
      </div>
      <WeeklyChart />
    </>
  );
}
