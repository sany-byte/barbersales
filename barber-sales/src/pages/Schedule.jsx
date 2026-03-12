import React, { useState, useEffect } from 'react';
import Drawer from '../components/Drawer';
import './Schedule.css';


const API_URL = import.meta.env.VITE_API_URL;

const Schedule = ({ role }) => {
    // This logic was moved below state declarations

    const [adminPeriod, setAdminPeriod] = useState('day');
    const [masterPeriod, setMasterPeriod] = useState('day');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // State for toggled master slots logic
    const [unavailableSlots, setUnavailableSlots] = useState({});

    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [masters, setMasters] = useState([]);

    // Рассчитываем отработанные часы динамически для текущего месяца
    const myMaster = masters.length > 0 ? masters[0] : null;
    const myMasterId = myMaster ? myMaster.id : null;
    const maxMonthHours = myMaster?.monthlyHoursLimit || 178;
    const workedHours = React.useMemo(() => {
        if (!myMasterId) return 0;
        const thisMonth = currentDate.getMonth();
        const thisYear = currentDate.getFullYear();
        
        const myMonthAppointments = appointments.filter(a => {
            const d = new Date(a.startTime);
            return a.masterId === myMasterId &&
                   a.status === 'completed' &&
                   d.getMonth() === thisMonth &&
                   d.getFullYear() === thisYear;
        });

        // Calculate total hours based on (endTime - startTime)
        let totalMs = 0;
        myMonthAppointments.forEach(a => {
            totalMs += (new Date(a.endTime) - new Date(a.startTime));
        });
        
        return Math.floor(totalMs / (1000 * 60 * 60));
    }, [appointments, myMasterId, currentDate]);

    const progressPercent = Math.min((workedHours / maxMonthHours) * 100, 100);
    const isLimitReached = workedHours >= maxMonthHours;
    const isNearLimit = workedHours > maxMonthHours - 15; // Менее 15 часов до лимита

    const fetchAppointments = () => {
        fetch(`${API_URL}/appointments`)
            .then(res => res.json())
            .then(data => setAppointments(data))
            .catch(err => console.error('Failed to load appointments', err));
    };

    useEffect(() => {
        fetch(`${API_URL}/users`)
            .then(res => res.json())
            .then(data => setMasters(data.filter(u => u.role === 'master')))
            .catch(err => console.error('Failed to load users', err));

        fetchAppointments();
    }, []);

    const handlePrevDay = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    const formattedDate = currentDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    const openDrawer = (app) => {
        const dateObj = new Date(app.startTime);
        const dateStr = dateObj.toLocaleDateString('ru-RU') + ' ' + dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        setSelectedRecord({
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
        });
        setDrawerOpen(true);
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'new': return 'Новая';
            case 'in-chair': return 'В кресле';
            case 'completed': return 'Завершена';
            case 'cancelled': return 'Отменена';
            default: return status;
        }
    };

    const toggleSlotAvailability = (masterId, startTimeStr, durationChunks) => {
        const dateStr = currentDate.toISOString().split('T')[0];
        const [h, m] = startTimeStr.split(':').map(Number);
        
        setUnavailableSlots(prev => {
            const next = { ...prev };
            const isUnavailable = !!next[`${masterId}-${dateStr}-${startTimeStr}`];
            
            let currentH = h;
            let currentM = m;
            
            for (let i = 0; i < durationChunks; i++) {
                const timeStr = `${currentH}:${currentM === 0 ? '00' : '30'}`;
                const slotKey = `${masterId}-${dateStr}-${timeStr}`;
                
                if (isUnavailable) {
                    delete next[slotKey];
                } else {
                    next[slotKey] = true;
                }
                
                currentM += 30;
                if (currentM >= 60) {
                    currentH += 1;
                    currentM -= 60;
                }
            }
            return next;
        });
    };

    const handleOpenShift = () => {
        if (isLimitReached) {
            alert('Внимание: Достигнут лимит 178 часов в месяц. Открытие новых слотов заблокировано.');
            return;
        }
        alert('Смена успешно открыта.');
    };

    const getMasterBlocks = (masterId) => {
        if (!masterId) return [];
        const todaysApps = appointments.filter(a => {
            const d = new Date(a.startTime);
            return a.masterId === masterId &&
                d.getDate() === currentDate.getDate() &&
                d.getMonth() === currentDate.getMonth() &&
                d.getFullYear() === currentDate.getFullYear();
        });

        const chunks = [];
        for (let h = 10; h <= 20; h++) {
            chunks.push({ timeStr: `${h}:00`, hour: h, minutes: 0, isHalf: false, type: 'free', app: null });
            chunks.push({ timeStr: `${h}:30`, hour: h, minutes: 30, isHalf: true, type: 'free', app: null });
        }

        todaysApps.forEach(app => {
            const st = new Date(app.startTime);
            const et = new Date(app.endTime);
            const startH = st.getHours();
            const startM = st.getMinutes();
            const endH = et.getHours();
            const endM = et.getMinutes();

            const startIndex = (startH - 10) * 2 + (startM >= 30 ? 1 : 0);
            const endIndex = Math.max(startIndex + 1, (endH - 10) * 2 + (endM >= 30 ? 1 : 0));

            for (let i = startIndex; i < endIndex && i < chunks.length; i++) {
                chunks[i].type = 'app';
                chunks[i].app = app;
            }
        });

        for (let i = 0; i < chunks.length; i++) {
            if (chunks[i].type === 'free') {
                const slotKey = `${masterId}-${currentDate.toISOString().split('T')[0]}-${chunks[i].timeStr}`;
                if (unavailableSlots[slotKey]) {
                    chunks[i].type = 'unavailable';
                }
            }
        }

        const renderBlocks = [];
        let i = 0;
        while (i < chunks.length) {
            const chunk = chunks[i];

            if (chunk.type === 'app') {
                let j = i + 1;
                while (j < chunks.length && chunks[j].type === 'app' && chunks[j].app.id === chunk.app.id) {
                    j++;
                }
                renderBlocks.push({
                    type: 'app',
                    app: chunk.app,
                    startTime: chunk.timeStr,
                    durationChunks: j - i,
                    key: `app-${chunk.app.id}-${chunk.timeStr}`
                });
                i = j;
            } else if (chunk.type === 'unavailable') {
                if (!chunk.isHalf && i + 1 < chunks.length && chunks[i+1].type === 'unavailable') {
                    renderBlocks.push({ type: 'unavailable', startTime: chunk.timeStr, durationChunks: 2, key: `unavail-${chunk.timeStr}` });
                    i += 2;
                } else {
                    renderBlocks.push({ type: 'unavailable', startTime: chunk.timeStr, durationChunks: 1, key: `unavail-${chunk.timeStr}` });
                    i++;
                }
            } else {
                if (!chunk.isHalf && i + 1 < chunks.length && chunks[i+1].type === 'free') {
                    renderBlocks.push({ type: 'free', startTime: chunk.timeStr, durationChunks: 2, key: `free-${chunk.timeStr}` });
                    i += 2;
                } else {
                    renderBlocks.push({ type: 'free', startTime: chunk.timeStr, durationChunks: 1, key: `free-${chunk.timeStr}` });
                    i++;
                }
            }
        }
        return renderBlocks;
    };

    return (
        <div className="schedule-container">
            {/* ProgressBar Panel */}
            {role === 'master' && (
                <div className="card progress-card">
                    <div className="progress-header">
                        <h3>Отработано часов в этом месяце (Лимит: {maxMonthHours} ч)</h3>
                        <span className={`hours-counter ${isLimitReached ? 'danger' : isNearLimit ? 'warning' : 'success'}`}>
                            {workedHours} / {maxMonthHours} ч
                        </span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className={`progress-bar-fill ${isLimitReached ? 'danger' : isNearLimit ? 'warning' : 'success'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="progress-actions">
                        <button
                            className="btn-primary"
                            onClick={handleOpenShift}
                            disabled={isLimitReached}
                        >
                            Выйти в смену (Открыть слоты)
                        </button>
                        {isLimitReached && (
                            <p className="error-text">Выработка достигла 178 часов. Открытие новых слотов невозможно.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Calendar Grid - Шахматка Владельца */}
            {(role === 'admin' || role === 'owner') && (
                <div className="card calendar-card">
                    <div className="calendar-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3>Шахматка записей</h3>
                            <div className="period-selector" style={{ display: 'flex', backgroundColor: '#f4f5f7', borderRadius: '6px', padding: '4px', width: 'fit-content' }}>
                                <button className={`btn-outline ${adminPeriod === 'day' ? 'active' : ''}`} style={adminPeriod === 'day' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setAdminPeriod('day')}>День</button>
                                <button className={`btn-outline ${adminPeriod === 'week' ? 'active' : ''}`} style={adminPeriod === 'week' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setAdminPeriod('week')}>Неделя</button>
                                <button className={`btn-outline ${adminPeriod === 'month' ? 'active' : ''}`} style={adminPeriod === 'month' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setAdminPeriod('month')}>Месяц</button>
                            </div>
                        </div>
                        <div className="calendar-controls">
                            <button className="btn-outline" onClick={handlePrevDay}>&lt; Пред.</button>
                            <span style={{ fontWeight: 500, margin: '0 12px' }}>{formattedDate}</span>
                            <button className="btn-outline" onClick={handleNextDay}>След. &gt;</button>
                        </div>
                    </div>

                    {adminPeriod === 'day' && (
                        <div className="calendar-grid" style={{ gridTemplateColumns: `80px repeat(${masters.length > 0 ? masters.length : 1}, 1fr)` }}>
                            {/* Timeline */}
                            <div className="time-col">
                                <div className="time-cell header-cell">Время</div>
                                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => (
                                    <div key={hour} className="time-cell">{hour}:00</div>
                                ))}
                            </div>

                            {/* Masters Columns */}
                            {masters.length === 0 && <div style={{padding: '20px'}}>Нет мастеров</div>}
                            {masters.map(master => {
                                const blocks = getMasterBlocks(master.id);
                                return (
                                <div key={master.id} className="master-col">
                                    <div className="master-cell header-cell">{master.name}</div>
                                    
                                    {blocks.map(block => {
                                        const heightPx = block.durationChunks * 60;
                                        if (block.type === 'app') {
                                            const st = new Date(block.app.startTime);
                                            const et = new Date(block.app.endTime);
                                            const timeStr = `${st.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})} - ${et.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}`;
                                            return (
                                                <div 
                                                    key={block.key} 
                                                    className="master-cell slot-booked" 
                                                    style={{ height: `${heightPx}px`, display: 'flex', flexDirection: 'column', borderLeft: '4px solid var(--color-text-primary)', zIndex: 10, backgroundColor: '#ffffff', overflow: 'hidden' }}
                                                    onClick={() => openDrawer(block.app)}
                                                >
                                                    <div style={{fontWeight: 600, marginBottom: '6px', fontSize: '13px'}}>{block.app.service.name}</div>
                                                    <div style={{fontSize: '11px', color: '#555', marginBottom: '2px'}}>{timeStr}</div>
                                                    <div style={{fontSize: '12px', fontWeight: 500, marginTop: '4px'}}>{block.app.client.name}</div>
                                                    <div style={{
                                                        fontSize: '10px', 
                                                        marginTop: '6px', 
                                                        textTransform: 'uppercase', 
                                                        fontWeight: 600,
                                                        color: block.app.status === 'in-chair' ? '#007BFF' : block.app.status === 'completed' ? '#28a745' : '#6c757d' 
                                                    }}>
                                                        {getStatusText(block.app.status)}
                                                    </div>
                                                </div>
                                            );
                                        } else if (block.type === 'unavailable') {
                                            return (
                                                <div 
                                                    key={block.key} 
                                                    className="master-cell slot-unavailable" 
                                                    style={{ height: `${heightPx}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => toggleSlotAvailability(master.id, block.startTime, block.durationChunks)}
                                                >
                                                    Слот закрыт {block.durationChunks === 1 ? '(30 мин)' : ''}
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div 
                                                    key={block.key} 
                                                    className="master-cell slot-available" 
                                                    style={{ height: `${heightPx}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}
                                                    onClick={() => toggleSlotAvailability(master.id, block.startTime, block.durationChunks)}
                                                >
                                                    Свободно {block.durationChunks === 1 ? '(30 мин)' : ''}
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                                );
                            })}
                        </div>
                    )}

                    {adminPeriod === 'week' && (
                        <div className="table-responsive">
                            <table className="data-table" style={{ marginTop: '16px' }}>
                                <thead>
                                    <tr>
                                        <th>Мастер</th>
                                        <th>Пн 19.10</th>
                                        <th>Вт 20.10</th>
                                        <th>Ср 21.10</th>
                                        <th>Чт 22.10</th>
                                        <th>Пт 23.10</th>
                                        <th>Сб 24.10</th>
                                        <th>Вс 25.10</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="font-medium">Артем Смирнов</td>
                                        <td className="text-center"><div className="badge badge-completed">8 записей</div></td>
                                        <td className="text-center"><div className="badge badge-completed">10 записей</div></td>
                                        <td className="text-center"><div className="badge badge-new">7 записей</div></td>
                                        <td className="text-center text-secondary">Выходной</td>
                                        <td className="text-center text-secondary">Выходной</td>
                                        <td className="text-center"><div className="badge badge-new">12 записей</div></td>
                                        <td className="text-center"><div className="badge badge-new">11 записей</div></td>
                                    </tr>
                                    <tr>
                                        <td className="font-medium">Кирилл Петров</td>
                                        <td className="text-center text-secondary">Выходной</td>
                                        <td className="text-center"><div className="badge badge-completed">9 записей</div></td>
                                        <td className="text-center"><div className="badge badge-new">6 записей</div></td>
                                        <td className="text-center"><div className="badge badge-new">10 записей</div></td>
                                        <td className="text-center"><div className="badge badge-new">8 записей</div></td>
                                        <td className="text-center text-secondary">Выходной</td>
                                        <td className="text-center text-secondary">Выходной</td>
                                    </tr>
                                    <tr>
                                        <td className="font-medium">Влад Соколов</td>
                                        <td className="text-center"><div className="badge badge-completed">5 записей</div></td>
                                        <td className="text-center text-secondary">Выходной</td>
                                        <td className="text-center"><div className="badge badge-new">8 записей</div></td>
                                        <td className="text-center text-secondary">Выходной</td>
                                        <td className="text-center"><div className="badge badge-new">11 записей</div></td>
                                        <td className="text-center"><div className="badge badge-new">9 записей</div></td>
                                        <td className="text-center text-secondary">Выходной</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {adminPeriod === 'month' && (
                        <div className="table-responsive">
                            <table className="data-table" style={{ marginTop: '16px', minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        <th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map(week => (
                                        <tr key={week}>
                                            {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                                const date = (week - 1) * 7 + day;
                                                const records = Math.floor(Math.random() * 30) + 5;
                                                const revenue = records * 1500;
                                                return (
                                                    <td key={day} style={{ verticalAlign: 'top', height: '80px', borderRight: '1px solid #eee', padding: '8px' }}>
                                                        <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>{date} Окт</div>
                                                        {date <= 31 && (
                                                            <>
                                                                <div className="font-medium" style={{ fontSize: '14px' }}>{records} зап.</div>
                                                                <div className="text-success" style={{ fontSize: '12px' }}>{revenue.toLocaleString()} ₽</div>
                                                            </>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {/* Personal Schedule - Календарь Мастера */}
            {role === 'master' && (
                <div className="card calendar-card">
                    <div className="calendar-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3>Моё расписание</h3>
                            <div className="period-selector" style={{ display: 'flex', backgroundColor: '#f4f5f7', borderRadius: '6px', padding: '4px', width: 'fit-content' }}>
                                <button className={`btn-outline ${masterPeriod === 'day' ? 'active' : ''}`} style={masterPeriod === 'day' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setMasterPeriod('day')}>День</button>
                                <button className={`btn-outline ${masterPeriod === 'week' ? 'active' : ''}`} style={masterPeriod === 'week' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setMasterPeriod('week')}>Неделя</button>
                                <button className={`btn-outline ${masterPeriod === 'month' ? 'active' : ''}`} style={masterPeriod === 'month' ? { backgroundColor: 'white', borderColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { border: 'none', background: 'transparent' }} onClick={() => setMasterPeriod('month')}>Месяц</button>
                            </div>
                        </div>
                        <div className="calendar-controls">
                            <button className="btn-outline" onClick={handlePrevDay}>&lt; Пред.</button>
                            <span style={{ fontWeight: 500, margin: '0 12px' }}>{formattedDate}</span>
                            <button className="btn-outline" onClick={handleNextDay}>След. &gt;</button>
                        </div>
                    </div>

                    {masterPeriod === 'day' && (
                        <div className="personal-schedule-grid">
                            <div className="time-row header-row">
                                <div className="time-col-small">Время</div>
                                <div className="slot-col-wide">Статус / Запись</div>
                            </div>

                            {masters.length > 0 && getMasterBlocks(masters[0].id).map(block => {
                                const heightPx = block.durationChunks * 60;
                                let timeLabel = '';
                                const [h, m] = block.startTime.split(':').map(Number);
                                let hr = h + Math.floor((m + block.durationChunks * 30)/60);
                                let mr = (m + block.durationChunks * 30) % 60;
                                const endTimeStr = `${hr}:${mr === 0 ? '00' : '30'}`;

                                if (block.type === 'app') {
                                    const st = new Date(block.app.startTime);
                                    const et = new Date(block.app.endTime);
                                    timeLabel = `${st.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})} - ${et.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}`;
                                    
                                    let badgeClass = 'new';
                                    if (block.app.status === 'in-chair') badgeClass = 'in-chair';
                                    if (block.app.status === 'completed') badgeClass = 'completed';
                                    if (block.app.status === 'cancelled') badgeClass = 'cancelled';
                                    
                                    return (
                                        <div key={block.key} className="time-row" style={{ height: `${heightPx}px` }}>
                                            <div className="time-col-small" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>{timeLabel}</div>
                                            <div className="slot-col-wide master-slot booked" style={{ height: '100%' }} onClick={() => openDrawer(block.app)}>
                                                <div className="slot-info">
                                                    <span className="slot-title">{block.app.client.name} ({block.app.service.name})</span>
                                                </div>
                                                <span className={`badge badge-${badgeClass}`}>{getStatusText(block.app.status)}</span>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    timeLabel = `${block.startTime} - ${endTimeStr}`;
                                    const isUnavailable = block.type === 'unavailable';
                                    const myMasterId = masters[0].id;
                                    
                                    return (
                                        <div key={block.key} className="time-row" style={{ height: `${heightPx}px` }}>
                                            <div className="time-col-small" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>{timeLabel}</div>
                                            <div 
                                                className={`slot-col-wide master-slot ${isUnavailable ? 'unavailable' : 'available'}`}
                                                style={{ height: '100%', display: 'flex', alignItems: 'center' }}
                                                onClick={() => toggleSlotAvailability(myMasterId, block.startTime, block.durationChunks)}
                                            >
                                                {isUnavailable 
                                                    ? `Слот закрыт${block.durationChunks === 1 ? ' (30 мин)' : ''} (Нажмите, чтобы открыть)` 
                                                    : `Свободное время${block.durationChunks === 1 ? ' (30 мин)' : ''} (Нажмите, чтобы закрыть слот)`}
                                            </div>
                                        </div>
                                    );
                                }
                            })}

                        </div>
                    )}

                    {masterPeriod === 'week' && (
                        <div className="table-responsive">
                            <table className="data-table" style={{ marginTop: '16px' }}>
                                <thead>
                                    <tr>
                                        <th>День</th>
                                        <th>Статус</th>
                                        <th>Записей</th>
                                        <th>Доход</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>Пн 19.10</td><td><span className="badge badge-completed">Отработал</span></td><td className="font-medium">8 зап.</td><td>8 000 ₽</td></tr>
                                    <tr><td>Вт 20.10</td><td><span className="badge badge-completed">Отработал</span></td><td className="font-medium">10 зап.</td><td>10 500 ₽</td></tr>
                                    <tr><td>Ср 21.10</td><td><span className="badge badge-new">В процессе</span></td><td className="font-medium">7 зап.</td><td>-</td></tr>
                                    <tr><td>Чт 22.10</td><td className="text-secondary">Выходной</td><td>-</td><td>-</td></tr>
                                    <tr><td>Пт 23.10</td><td className="text-secondary">Выходной</td><td>-</td><td>-</td></tr>
                                    <tr><td>Сб 24.10</td><td><span className="badge badge-new">Запланировано</span></td><td className="font-medium">12 зап.</td><td>-</td></tr>
                                    <tr><td>Вс 25.10</td><td><span className="badge badge-new">Запланировано</span></td><td className="font-medium">11 зап.</td><td>-</td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {masterPeriod === 'month' && (
                        <div className="table-responsive">
                            <table className="data-table" style={{ marginTop: '16px', minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        <th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map(week => (
                                        <tr key={week}>
                                            {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                                const date = (week - 1) * 7 + day;
                                                const isWorking = (day === 1 || day === 2 || day === 3 || day === 6 || day === 7);
                                                return (
                                                    <td key={day} style={{ verticalAlign: 'top', height: '80px', borderRight: '1px solid #eee', padding: '8px', backgroundColor: isWorking ? 'transparent' : '#f9fafb' }}>
                                                        <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>{date} Окт</div>
                                                        {date <= 31 && isWorking && (
                                                            <>
                                                                <div className="font-medium" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>Смена 10-22</div>
                                                                <div className="text-secondary" style={{ fontSize: '11px' }}>{Math.floor(Math.random() * 8) + 4} зап.</div>
                                                            </>
                                                        )}
                                                        {date <= 31 && !isWorking && (
                                                            <div className="text-secondary" style={{ fontSize: '12px' }}>Выходной</div>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <Drawer
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    fetchAppointments(); // refresh after close in case status was updated
                }}
                record={selectedRecord}
                role={role}
            />
        </div>
    );
};

export default Schedule;
