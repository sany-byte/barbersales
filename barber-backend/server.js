const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Основной маршрут для проверки
app.get('/api/ping', (req, res) => {
    res.json({ message: 'BarberSales API is running' });
});

// Роуты для Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const user = await prisma.user.create({
            data: req.body
        });
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.update({
            where: { id },
            data: req.body
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Роуты для Services
app.get('/api/services', async (req, res) => {
    try {
        const services = await prisma.service.findMany();
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

app.post('/api/services', async (req, res) => {
    try {
        const service = await prisma.service.create({
            data: req.body
        });
        res.status(201).json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

app.put('/api/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.update({
            where: { id },
            data: req.body
        });
        res.json(service);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

app.delete('/api/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.service.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// Роуты для Appointments (Записи)
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            include: {
                client: { select: { name: true, phone: true } },
                master: { select: { name: true } },
                service: { select: { name: true } }
            },
            orderBy: {
                startTime: 'desc'
            }
        });
        res.json(appointments);
    } catch (error) {
        console.error('Failed to fetch appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                client: { select: { name: true, phone: true } },
                master: { select: { name: true } },
                service: { select: { name: true } }
            }
        });
        res.json(appointment);
    } catch (error) {
        console.error('Failed to update appointment status:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
