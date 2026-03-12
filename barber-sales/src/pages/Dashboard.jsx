import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const getStatusBadge = (status) => {
    switch (status) {
        case 'new': return <span className="badge badge-new">Новая</span>;
        case 'in-chair': return <span className="badge badge-in-chair">В кресле</span>;
        case 'completed': return <span className="badge badge-completed">Завершена</span>;
        case 'cancelled': return <span className="badge badge-cancelled">Отменена</span>;
        default: return null;
    }
};

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = ({ role, setActiveTab }) => {
    const [period, setPeriod] = useState('today'); // today, week, month
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/appointments`)
            .then(res => res.json())
            .then(data => {
                // Map backend data to frontend transaction format
                const formattedTxs = data.map(app => {
                    const dateObj = new Date(app.startTime);
                    const dateStr = dateObj.toLocaleDateString('ru-RU') + ' ' + dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    
                    // Simple mock for masterCut since we don't have the full calculation logic here via DB yet
                    // In a real scenario, this would ideally come pre-calculated from the backend OR 
                    // we'd do the calculation based on service.masterCutType and service.masterCutValue.
                    let calculatedCut = 0;
                    if (app.service.masterCutType === 'fixed') {
                        calculatedCut = app.service.masterCutValue;
                    } else {
                        calculatedCut = (app.finalPrice * app.service.masterCutValue) / 100;
                    }

                    return {
                        id: app.id,
                        date: dateStr,
                        client: app.client.name,
                        service: app.service.name,
                        cost: app.finalPrice,
                        masterCut: calculatedCut || 0,
                        status: app.status
                    };
                });
                // Get only last 5 for dashboard
                setTransactions(formattedTxs.slice(0, 5));
            })
            .catch(err => console.error('Failed to load transactions for dashboard', err));
    }, []);

    const getDashboardData = () => {
        if (period === 'today') {
            return { revenue: '42 500 ₽', trend: '↑ 12% к вчерашнему дню', myRevenue: '3 800 ₽', myTrend: '↑ 5% к вчерашнему дню' };
        } else if (period === 'week') {
            return { revenue: '294 000 ₽', trend: '↑ 8% к прошлой неделе', myRevenue: '21 500 ₽', myTrend: '↑ 2% к прошлой неделе' };
        } else {
            return { revenue: '1 250 000 ₽', trend: '↑ 15% к прошлому месяцу', myRevenue: '85 000 ₽', myTrend: '↑ 10% к прошлому месяцу' };
        }
    };
    const data = getDashboardData();
    return (
        <div className="dashboard">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Сводка</h2>
                <div className="period-selector" style={{ display: 'flex', backgroundColor: '#f4f5f7', borderRadius: '6px', padding: '4px' }}>
                    <button className={`btn-outline ${period === 'today' ? 'active' : ''}`} style={period === 'today' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setPeriod('today')}>День</button>
                    <button className={`btn-outline ${period === 'week' ? 'active' : ''}`} style={period === 'week' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setPeriod('week')}>Неделя</button>
                    <button className={`btn-outline ${period === 'month' ? 'active' : ''}`} style={period === 'month' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setPeriod('month')}>Месяц</button>
                </div>
            </div>

            {/* Widgets Row */}
            <div className="widgets-grid">
                <div className="card widget-card">
                    <div className="widget-title">{(role === 'admin' || role === 'owner') ? 'Выручка' : 'Мой заработок'}</div>
                    <div className="widget-value">{(role === 'admin' || role === 'owner') ? data.revenue : data.myRevenue}</div>
                    <div className="widget-trend positive">{(role === 'admin' || role === 'owner') ? data.trend : data.myTrend}</div>
                </div>

                {(role === 'admin' || role === 'owner') && (
                    <>
                        <div className="card widget-card">
                            <div className="widget-title">Топ мастеров по возвращаемости</div>
                            <div className="widget-list">
                                <div className="list-item">1. Артем Б. (89%)</div>
                                <div className="list-item">2. Кирилл М. (82%)</div>
                                <div className="list-item">3. Влад С. (75%)</div>
                            </div>
                        </div>

                        <div className="card widget-card">
                            <div className="widget-title">Прогноз по выплатам мастерам</div>
                            <div className="widget-value">118 400 ₽</div>
                            <div className="widget-subtitle">До конца текущего месяца</div>
                        </div>
                    </>
                )}
            </div>

            {/* Transactions Table */}
            <div className="card table-card">
                <div className="table-header">
                    <h3>Последние транзакции</h3>
                    <button className="btn-primary" onClick={() => setActiveTab('records')}>Все записи</button>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Дата и Время</th>
                                <th>Клиент</th>
                                <th>Услуга</th>
                                <th className="text-right">Стоимость</th>
                                <th className="text-right">Доля мастера</th>
                                <th className="text-center">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{tx.date}</td>
                                    <td className="font-medium">{tx.client}</td>
                                    <td>{tx.service}</td>
                                    <td className="text-right font-medium">{tx.cost} ₽</td>
                                    <td className="text-right text-secondary">{tx.masterCut} ₽</td>
                                    <td className="text-center">{getStatusBadge(tx.status)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="text-center text-secondary" style={{padding: '20px'}}>Нет транзакций</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
