import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { WeeklyChartPage } from './pages/WeeklyChartPage';

function Navigation() {
  const location = useLocation();

  return (
    <nav className='bg-white border-b border-gray-200 mb-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex space-x-8'>
          <Link
            to='/'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activities
          </Link>
          <Link
            to='/weekly'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/weekly'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Weekly Chart
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
            <Route path='/' element={<ActivitiesPage />} />
            <Route path='/weekly' element={<WeeklyChartPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
