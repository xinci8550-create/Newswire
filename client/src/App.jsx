import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthGate from './components/AuthGate';
import BackToTop from './components/BackToTop';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import ArticlePage from './pages/ArticlePage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-links">
          <p>Built with React &amp; Express · RSS-powered · Deployable anywhere</p>
          <p className="muted">Summaries only — read the original articles at their source.</p>
        </div>
        <div className="footer-bottom">
          <div className="footer-brand">Newswire</div>
          <p className="footer-tag">A multi-source English news aggregator. Headlines © their original publishers.</p>
        </div>
      </div>
      <div className="footer-credit">Designed &amp; maintained with care by XinCi</div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/favorites" element={<AuthGate><FavoritesPage /></AuthGate>} />
          <Route path="/history" element={<AuthGate><HistoryPage /></AuthGate>} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
