import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShoppingCartProvider } from './context/ShoppingCartContext';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import Background from './components/Background';

function App() {
  return (
    <ShoppingCartProvider>
      <Router>
        <Background />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </ShoppingCartProvider>
  );
}

export default App;