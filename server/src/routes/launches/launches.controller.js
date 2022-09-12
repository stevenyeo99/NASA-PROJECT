const { 
    getAllLaunches,
    scheduleNewLaunch,
    existLaunch,
    abortLaunchById 
} = require('../../models/launches.model');

const {
    getPagination
} = require('../../services/query');

async function httpGetAllLaunches(req, res) {
    const { skip, limit } = getPagination(req.query);
    const launches = await getAllLaunches(skip, limit);
    return res.status(200)
        .json(launches);
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body;

    if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.destination) {
        return res.status(400)
            .json({
                error: 'Missing Required Launch Input!'
            });
    }

    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400)
            .json({
                error: 'Invalid launch date format!'
            });
    }

    await scheduleNewLaunch(launch);

    return res.status(201)
        .json(launch);
}

async function httpAbortLaunchById(req, res) {
    const launchId = Number(req.params.id);

    const existsLaunch = existLaunch({ flightNumber: launchId });
    if (!existsLaunch) {
        return res.status(404)
            .json({
                error: 'Launch not found!'
            });
    }

    const abortedLaunch = await abortLaunchById(launchId);

    if (!abortedLaunch) {
        return res.status(400)
            .json({
                error: 'Launch not aborted'
            });
    }

    return res.status(200)
        .json({
            ok: true
        });
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunchById
};