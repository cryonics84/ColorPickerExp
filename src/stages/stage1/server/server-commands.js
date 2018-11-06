import serverController from '../server/server-controller'


const commands = {
    'resetClient': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.reset();
    },
    'reqGameData': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.sendParticipantData();
    },
    'reqParticipantData': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.sendGameData();
    },
};

export default commands;

