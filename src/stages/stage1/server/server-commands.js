import serverController from '../server/server-controller'
import * as db from '../../sharedDB';

const commands = {
    'setGameSettings': function (server, _, ...data) {
        console.log('Received setGameSettings with args: ' + JSON.stringify(data));
        db.gameSettings.maxRounds = Number(data[0]);
        db.gameSettings.gameMode = data[1];
        db.gameSettings.networkMode = data[2] === 'multi';
        db.gameSettings.crossTableClientData = data[3];

    },
    'resetClient': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.reset();
    },
    
};

export default commands;

