import React from 'react';
import './Drawer.css';

const API_URL = import.meta.env.VITE_API_URL;

const Drawer = ({ isOpen, onClose, record, role }) => {
    if (!isOpen || !record) return null;

    const getStatusText = (status) => {
        switch (status) {
            case 'new': return 'Новая';
            case 'in-chair': return 'В кресле';
            case 'completed': return 'Завершена';
            case 'cancelled': return 'Отменена';
            default: return status;
        }
    };

    const updateStatus = (id, newStatus) => {
        fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
        .then(() => {
            onClose(); // Закрываем дровер, Records должен обновить список
        })
        .catch(err => console.error('Failed to update status', err));
    };

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className={`drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Детали записи</h2>
                    <button className="drawer-close" onClick={onClose}>&times;</button>
                </div>

                <div className="drawer-content">
                    <div className="drawer-section">
                        <div className="drawer-label">Статус</div>
                        <div className={`badge badge-${record.status}`}>{getStatusText(record.status)}</div>
                    </div>

                    <div className="drawer-section">
                        <div className="drawer-label">Дата и Время</div>
                        <div className="drawer-value">{record.date || record.time}</div>
                    </div>

                    <div className="drawer-section">
                        <div className="drawer-label">Услуга</div>
                        <div className="drawer-value font-medium">{record.service}</div>
                        {record.cost && <div className="drawer-subtext">Стоимость: {record.cost} ₽</div>}
                    </div>

                    <div className="drawer-section">
                        <div className="drawer-label">Клиент</div>
                        <div className="drawer-value">{record.client}</div>
                        {record.phone && <div className="drawer-subtext">{record.phone}</div>}
                    </div>

                    { (role === 'admin' || role === 'owner') && record.master && (
                        <div className="drawer-section">
                            <div className="drawer-label">Мастер</div>
                            <div className="drawer-value">{record.master}</div>
                        </div>
                    )}

                    {role === 'master' && record.masterCut && (
                        <div className="drawer-section">
                            <div className="drawer-label">Ожидаемая выплата</div>
                            <div className="drawer-value text-success font-medium">{record.masterCut} ₽</div>
                        </div>
                    )}

                    {role === 'master' && (
                        <div className="drawer-actions">
                            {record.status === 'new' && (
                                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => updateStatus(record.originalId, 'in-chair')}>
                                    Взять в работу
                                </button>
                            )}
                            {record.status === 'in-chair' && (
                                <button className="btn-success" style={{ width: '100%', marginBottom: '8px' }} onClick={() => updateStatus(record.originalId, 'completed')}>
                                    Завершить и оплатить
                                </button>
                            )}
                            {(record.status === 'new' || record.status === 'in-chair') && (
                                <button className="btn-outline text-danger" style={{ width: '100%' }} onClick={() => updateStatus(record.originalId, 'cancelled')}>
                                    Отменить запись
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Drawer;
