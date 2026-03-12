import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Widget from './pages/Widget';
import Records from './pages/Records';
import Services from './pages/Services';
import Users from './pages/Users';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('owner'); // 'owner' | 'admin' | 'master'
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'master' && (activeTab === 'widget' || activeTab === 'settings')) {
      setActiveTab('dashboard');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Финансы и Аналитика';
      case 'schedule': return 'Расписание и Смены';
      case 'widget': return 'Настройки виджета';
      case 'settings': return 'Настройки системы';
      case 'records': return 'История записей';
      case 'services': return 'Управление услугами';
      case 'users': return (role === 'admin' || role === 'owner') ? 'Команда и Права' : 'Мой профиль';
      default: return 'BarberSales';
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setIsMenuOpen(false); }}
        role={role}
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
      />

      <main className="main-content">
        <Header
          title={getPageTitle()}
          role={role}
          setRole={handleRoleChange}
          toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        />

        <div className="page-container">
          {activeTab === 'dashboard' && <Dashboard role={role} setActiveTab={setActiveTab} />}

          {activeTab === 'schedule' && <Schedule role={role} />}

          {activeTab === 'widget' && <Widget role={role} />}

          {activeTab === 'records' && <Records role={role} setActiveTab={setActiveTab} />}

          {activeTab === 'services' && <Services role={role} />}

          {activeTab === 'users' && <Users role={role} />}
        </div>
      </main>
    </div>
  );
}

export default App;
