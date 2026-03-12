import React from 'react';
import Dropdown from './Dropdown';
import '../App.css';

const branchOptions = [
    { value: 'main', label: 'Филиал: Центр (ул. Ленина)' },
    { value: 'second', label: 'Филиал: Северный' }
];

const roleOptions = [
    { value: 'owner', label: 'Режим: Владелец' },
    { value: 'admin', label: 'Режим: Администратор' },
    { value: 'master', label: 'Режим: Мастер' }
];


const Header = ({ title, role, setRole, toggleMenu }) => {
    return (
        <header className="header">
            <div className="header-left">
                <div className="main-logo">BarberSales</div>
                <Dropdown
                    options={branchOptions}
                    value="main"
                    onChange={() => { }}
                    className="branch-selector"
                    style={{ minWidth: '220px' }}
                />
                <div className="header-title">{title}</div>
            </div>
            <div className="header-right">
                <Dropdown
                    options={roleOptions}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ marginRight: '16px', minWidth: '170px' }}
                />
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">{role === 'owner' ? 'Иван Иванов' : role === 'admin' ? 'Админ Ольга' : 'Артем Смирнов'}</span>
                        <span className="user-role">{role === 'owner' ? 'Владелец (Owner)' : role === 'admin' ? 'Администратор (Admin)' : 'Мастер (Barber)'}</span>
                    </div>
                    <div className="avatar">{role === 'owner' ? 'ИИ' : role === 'admin' ? 'АО' : 'АС'}</div>
                </div>
            </div>
        </header>
    );
};

export default Header;
