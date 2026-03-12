import React, { useState } from 'react';
import Dropdown from '../components/Dropdown';
import './Services.css';

const API_URL = import.meta.env.VITE_API_URL;

const Services = ({ role }) => {
    const [services, setServices] = useState([]);
    const [isEditing, setIsEditing] = useState(null);
    const [editForm, setEditForm] = useState({});

    React.useEffect(() => {
        fetch(`${API_URL}/services`)
            .then(res => res.json())
            .then(data => setServices(data))
            .catch(err => console.error('Failed to load services', err));
    }, []);

    const cutTypeOptions = [
        { value: 'percent', label: '%' },
        { value: 'fixed', label: '₽' }
    ];

    if (role !== 'admin' && role !== 'owner') {
        return <div className="p-20 text-secondary">У вас нет доступа к этому разделу.</div>;
    }

    const calculateMasterCut = (service) => {
        if (service.masterCutType === 'fixed') {
            return service.masterCutValue;
        } else {
            return (service.price * service.masterCutValue) / 100;
        }
    };

    const calculateMargin = (service) => {
        const cut = calculateMasterCut(service);
        return service.price - cut - (service.primeCost || 0);
    };

    const handleEditClick = (service) => {
        setIsEditing(service.id);
        setEditForm({ ...service });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setEditForm({});
    };

    const handleSaveEdit = () => {
        if (typeof isEditing === 'string' && isEditing.startsWith('new_')) {
            const { id, ...dataToSave } = editForm;
            fetch(`${API_URL}/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            })
                .then(res => res.json())
                .then(newService => {
                    setServices(services.map(s => s.id === isEditing ? newService : s));
                    setIsEditing(null);
                })
                .catch(err => console.error('Failed to create service', err));
        } else {
            fetch(`${API_URL}/services/${isEditing}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })
                .then(res => res.json())
                .then(updatedService => {
                    setServices(services.map(s => s.id === isEditing ? updatedService : s));
                    setIsEditing(null);
                })
                .catch(err => console.error('Failed to update service', err));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Удалить услугу?')) {
            if (typeof id === 'string' && id.startsWith('new_')) {
                setServices(services.filter(s => s.id !== id));
            } else {
                fetch(`${API_URL}/services/${id}`, {
                    method: 'DELETE'
                })
                    .then(() => {
                        setServices(services.filter(s => s.id !== id));
                    })
                    .catch(err => console.error('Failed to delete service', err));
            }
        }
    };

    const handleAddService = () => {
        const newId = `new_${Date.now()}`;
        const newService = {
            id: newId,
            name: 'Новая услуга',
            duration: 60,
            price: 1000,
            primeCost: 100,
            masterCutType: 'percent',
            masterCutValue: 40
        };
        setServices([...services, newService]);
        setIsEditing(newId);
        setEditForm(newService);
    };

    return (
        <div className="services-page">
            <div className="services-header">
                <h2>Управление услугами</h2>
                <button className="btn-primary" onClick={handleAddService}>+ Добавить услугу</button>
            </div>

            <div className="card table-responsive" style={{ padding: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Длительность (мин)</th>
                            <th>Стоимость (₽)</th>
                            <th>Себестоимость (₽)</th>
                            <th>Отчисления мастеру</th>
                            <th>Маржинальность</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(service => {
                            const isCurrentEdit = isEditing === service.id;
                            const masterCutAmount = calculateMasterCut(isCurrentEdit ? editForm : service);
                            const marginAmount = calculateMargin(isCurrentEdit ? editForm : service);
                            const marginPercent = Math.round((marginAmount / (isCurrentEdit ? editForm.price : service.price)) * 100) || 0;

                            return (
                                <tr key={service.id} className={isCurrentEdit ? 'editing-row' : ''}>
                                    <td>
                                        {isCurrentEdit ? (
                                            <input
                                                type="text"
                                                className="edit-input"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-medium">{service.name}</span>
                                        )}
                                    </td>
                                    <td>
                                        {isCurrentEdit ? (
                                            <input
                                                type="number"
                                                className="edit-input w-80"
                                                value={editForm.duration}
                                                onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span>{service.duration} мин</span>
                                        )}
                                    </td>
                                    <td>
                                        {isCurrentEdit ? (
                                            <input
                                                type="number"
                                                className="edit-input w-100"
                                                value={editForm.price}
                                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="font-medium text-primary">{service.price} ₽</span>
                                        )}
                                    </td>
                                    <td>
                                        {isCurrentEdit ? (
                                            <input
                                                type="number"
                                                className="edit-input w-80"
                                                value={editForm.primeCost}
                                                onChange={(e) => setEditForm({ ...editForm, primeCost: Number(e.target.value) })}
                                            />
                                        ) : (
                                            <span className="font-medium text-secondary">{service.primeCost || 0} ₽</span>
                                        )}
                                    </td>
                                    <td>
                                        {isCurrentEdit ? (
                                            <div className="edit-group">
                                                <input
                                                    type="number"
                                                    className="edit-input w-80"
                                                    value={editForm.masterCutValue}
                                                    onChange={(e) => setEditForm({ ...editForm, masterCutValue: Number(e.target.value) })}
                                                />
                                                <Dropdown
                                                    options={cutTypeOptions}
                                                    value={editForm.masterCutType}
                                                    onChange={(e) => setEditForm({ ...editForm, masterCutType: e.target.value })}
                                                    style={{ minWidth: '70px' }}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="font-medium">{masterCutAmount} ₽</span>
                                                <span className="text-secondary" style={{ fontSize: '12px', marginLeft: '6px' }}>
                                                    ({service.masterCutType === 'percent' ? `${service.masterCutValue}%` : 'фикс'})
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="font-medium text-success">{marginAmount} ₽</div>
                                        <div className="text-secondary" style={{ fontSize: '12px' }}>Рентабельность: {marginPercent}%</div>
                                    </td>
                                    <td>
                                        {isCurrentEdit ? (
                                            <div className="action-buttons">
                                                <button className="btn-success btn-small" onClick={handleSaveEdit}>Сохранить</button>
                                                <button className="btn-outline btn-small" onClick={handleCancelEdit}>Отмена</button>
                                            </div>
                                        ) : (
                                            <div className="action-buttons">
                                                <button className="btn-text btn-small" onClick={() => handleEditClick(service)}>Изменить</button>
                                                <button className="btn-text text-danger btn-small" onClick={() => handleDelete(service.id)}>Удалить</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {services.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center text-secondary" style={{ padding: '40px' }}>
                                    Услуг пока нет
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Services;
