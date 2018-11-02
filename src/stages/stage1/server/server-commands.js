import serverController from '../server/server-controller'


const commands = {
    'resetClient': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.reset();
    },
    'setAnswerModeUniform': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.changeAnswerMode(args[0]);
    },
    'setNumberOfPlayers': function (server, _, ...args) {
        console.log('Setting number of players...');
        serverController.setNumberOfPlayers(args[0]);
    },
    'setNumberOfRounds': function (server, _, ...args) {
        console.log('Setting number of rounds...');
        serverController.setNumberOfRounds(args[0]);
    }
};

export default commands;

