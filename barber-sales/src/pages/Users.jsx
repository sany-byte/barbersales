import React, { useState } from 'react';
import '../components/Drawer.css';
import './Users.css';

const API_URL = import.meta.env.VITE_API_URL;

const Users = ({ role: currentUserRole }) => {
    const [users, setUsers] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [deletingUser, setDeletingUser] = useState(null);

    // Fetch initial users
    React.useEffect(() => {
        fetch(`${API_URL}/users`)
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error('Failed to load users', err));
    }, []);

    // В моковой системе предполагаем, что если мы под ролью master, то мы Артем Смирнов
    const currentMasterName = 'Артем Смирнов';

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setEditForm({ ...user });
    };

    const handleSave = () => {
        // Remove read-only or unwanted fields from the payload
        const { id, createdAt, updatedAt, ...dataToSave } = editForm;
        
        // If it's a new user (temporary ID starts with 'new_')
        if (typeof editingUserId === 'string' && editingUserId.startsWith('new_')) {
            fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            })
                .then(async res => {
                    if (!res.ok) throw new Error(await res.text());
                    return res.json();
                })
                .then(newUser => {
                    setUsers(users.map(u => u.id === editingUserId ? newUser : u));
                    setEditingUserId(null);
                })
                .catch(err => {
                    console.error('Failed to create user', err);
                    alert('Ошибка при создании пользователя');
                });
        } else {
            fetch(`${API_URL}/users/${editingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            })
                .then(async res => {
                    if (!res.ok) throw new Error(await res.text());
                    return res.json();
                })
                .then(updatedUser => {
                    setUsers(users.map(u => u.id === editingUserId ? updatedUser : u));
                    setEditingUserId(null);
                })
                .catch(err => {
                    console.error('Failed to update user:', err);
                    alert('Ошибка при сохранении пользователя: ' + err.message);
                });
        }
    };

    const handleCancel = () => {
        setEditingUserId(null);
    };

    const handleChange = (e) => {
        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (e.target.name === 'monthlyHoursLimit') {
            value = parseInt(value, 10);
            if (isNaN(value)) value = 0;
        }
        setEditForm({ ...editForm, [e.target.name]: value });
    };

    const confirmDelete = (user) => {
        setDeletingUser(user);
    };

    const handleDeleteUser = () => {
        if (!deletingUser) return;
        const id = deletingUser.id;
        
        fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (res.ok) {
                    setUsers(users.filter(u => u.id !== id));
                    if (editingUserId === id) setEditingUserId(null);
                    setDeletingUser(null);
                } else {
                    console.error('Failed to delete user');
                }
            })
            .catch(err => console.error('Failed to delete user', err));
    };

    const cancelDelete = () => {
        setDeletingUser(null);
    };

    // Если текущий админ или владелец - показываем всех. Если текущий мастер - показываем только себя.
    const displayUsers = (currentUserRole === 'admin' || currentUserRole === 'owner')
        ? users
        : users.filter(u => u.name === currentMasterName);

    const handleAddEmployee = () => {
        const newId = `new_${Date.now()}`;
        const newUser = {
            id: newId,
            name: '',
            role: 'master',
            phone: '',
            email: '',
            avatar: 'НС',
            specialization: '',
            status: 'Активен',
            isBookable: true,
            monthlyHoursLimit: 178
        };
        setUsers([newUser, ...users]);
        setEditingUserId(newId);
        setEditForm(newUser);
    };

    return (
        <div className="users-page">
            <div className="users-header-actions">
                {(currentUserRole === 'admin' || currentUserRole === 'owner') && (
                    <button className="primary-btn" onClick={handleAddEmployee}>
                        <span className="btn-icon">+</span> Добавить сотрудника
                    </button>
                )}
            </div>

            <div className="users-list">
                {displayUsers.map(user => {
                    const isEditing = editingUserId === user.id;

                    return (
                        <div key={user.id} className="user-card">
                            <div className="user-card-header">
                                <div className="user-avatar-lg">{user.avatar}</div>
                                <div className="user-title-info">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            value={editForm.name}
                                            onChange={handleChange}
                                            className="edit-input name-input"
                                            placeholder="Имя сотрудника"
                                        />
                                    ) : (
                                        <h3>{user.name}</h3>
                                    )}
                                    <div className="user-role-badge">
                                        {user.role === 'owner' ? 'Владелец' : user.role === 'admin' ? 'Администратор' : 'Мастер'}
                                    </div>
                                </div>
                                <div className="user-status">
                                    <span className={`status-dot ${user.status === 'Активен' ? 'active' : 'inactive'}`}></span>
                                    {user.status}
                                </div>
                            </div>
                            
                            {user.role === 'master' && (
                                <div className="bookable-toggle-container" style={{ margin: '0', backgroundColor: 'transparent', border: 'none', padding: '0 0 16px 0', borderBottom: '1px solid var(--color-border)', borderRadius: '0' }}>
                                    <label className="toggle-label">
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                name="isBookable"
                                                checked={isEditing ? (editForm.isBookable || false) : (user.isBookable || false)}
                                                onChange={(e) => {
                                                    if (isEditing) {
                                                        handleChange(e);
                                                    } else {
                                                        const newVal = !user.isBookable;
                                                        setUsers(users.map(u => u.id === user.id ? { ...u, isBookable: newVal } : u));
                                                        fetch(`${API_URL}/users/${user.id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ ...user, isBookable: newVal })
                                                        }).catch(err => {
                                                            console.error('Failed to toggle bookability', err);
                                                            // Revert optimistic update on error
                                                            setUsers(users.map(u => u.id === user.id ? { ...u, isBookable: !newVal } : u));
                                                        });
                                                    }
                                                }}
                                            />
                                            <span className="slider round"></span>
                                        </div>
                                        <span className="toggle-text" style={{ color: isEditing ? 'inherit' : (user.isBookable ? 'var(--color-success)' : 'var(--color-danger)'), fontWeight: isEditing ? 500 : 600 }}>
                                            {isEditing ? 'Принимать новые записи' : (user.isBookable ? 'Принимает записи (Онлайн открыт)' : 'Запись закрыта')}
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="user-details-grid">
                                <div className="detail-group">
                                    <span className="detail-label">Телефон</span>
                                    {isEditing ? (
                                        <input type="text" name="phone" value={editForm.phone} onChange={handleChange} className="edit-input" />
                                    ) : (
                                        <span className="detail-value">{user.phone}</span>
                                    )}
                                </div>
                                <div className="detail-group">
                                    <span className="detail-label">Email</span>
                                    {isEditing ? (
                                        <input type="email" name="email" value={editForm.email} onChange={handleChange} className="edit-input" />
                                    ) : (
                                        <span className="detail-value">{user.email}</span>
                                    )}
                                </div>
                                <div className="detail-group">
                                    <span className="detail-label">Специализация</span>
                                    {isEditing ? (
                                        <input type="text" name="specialization" value={editForm.specialization} onChange={handleChange} className="edit-input" />
                                    ) : (
                                        <span className="detail-value">{user.specialization}</span>
                                    )}
                                </div>
                                
                                {user.role === 'master' && (
                                    <div className="detail-group">
                                        <span className="detail-label">Часов в месяц</span>
                                        {isEditing ? (
                                            <input type="number" name="monthlyHoursLimit" value={editForm.monthlyHoursLimit ?? 178} onChange={handleChange} className="edit-input" />
                                        ) : (
                                            <span className="detail-value">{user.monthlyHoursLimit ?? 178} ч.</span>
                                        )}
                                    </div>
                                )}

                                { (currentUserRole === 'admin' || currentUserRole === 'owner') && isEditing && (
                                    <div className="detail-group">
                                        <span className="detail-label">Роль в системе</span>
                                        <select name="role" value={editForm.role} onChange={handleChange} className="edit-input">
                                            <option value="owner">Владелец</option>
                                            <option value="admin">Администратор</option>
                                            <option value="master">Мастер</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="user-card-actions">
                                {isEditing ? (
                                    <>
                                        <button className="secondary-btn" onClick={handleCancel}>Отмена</button>
                                        <button className="primary-btn" onClick={handleSave}>Сохранить</button>
                                    </>
                                ) : (
                                    <>
                                        {currentUserRole === 'owner' && (
                                            <button 
                                                className="secondary-btn" 
                                                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                                onClick={() => confirmDelete(user)}
                                            >
                                                Удалить
                                            </button>
                                        )}
                                        <button className="secondary-btn" onClick={() => handleEditClick(user)}>
                                            Редактировать
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Sliding Drawer Modal for Deletion Confirmation */}
            {deletingUser && <div className="drawer-overlay" onClick={cancelDelete} />}
            <div className={`drawer ${deletingUser ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Удаление сотрудника</h2>
                    <button className="drawer-close" onClick={cancelDelete}>&times;</button>
                </div>
                
                {deletingUser && (
                    <div className="drawer-content">
                        <p style={{ fontSize: '16px', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>
                            Вы уверены, что хотите удалить сотрудника <strong>{deletingUser.name}</strong>?
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--color-danger)', marginTop: '-8px' }}>
                            Это действие необратимо. Вся история и привязанные данные могут быть потеряны.
                        </p>

                        <div className="drawer-section" style={{ marginTop: '16px' }}>
                            <div className="drawer-label">Роль</div>
                            <div className="drawer-value">
                                {deletingUser.role === 'owner' ? 'Владелец' : deletingUser.role === 'admin' ? 'Администратор' : 'Мастер'}
                            </div>
                        </div>

                        <div className="drawer-actions" style={{ display: 'flex', gap: '12px' }}>
                            <button className="secondary-btn" style={{ flex: 1 }} onClick={cancelDelete}>Отмена</button>
                            <button 
                                className="primary-btn" 
                                style={{ flex: 1, backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' }} 
                                onClick={handleDeleteUser}
                            >
                                Да, удалить
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
