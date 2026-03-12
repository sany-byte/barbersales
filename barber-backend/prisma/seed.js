const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INITIAL_USERS = [
    {
        name: 'Иван Иванов',
        role: 'owner',
        phone: '+7 999 123-45-67',
        email: 'ivan@barbersales.ru',
        avatar: 'ИИ',
        specialization: '-',
        status: 'Активен',
        isBookable: false
    },
    {
        name: 'Артем Смирнов',
        role: 'master',
        phone: '+7 900 111-22-33',
        email: 'artem@barbersales.ru',
        avatar: 'АС',
        specialization: 'Мужские стрижки, Борода',
        status: 'Активен',
        isBookable: true
    },
    {
        name: 'Максим Дорохов',
        role: 'master',
        phone: '+7 911 222-33-44',
        email: 'max@barbersales.ru',
        avatar: 'МД',
        specialization: 'Классические стрижки',
        status: 'Отпуск',
        isBookable: false
    },
    {
        name: 'Ольга Кузина',
        role: 'admin',
        phone: '+7 922 333-44-55',
        email: 'olga@barbersales.ru',
        avatar: 'ОК',
        specialization: '-',
        status: 'Активен',
        isBookable: false
    }
];

const INITIAL_SERVICES = [
    { name: 'Мужская стрижка', duration: 60, price: 1500, primeCost: 150, masterCutType: 'fixed', masterCutValue: 600 },
    { name: 'Стрижка машинкой', duration: 30, price: 800, primeCost: 50, masterCutType: 'percent', masterCutValue: 40 },
    { name: 'Моделирование бороды', duration: 45, price: 1000, primeCost: 100, masterCutType: 'percent', masterCutValue: 40 },
    { name: 'Стрижка + Борода', duration: 90, price: 2300, primeCost: 200, masterCutType: 'fixed', masterCutValue: 900 }
];

async function main() {
    console.log('Start seeding ...');

    const createdUsers = [];
    for (const user of INITIAL_USERS) {
        const u = await prisma.user.create({
            data: user
        });
        createdUsers.push(u);
        console.log(`Created user with id: ${u.id}`);
    }

    const createdServices = [];
    for (const service of INITIAL_SERVICES) {
        const s = await prisma.service.create({
            data: service
        });
        createdServices.push(s);
        console.log(`Created service with id: ${s.id}`);
    }

    const INITIAL_CLIENTS = [
        { name: 'Алексей С.', phone: '+7 999 123-45-67' },
        { name: 'Иван К.', phone: '+7 999 234-56-78' },
        { name: 'Михаил Д.', phone: '+7 999 345-67-89' }
    ];

    const createdClients = [];
    for (const client of INITIAL_CLIENTS) {
        const c = await prisma.client.create({
            data: client
        });
        createdClients.push(c);
        console.log(`Created client with id: ${c.id}`);
    }

    const master1 = createdUsers.find(u => u.name === 'Артем Смирнов') || createdUsers[0];
    const service1 = createdServices.find(s => s.name === 'Стрижка + Борода') || createdServices[0];
    const service2 = createdServices.find(s => s.name === 'Мужская стрижка') || createdServices[0];

    const today = new Date();
    today.setHours(14, 30, 0, 0);

    const INITIAL_APPOINTMENTS = [
        {
            clientId: createdClients[0].id,
            masterId: master1.id,
            serviceId: service1.id,
            startTime: new Date(today),
            endTime: new Date(new Date(today).setMinutes(today.getMinutes() + service1.duration)),
            status: 'completed',
            finalPrice: service1.price
        },
        {
            clientId: createdClients[1].id,
            masterId: master1.id,
            serviceId: service2.id,
            startTime: new Date(new Date(today).setHours(16, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(17, 0, 0, 0)),
            status: 'in-chair',
            finalPrice: service2.price
        },
        {
            clientId: createdClients[2].id,
            masterId: master1.id,
            serviceId: service2.id,
            startTime: new Date(new Date(today).setHours(18, 0, 0, 0)),
            endTime: new Date(new Date(today).setHours(19, 0, 0, 0)),
            status: 'new',
            finalPrice: service2.price
        }
    ];

    for (const appointment of INITIAL_APPOINTMENTS) {
        const a = await prisma.appointment.create({
            data: appointment
        });
        console.log(`Created appointment with id: ${a.id}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
