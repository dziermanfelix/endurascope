import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { WeeklyChartPage } from './pages/WeeklyChartPage';
import { ManageTrainingBlocksPage } from './pages/ManageTrainingBlocksPage';

function Navigation() {
  const location = useLocation();

  return (
    <nav className='bg-white border-b border-gray-200 mb-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex space-x-8'>
          <Link
            to='/weekly'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/weekly' || location.pathname === '/'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Weekly Breakdown
          </Link>
          <Link
            to='/activities'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/activities'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activities
          </Link>
          <Link
            to='/training-blocks'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/training-blocks'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Training Blocks
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <header className='mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>Endurascope</h1>
            <p className='text-gray-600'>Your Strava activities</p>
          </header>

          <Navigation />

          <Routes>
            <Route path='/' element={<WeeklyChartPage />} />
            <Route path='/weekly' element={<WeeklyChartPage />} />
            <Route path='/activities' element={<ActivitiesPage />} />
            <Route path='/training-blocks' element={<ManageTrainingBlocksPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
