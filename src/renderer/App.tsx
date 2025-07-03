import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import PerformancePage from './pages/PerformancePage';
import './App.css';

function Hello() {
  const navigate = useNavigate();
  return (
    <div className="main-container">
      <h1 className="title">性能监控平台</h1>
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
