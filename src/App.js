// App.js - USAR HashRouter NO BrowserRouter
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/common/Navbar';
import AuthWrapper from './components/auth/AuthWrapper';

// Importar tus páginas...
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import AgendarPage from './pages/AgendarPage';
import ReportesPage from './pages/ReportesPage';
import EvaluacionPage from './pages/EvaluacionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Router> {/* ¡HashRouter en lugar de BrowserRouter! */}
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pb-16 md:pb-0">
          <ToastContainer />
          <Routes>
            <Route path="/" element={<AuthWrapper><HomePage /></AuthWrapper>} />
            <Route path="/calendario" element={<AuthWrapper><CalendarPage /></AuthWrapper>} />
            <Route path="/agendar" element={<AuthWrapper><AgendarPage /></AuthWrapper>} />
            <Route path="/reportes" element={<AuthWrapper><ReportesPage /></AuthWrapper>} />
            <Route path="/evaluacion" element={<AuthWrapper><EvaluacionPage /></AuthWrapper>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}