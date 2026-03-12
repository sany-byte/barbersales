import React, { useState, useEffect } from 'react';
import Drawer from '../components/Drawer';
import Dropdown from '../components/Dropdown';
import './Records.css';

const API_URL = import.meta.env.VITE_API_URL;

const Records = ({ role, setActiveTab }) => {
    const [records, setRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Fetch records
    useEffect(() => {
        fetch(`${API_URL}/appointments`)
            .then(res => res.json())
            .then(data => {
                // Map backend data to frontend format
                const formattedRecords = data.map(app => {
                    const dateObj = new Date(app.startTime);
                    const dateStr = dateObj.toLocaleDateString('ru-RU') + ' ' + dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

                    return {
                        id: app.id,
                        originalId: app.id,
                        displayId: 'R' + app.id.substring(0, 4).toUpperCase(),
                        date: dateStr,
                        client: app.client.name,
                        phone: app.client.phone,
                        service: app.service.name,
                        master: app.master.name,
                        cost: app.finalPrice,
                        status: app.status
                    };
                });
                setRecords(formattedRecords);
            })
            .catch(err => console.error('Failed to load appointments', err));
    }, []);

const getStatusBadge = (status) => {
    switch (status) {
        case 'new': return <span className="badge badge-new">Новая</span>;
        case 'in-chair': return <span className="badge badge-in-chair">В кресле</span>;
        case 'completed': return <span className="badge badge-completed">Завершена</span>;
        case 'cancelled': return <span className="badge badge-cancelled">Отменена</span>;
        default: return null;
    }
};



    const statusOptions = [
        { value: 'all', label: 'Все статусы' },
        { value: 'new', label: 'Новая' },
        { value: 'in-chair', label: 'В кресле' },
        { value: 'completed', label: 'Завершена' },
        { value: 'cancelled', label: 'Отменена' }
    ];

    // Фильтрация записей
    let filteredRecords = records.filter(record => {
        // Поиск по клиенту/телефону

        // Поиск по клиенту/телефону
        if (searchQuery && !record.client.toLowerCase().includes(searchQuery.toLowerCase()) && !record.phone.includes(searchQuery)) {
            return false;
        }

        // Фильтр статусов
        if (statusFilter !== 'all' && record.status !== statusFilter) {
            return false;
        }

        return true;
    });

    return (
        <div className="records-container">
            <button className="btn-outline" style={{ width: 'fit-content' }} onClick={() => setActiveTab('dashboard')}>&larr; Назад на Дашборд</button>
            <div className="card table-card">
                <div className="records-header-bar">
                    <h3>Все записи</h3>
                    <div className="records-filters">
                        <input
                            type="text"
                            className="records-search"
                            placeholder="Поиск по клиенту / тел..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Dropdown
                            className="records-filter-select"
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ minWidth: '160px' }}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Дата и Время</th>
                                <th>Клиент</th>
                                <th>Услуга</th>
                                { (role === 'admin' || role === 'owner') && <th>Мастер</th>}
                                <th className="text-right">Стоимость</th>
                                <th className="text-center">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? filteredRecords.map((rec) => (
                                <tr key={rec.originalId} onClick={() => { setSelectedRecord(rec); setDrawerOpen(true); }} style={{ cursor: 'pointer' }}>
                                    <td className="text-secondary">{rec.displayId}</td>
                                    <td>{rec.date}</td>
                                    <td>
                                        <div className="font-medium">{rec.client}</div>
                                        <div className="text-secondary" style={{ fontSize: '11px' }}>{rec.phone}</div>
                                    </td>
                                    <td>{rec.service}</td>
                                    { (role === 'admin' || role === 'owner') && <td>{rec.master}</td>}
                                    <td className="text-right font-medium">{rec.cost} ₽</td>
                                    <td className="text-center">{getStatusBadge(rec.status)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={(role === 'admin' || role === 'owner') ? 7 : 6} className="text-center" style={{ padding: '40px', color: '#999' }}>
                                        Записи не найдены
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Drawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    // Refresh records after drawer closes (in case status changed)
                    fetch(`${API_URL}/appointments`)
                        .then(res => res.json())
                        .then(data => {
                            const formattedRecords = data.map(app => {
                                const dateObj = new Date(app.startTime);
                                const dateStr = dateObj.toLocaleDateString('ru-RU') + ' ' + dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                                return { id: app.id, originalId: app.id, displayId: 'R' + app.id.substring(0, 4).toUpperCase(), date: dateStr, client: app.client.name, phone: app.client.phone, service: app.service.name, master: app.master.name, cost: app.finalPrice, status: app.status };
                            });
                            setRecords(formattedRecords);
                        })
                        .catch(err => console.error('Failed to reload appointments', err));
                }}
                record={selectedRecord}
                role={role}
            />
        </div>
    );
};

export default Records;
