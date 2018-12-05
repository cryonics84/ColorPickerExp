import serverController from '../server/server-controller'


const commands = {
    'resetClient': function (server, _, ...args) {
        console.log('Resetting client...');
        serverController.reset();
    },
};

export default commands;

