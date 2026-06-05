import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activities } from './pages/Activities';
import { BlockPlan } from './pages/BlockPlan';
import { Weekly } from './pages/Weekly';
import { TrainingBlocks } from './pages/TrainingBlocks';
import { Admin } from './pages/Admin';
import { ActivitiesProvider } from './contexts/ActivitiesContext';
import { TrainingBlocksProvider } from './contexts/TrainingBlocksContext';
import { SelectedTrainingBlockProvider } from './contexts/SelectedTrainingBlockContext';

function Navigation() {
  const location = useLocation();

  return (
    <nav className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex space-x-8'>
          <Link
            to='/plan'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/plan' || location.pathname === '/'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Plan
          </Link>
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
          <Link
            to='/admin'
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/admin'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const el = document.querySelector('.overflow-y-auto');
    el?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className='h-screen flex flex-col bg-gray-50'>
        <Navigation />
        <div className='flex-1 min-h-0 overflow-y-auto'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <ActivitiesProvider>
              <TrainingBlocksProvider>
                <SelectedTrainingBlockProvider>
                  <Routes>
                    <Route path='/' element={<BlockPlan />} />
                    <Route path='/plan' element={<BlockPlan />} />
                    <Route path='/weekly' element={<Weekly />} />
                    <Route path='/activities' element={<Activities />} />
                    <Route path='/training-blocks' element={<TrainingBlocks />} />
                    <Route path='/admin' element={<Admin />} />
                  </Routes>
                </SelectedTrainingBlockProvider>
              </TrainingBlocksProvider>
            </ActivitiesProvider>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
