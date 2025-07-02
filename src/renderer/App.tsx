import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PerformancePage from './pages/PerformancePage';
import icon from '../../assets/icon.svg';
import './App.css';

function Hello() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="Hello">
        <button type="button" onClick={() => navigate('/performance')}>
          查看性能
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/performance" element={<PerformancePage />} />
      </Routes>
    </Router>
  );
}
