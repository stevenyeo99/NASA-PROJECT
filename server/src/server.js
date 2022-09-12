const http = require('http');

require('dotenv').config();

const app = require('./app');
const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchesData } = require('./models/launches.model');
const { mongoConnect } = require('./services/mongo');

console.log(process.env.PORT);
const PORT = process.env.PORT || 8000;

const server = http.createServer(app);



async function startServer() {
    await mongoConnect();
    await loadPlanetsData();
    await loadLaunchesData();

    server.listen(PORT, () => {
        console.log(`Node JS Server Is Running on Port: ${PORT}`);
    });
}

startServer();