import createServer, {Events, Network} from 'monsterr'
import stage1 from './src/stages/stage1/server/server'
import stage0 from './src/stages/stage0/server/server'
import serverController from "./src/stages/stage1/server/server-controller";

const stages = [stage0, stage1];

let events = {
    [Events.CLIENT_CONNECTED] (server, clientId) {
        // Notify admin
        console.log('CLIENT CONNECTED!§');
        let msg = {clients: server.getPlayers()};
        server.send('clientConnected', msg).toAdmin();
    },
    [Events.CLIENT_DISCONNECTED] (server, clientId) {
        // Notify admin
        console.log('CLIENT DISCONNECTED!§');
        let msg = {clients: server.getPlayers()};
        server.send('clientDisconnected', msg).toAdmin();
    }
};

let commands = {
    'getConnections': function (server, _, ...args) {
        console.log('getConnections command received. Sending to admin...');
        let msg = {clients: server.getPlayers()};
        server.send('resConnections', msg).toAdmin();
    },
}

const monsterr = createServer({
  network: Network.pairs(8),
  events,
  commands,
  stages,
  options: {
    port: 8080,
    clientPassword: undefined,  // can specify client password
    adminPassword: 'sEcr3t'     // and admin password
  }
});

monsterr.run();


