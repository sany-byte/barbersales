import React, { useState } from 'react';
import './Widget.css';

const MOCK_SERVICES = [
    { id: 's1', name: 'Мужская стрижка', price: 1500, time: '60 мин' },
    { id: 's2', name: 'Стрижка машинкой', price: 800, time: '30 мин' },
    { id: 's3', name: 'Моделирование бороды', price: 1000, time: '45 мин' },
    { id: 's4', name: 'Стрижка + Борода', price: 2300, time: '90 мин' }
];

const MOCK_MASTERS = [
    { id: 'm1', name: 'Артем Б.', rating: '4.9' },
    { id: 'm2', name: 'Кирилл М.', rating: '4.8' },
    { id: 'm3', name: 'Влад С.', rating: '5.0' }
];

const MOCK_TIMES = ['10:00', '11:30', '14:00', '15:30', '18:00'];

const sendNotification = (type, message) => {
    console.log(`[Notification System] Отправка [${type}] пользователю: ${message}`);
};

const Widget = ({ role }) => {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        service: null,
        master: null,
        time: null,
        phone: '',
        name: ''
    });

    const [notificationSettings, setNotificationSettings] = useState({
        smsEnabled: true,
        tgEnabled: false,
        smsTemplate: 'Ждем вас в Barbershop через {hours} часа. Ваша запись: {service}',
        tgTemplate: 'Привет! Вы записаны к мастеру {master} на {time}.'
    });

    const handleNextStep = (key, value) => {
        setBookingData({ ...bookingData, [key]: value });
        setStep(step + 1);
    };

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val) {
            setBookingData({ ...bookingData, phone: '' });
            return;
        }
        if (['7', '8', '9'].indexOf(val[0]) > -1) {
            if (val[0] === '9') val = '7' + val;
            let formatted = '+7 ';
            if (val.length > 1) formatted += '(' + val.substring(1, 4);
            if (val.length >= 5) formatted += ') ' + val.substring(4, 7);
            if (val.length >= 8) formatted += '-' + val.substring(7, 9);
            if (val.length >= 10) formatted += '-' + val.substring(9, 11);
            setBookingData({ ...bookingData, phone: formatted });
        } else {
            setBookingData({ ...bookingData, phone: '+' + val.substring(0, 15) });
        }
    };

    const submitBooking = (e) => {
        e.preventDefault();
        // Логируем бронирование и шлем нотификацию-заглушку
        console.log('--- Бронирование успешно ---', bookingData);
        if (notificationSettings.smsEnabled) {
            sendNotification('SMS', `Запись подтверждена. Клиент: ${bookingData.name}, Тел: ${bookingData.phone}`);
        }
        if (notificationSettings.tgEnabled) {
            sendNotification('Telegram', `Новая запись: ${bookingData.name} к мастеру id:${bookingData.master}`);
        }
        setStep(5); // Success step
    };

    const renderBookingStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="booking-step active">
                        <h4>Шаг 1: Выберите услугу</h4>
                        <div className="list-grid">
                            {MOCK_SERVICES.map(srv => (
                                <div key={srv.id} className="selectable-card" onClick={() => handleNextStep('service', srv.id)}>
                                    <div className="card-title">{srv.name}</div>
                                    <div className="card-details">
                                        <span>{srv.price} ₽</span>
                                        <span className="text-secondary">{srv.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="booking-step active">
                        <h4>Шаг 2: Выберите мастера</h4>
                        <div className="list-grid">
                            {MOCK_MASTERS.map(m => (
                                <div key={m.id} className="selectable-card" onClick={() => handleNextStep('master', m.id)}>
                                    <div className="card-title">{m.name}</div>
                                    <div className="card-details">
                                        <span className="badge badge-new">★ {m.rating}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-text" onClick={() => setStep(1)}>← Назад</button>
                    </div>
                );
            case 3:
                return (
                    <div className="booking-step active">
                        <h4>Шаг 3: Выберите время (Сегодня)</h4>
                        <div className="time-grid">
                            {MOCK_TIMES.map(t => (
                                <div key={t} className="time-slot" onClick={() => handleNextStep('time', t)}>
                                    {t}
                                </div>
                            ))}
                        </div>
                        <button className="btn-text" onClick={() => setStep(2)}>← Назад</button>
                    </div>
                );
            case 4:
                return (
                    <div className="booking-step active">
                        <h4>Шаг 4: Контактные данные</h4>
                        <form onSubmit={submitBooking}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder=" "
                                    required
                                    value={bookingData.name}
                                    onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                                />
                                <label>Имя</label>
                            </div>
                            <div className="input-group">
                                <input
                                    type="tel"
                                    placeholder=" "
                                    required
                                    value={bookingData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength={18}
                                />
                                <label>Телефон</label>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-text" onClick={() => setStep(3)}>← Назад</button>
                                <button type="submit" className="btn-primary">Подтвердить запись</button>
                            </div>
                        </form>
                    </div>
                );
            case 5:
                return (
                    <div className="booking-step active success-state">
                        <div className="success-icon">✓</div>
                        <h4>Вы успешно записаны!</h4>
                        <p className="text-secondary">Уведомление отправлено (см. консоль).</p>
                        <button className="btn-outline" style={{ marginTop: '16px' }} onClick={() => { setStep(1); setBookingData({}); }}>Создать новую запись</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="widget-page">
            {(role === 'admin' || role === 'owner') && (
                <div className="settings-section card">
                    <h3>Настройки уведомлений (Admin)</h3>
                    <p className="text-secondary mb-16">Настройка шаблонов и триггеров (метод sendNotification() пишет в консоль browser devtools).</p>

                    <div className="notification-toggles">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={notificationSettings.smsEnabled}
                                onChange={(e) => setNotificationSettings({ ...notificationSettings, smsEnabled: e.target.checked })}
                            />
                            <span>SMS-уведомления включены</span>
                        </label>
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={notificationSettings.tgEnabled}
                                onChange={(e) => setNotificationSettings({ ...notificationSettings, tgEnabled: e.target.checked })}
                            />
                            <span>Telegram бот включен</span>
                        </label>
                    </div>

                    <div className="input-group mt-16">
                        <input
                            type="text"
                            placeholder=" "
                            value={notificationSettings.smsTemplate}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, smsTemplate: e.target.value })}
                        />
                        <label>Шаблон SMS (напоминание)</label>
                    </div>

                    <div className="input-group">
                        <input
                            type="text"
                            placeholder=" "
                            value={notificationSettings.tgTemplate}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, tgTemplate: e.target.value })}
                        />
                        <label>Шаблон Telegram</label>
                    </div>
                </div>
            )}

            <div className="preview-section card">
                <h3>Предпросмотр виджета записи</h3>
                <div className="widget-container">
                    {/* Widget UI Progress */}
                    <div className="widget-progress">
                        <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}></div>
                        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
                        <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}></div>
                        <div className={`progress-line ${step >= 4 ? 'active' : ''}`}></div>
                        <div className={`progress-dot ${step >= 4 ? 'active' : ''}`}></div>
                    </div>

                    <div className="widget-body">
                        {renderBookingStep()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Widget;
