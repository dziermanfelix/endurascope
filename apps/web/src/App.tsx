import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activities } from './pages/Activities';
import { Weekly } from './pages/Weekly';
import { TrainingBlocks } from './pages/TrainingBlocks';
import { ActivitiesProvider } from './contexts/ActivitiesContext';
import { TrainingBlocksProvider } from './contexts/TrainingBlocksContext';

function Navigation() {
  const location = useLocation();

  return (
    <nav className='bg-white border-b border-gray-200'>
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
            Weekly
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
      <div className='h-screen flex flex-col bg-gray-50'>
        <Navigation />
        <div className='flex-1 min-h-0 overflow-y-auto'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <ActivitiesProvider>
              <TrainingBlocksProvider>
                <Routes>
                  <Route path='/' element={<Weekly />} />
                  <Route path='/weekly' element={<Weekly />} />
                  <Route path='/activities' element={<Activities />} />
                  <Route path='/training-blocks' element={<TrainingBlocks />} />
                </Routes>
              </TrainingBlocksProvider>
            </ActivitiesProvider>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
