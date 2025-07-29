// File: src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import LoanTool from './pages/LoanTool';
import NotFound from './pages/NotFound';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-800">
        <header className="bg-pink-600 text-white p-4 shadow-md">
          <nav className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Scend</h1>
            <div className="space-x-4">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/loan" className="hover:underline">Loan Tool</Link>
              <Link to="/about" className="hover:underline">About Us</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </nav>
        </header>

        <main className="p-6 container mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/loan" element={<LoanTool />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="bg-gray-200 text-center py-4 text-sm">
          &copy; {new Date().getFullYear()} Scend Pty Ltd. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
