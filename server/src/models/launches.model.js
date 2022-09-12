const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

async function existLaunch(filter) {
    return await launches.findOne(filter);
}

async function getLatestFlightNumber() {
    const latestLaunch = await launches
        .findOne({})
        .sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [{
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Error during fetching space-x API');
        throw new Error('Fetching Failed.');
    }

    const launchDocs = response.data.docs;
    for (launchDoc of launchDocs) {
        const payloads = launchDoc.payloads;
        const customers = payloads.flatMap((payload) => {
            return payload.customers
        });

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            destination: '',
            customers: customers,
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success']
        };

        console.log(`${launch.flightNumber} ${launch.mission}`);
    
        await saveLaunch(launch);
    }
}

async function loadLaunchesData() {
    const filter = {
        flightNumber: 1,
        mission: 'FalconSat',
        rocket: 'Falcon 1'
    };

    const existingLaunch = await existLaunch(filter);
    if (existingLaunch) {
        console.log('Space-X data exists.');
    } else {
        populateLaunches();
    }
}

async function getAllLaunches(skip, limit) {
    return await launches.find({}, { _id: 0, __v: 0 })
        .sort({ flightNumber: 1 })
        .skip(skip)
        .limit(limit);
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.destination
    });

    if (!planet) {
        throw new Error('No Planet Found!');
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,
        customers: ['ZTM', 'NASA'],
        upcoming: true,
        success: true
    });

    await saveLaunch(newLaunch);
    console.log(newLaunch)
}

async function saveLaunch(launch) {
    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, launch, {
        upsert: true
    });
}

async function abortLaunchById(launchId) {
    const aborted = await launches.updateOne({
        flightNumber: launchId
    }, {
        success: false,
        upcoming: false
    });

    return aborted.modifiedCount === 1;
}

module.exports = {
    existLaunch,
    getAllLaunches,
    loadLaunchesData,
    scheduleNewLaunch,
    abortLaunchById
};