// App.js
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom'; // Cambiado a HashRouter
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/common/Navbar';
import AuthWrapper from './components/auth/AuthWrapper';

import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import AgendarPage from './pages/AgendarPage';
import ReportesPage from './pages/ReportesPage';
import EvaluacionPage from './pages/EvaluacionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Router> {/* Ahora es HashRouter */}
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow pb-16 md:pb-0">
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={<AuthWrapper><HomePage /></AuthWrapper>} />
            <Route path="/calendario" element={<AuthWrapper><CalendarPage /></AuthWrapper>} />
            <Route path="/agendar" element={<AuthWrapper><AgendarPage /></AuthWrapper>} />
            <Route path="/reportes" element={<AuthWrapper><ReportesPage /></AuthWrapper>} />
            <Route path="/evaluacion" element={<AuthWrapper><EvaluacionPage /></AuthWrapper>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}