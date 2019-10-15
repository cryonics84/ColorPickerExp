import rpcController from '../shared/controller/controller';
import serverController from '../server/server-controller';
import clientController from '../client/client-controller'
import model from "../shared/model/model";
import {Events} from 'monsterr'
import {NetworkIdentity, ConnectionStates} from "./entity";
import Entity from "./entity";
import modelController from '../shared/controller/controller'
import * as db from '../../sharedDB';
/**---------------------------------------------------------------
| Server variables
----------------------------------------------------------------*/
let server;
let networkIdentityIdCounter = 0;
let intervalId = -1;
let rpcBuffer = [];
let identiyIdCounter = 0;

// Callbacks
let updateCallbacks = [];
let clientConnectCallbacks = [];
let clientReconnectCallbacks = [];
let clientDisconnectCallbacks = [];
let clientLoggedInCallbacks = [];

/**---------------------------------------------------------------
 | Client variables
 ----------------------------------------------------------------*/
let client;
let clientId = -1;
let endStageCallbacks = [];

/**---------------------------------------------------------------
 | Shared variables
 ----------------------------------------------------------------*/

let networkIdentities = {};
let logging = true;

/**---------------------------------------------------------------
 | public server function
 ----------------------------------------------------------------*/
function initServer(serverInstance){
    server = serverInstance;
    init();
}

function startLoop(ms){
    if(intervalId === -1) {
        setInterval(update, ms);
        intervalId = -1;
    }
}

function stopLoop(){
    if(intervalId !== -1) {
        clearInterval(intervalId);
    }
}


function makeRPC(rpc, params, clientId){
    let data = {rpc: rpc, params: params};
    log('Buffering RPC: ' + JSON.stringify(data));

    log('data package size:' + memorySizeOf(data));

    rpcBuffer.push({clientId: clientId, data: data});

    executeRpcOnModel(data);
}

function resolveRPCbuffer(){
    rpcBuffer.forEach(rpc => {
        if(rpc.clientId){
            log('sending RPC to specific client: ' + rpc.clientId);
                server.send('executeRPC', rpc.data).toClient(rpc.clientId);
        }else{
            if(getNetworkIdentitiesSize() > 0){
                server.send('executeRPC', rpc.data).toAll();
            }else{
                log('No clients to send to.');
            }
        }
    });

    rpcBuffer.length = 0;
}

function addUpdateCallback(callback){
    updateCallbacks.push(callback);
}

function removeUpdateCallback(callback){
    let index = updateCallbacks.indexOf(callback);
    updateCallbacks.splice(index, 1);
}

function getServer(){
    return server;
}

function addClientLoggedInCallback(callback){
    if(!clientLoggedInCallbacks.some(x => {return x === callback} )){
        log('clientConnect Callback added to handler');
        clientLoggedInCallbacks.push(callback);
    }else{
        log('clientConnect Callback already exists!')
    }

}

function removeClientLoggedInCallback(callback){
    let index = clientLoggedInCallbacks.indexOf(callback);
    clientLoggedInCallbacks.splice(index, 1);
}


const serverInterface = {
    init: initServer,
    startLoop: startLoop,
    stopLoop: stopLoop,
    makeRPC: makeRPC,
    addUpdateCallback: addUpdateCallback,
    removeUpdateCallback: removeUpdateCallback,
    getServer: getServer,
    addClientLoggedInCallback: addClientLoggedInCallback,
    removeClientLoggedInCallback: removeClientLoggedInCallback
}

/**---------------------------------------------------------------
 | private server functions
 ----------------------------------------------------------------*/

function executeCmd(client, data){
    if(!serverController.commands.hasOwnProperty(data.command)){
        log('ERROR - Command not found!');
        return;
    }
    serverController.commands[data.command](...data.params);
}


function clientConnected(client){
    log('[NetFrame] clientConnected() called with client: ' + client);

    server.send('setClientId', {clientId: client}).toClient(client);

    return; 
    
    //Give him existing IDs
    /*
    for(let networkIdentity in Object.keys(networkIdentities)){
        server.send('createNetworkIdentity', {networkIdentity: networkIdentities[networkIdentity]}).toClient(client)
    }
*/

    //Check if client was already connected, else create network ID
    let networkIdentity = Object.values(networkIdentities).find(networkIdentity => networkIdentity.clientId === client);
    if(!networkIdentity){
        // Client needs new network identity
        log('New client');
        //let networkId = server.getPlayers().findIndex(player => player === client);
        
        let networkIdentity = createNetworkIdentity(client, networkId);

        //log('Sending GameState to client...');
        //sendGameStateToClient(client, getSerializedGameState());

        //Do server callback last
        log('Making clientConnected callbacks...');
        clientConnectCallbacks.forEach(callback => {callback(client, networkIdentity)});
    }else{
        //sendGameStateToClient(client, getSerializedGameState());
    }
}

function clientLoggedIn(clientId, password){
    log('clientLoggedIn() called with : ' + clientId + ' and ' + password);

    //Check if networkIdentity exists
    let networkIdentity = Object.values(networkIdentities).find(networkIdentity => networkIdentity.password === password);

    if(networkIdentity){

        //Check if user is already logged in
        if(networkIdentity.connectionState === ConnectionStates.DISCONNECTED){
            //Override existing clientId
            networkIdentity.clientId = clientId;
            log('Making clientLoggedIn backin callbacks...');
            clientLoggedInCallbacks.forEach(callback => {callback(networkIdentity, networkIdentity)});
        }
    }
    else
    {
        //Check if password is valid
        if(!db.isKeyValid(password)){
            makeRPC('loginFailed', ['Incorrect Code. Try again.'], clientId);
        }
        else{
            log('New client');
            //let networkId = server.getPlayers().findIndex(player => player === clientId);
            let identityId = identiyIdCounter;
            identiyIdCounter += 1;

            let networkIdentity = createNetworkIdentity(clientId, identityId);
            
            networkIdentity.password = password;
    
            //log('Sending GameState to client...');
            //sendGameStateToClient(client, getSerializedGameState());
        
            //Do server callback last
            log('Making clientLoggedInCallbacks callbacks...');
            clientLoggedInCallbacks.forEach(callback => {
                callback(networkIdentity, networkIdentity)
            });
        }
        
    }

    
}

function clientDisconnected(clientId){
    log('[NetFrame] clientDisconnected() called with client: ' + clientId);

    //remove network identity
    //RpcRemoveNetworkIdentity(clientId);
    //server.send('removeNetworkIdentity', {clientId: clientId}).toAll();

    let networkIdentity = getNetworkIdentityFromClientId(clientId);
    if(networkIdentity){
        networkIdentity.connectionState = ConnectionStates.DISCONNECTED;

        let data = {
            clientId: clientId,
            connectionState: networkIdentity.connectionState
        };
    
        log('sending client status to admin : ' + JSON.stringify(data));
        server.send('updateClientState', data).toAdmin();
    }

}

function getNetworkID(){
    let id = networkIdentityIdCounter;
    log('Getting new network ID..');
    for (let i = 0; i <= networkIdentityIdCounter; i++){
        log('Checking networkIdentity #' + i + ' : ' + JSON.stringify(networkIdentities[i]));
        if(!networkIdentities[i]){
            log('Found ID');
            id = i;
            if(i === networkIdentityIdCounter){
                log('Increasing ID counter by 1');
                networkIdentityIdCounter++;
            }else{
                log('No need to increase ID counter...');
            }
            break;
        }
    }
    log('Returning ID: ' + id);
    return id;
}



function createNetworkIdentity(client, id){
    let randomName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    log('Creating network identity called with client: ' + client + ', id: ' + id);

    //let networkIdentity = rpcController.RpcCreateNetworkIdentity(identityId, client, randomName, rpcController.getNetworkIdentityColors()[identityId]);
    let networkIdentity = RpcCreateNetworkIdentity(id, client, randomName, rpcController.getNetworkIdentityColors()[id]);

    // no need to notify client
    //server.send('createNetworkIdentity', {networkIdentity: networkIdentity}).toClient(client);

    return networkIdentity;

}

function update(){

    //resolve all changes by updating clients
    if(rpcBuffer.length > 0){
        resolveRPCbuffer();
    }

    //invoke server updateloop
    updateCallbacks.forEach(callback => {callback()});

}

/**---------------------------------------------------------------
 | public client functions
 ----------------------------------------------------------------*/

function initClient(clientRef){
    client = clientRef;

    init();

    getClient().send('ClientConnected');
}

function getClient(){
    if(!client){
        log('Client NULL!');
    }
    return client;
}

function getMyNetworkIdentity(){
    return getNetworkIdentityFromClientId(clientId);
}

function getClientId(){
    log('Getting clientId : ' + clientId);
    return clientId;
}

// Call RPC function on clients
function executeRpc(data){

    executeRpcOnModel(data);

    log('Executing RPC on client with data: ' + JSON.stringify(data));
    if(!clientController.rpcs.hasOwnProperty(data.rpc)){
        log('RPC not found.');
    }else{
        clientController.rpcs[data.rpc](...data.params);
    }


}

function executeRpcOnModel(data){
    //is runs on both server and client model - Apply it to client model
    log('Executing RPC on model with data: ' + JSON.stringify(data));
    if(!modelController.hasOwnProperty(data.rpc)){
        log('RPC not found.');
        return;
    }else{
        modelController[data.rpc](...data.params);
    }
}


function resetClient(){
    //networkIdentities = {};
}

function makeCmd(cmd, params){
    log('Making CMD: ' + cmd + ', with params: ' + JSON.stringify(params));
    let data = {command: cmd, params: params};
    getClient().send('executeCmd', data);
}


const clientInterface = {
    getClient: getClient,
    getClientId: getClientId,
    executeRpc: executeRpc,
    getModelMap: getModelMap,
    init: initClient,
    reset: resetClient,
    makeCmd: makeCmd,
    getMyNetworkIdentity: getMyNetworkIdentity
}

/**---------------------------------------------------------------
 | private client functions
 ----------------------------------------------------------------*/
function setClientId(id){
    log('Setting clientId: ' + id);
    clientId = id;
}


/**---------------------------------------------------------------
 | public shared functions
 ----------------------------------------------------------------*/


function shouldLog(bool){
    logging = bool;
}

function log(msg){
    if(logging){
        console.log(msg);
    }
}

function getNetworkIdentityFromClientId(clientId){
    log('Called GetNetworkIdentityFromClientId(). Iterating Network identities...');
    for (const identity in networkIdentities){
        log('Checking identity: ' + JSON.stringify(networkIdentities[identity]) + '\n');
        if(networkIdentities[identity].clientId == clientId){
            log('Found network identity: ' + networkIdentities[identity] + ' from clientId: ' + clientId + '\n');
            return networkIdentities[identity];
        }
    }

    log('Failed to find network identity belonging to clientId: ' + clientId);
    return null;
}


function getNetworkIdentities(){
    //log('Returning networkIdentities: ' + JSON.stringify(Object.values(networkIdentities)));
    return networkIdentities;
}

function isNetworkIdentityLoggedIn(networkIdentity){
    return networkIdentity.password != ''; 
}

function getLoggedInUsersSize(){
    return Object.keys(getLoggedInUsers()).length;
}

function getLoggedInUsers(){
    let loggedInUsers = [];
    for (const identity in networkIdentities){
        if(isNetworkIdentityLoggedIn(networkIdentities[identity])){
            loggedInUsers.push(networkIdentities[identity]);
        }
    }
    return loggedInUsers;
}

function getModelMap(){
    return modelMap;
}

function addEndStageCallback(callback){
    endStageCallbacks.push(callback);
}

function removeEndStageCallback(callback){
    let index = endStageCallbacks.indexOf(callback);
    endStageCallbacks.splice(index, 1);
}



function addClientConnectedCallback(callback){
    if(!clientConnectCallbacks.some(x => {return x === callback} )){
        log('clientConnect Callback added to handler');
        clientConnectCallbacks.push(callback);
    }else{
        log('clientConnect Callback already exists!')
    }

}

function removeClientConnectedCallback(callback){
    let index = clientConnectCallbacks.indexOf(callback);
    clientConnectCallbacks.splice(index, 1);
}

function addClientDisconnectedCallback(callback){
    if(!clientDisconnectCallbacks.some(x => {return x === callback} )){
        log('clientConnect Callback added to handler');
        clientDisconnectCallbacks.push(callback);
    }else{
        log('clientDisconnect Callback already exists!')
    }

}

function removeClientDisconnectedCallback(callback){
    let index = clientDisconnectCallbacks.indexOf(callback);
    clientDisconnectCallbacks.splice(index, 1);
}

function getNetworkIdentitiesSize(){
    return Object.keys(networkIdentities).length;
}

export const sharedInterface = {
    shouldLog: shouldLog,
    log: log,
    getNetworkIdentityFromClientId: getNetworkIdentityFromClientId,
    getNetworkIdentities: getNetworkIdentities,
    getModelMap: getModelMap,
    addEndStageCallback: addEndStageCallback,
    removeEndStageCallback: removeEndStageCallback,
    addClientConnectedCallback: addClientConnectedCallback,
    removeClientConnectedCallback: removeClientConnectedCallback,
    addClientDisconnectedCallback: addClientDisconnectedCallback,
    removeClientDisconnectedCallback: removeClientDisconnectedCallback,
    getNetworkIdentitiesSize: getNetworkIdentitiesSize,
    getLoggedInUsers: getLoggedInUsers,
    getLoggedInUsersSize: getLoggedInUsersSize
};

/**---------------------------------------------------------------
 | private shared functions
 ----------------------------------------------------------------*/
function init(){
    log('[netframe] init() called(). Resetting variables...');
    intervalId = -1;
    clientId = -1;
    networkIdentities = {};
    networkIdentityIdCounter = 0;

    updateCallbacks = [];
    clientConnectCallbacks = [];
}

// Create a network identity
function RpcCreateNetworkIdentity(identityId, clientId, name, color){
    log('RpcCreateNetworkIdentity called with identityId: ' + identityId + ', clientId: ' + clientId + 'name: ' + name + ', color: ' + color + ' Current network identities: ' + JSON.stringify(networkIdentities));
    let networkIdentity = new NetworkIdentity(identityId, clientId, name, color);
    //We insert at index instead of pushing to get map
    networkIdentities[identityId] = networkIdentity;
    log('New set of network identities: ' + JSON.stringify(networkIdentities));

    if(client){
        log('Making clientConnected callbacks...');
        clientConnectCallbacks.forEach(callback => {callback(clientId, networkIdentity)});
    }

    return networkIdentity;
}

function RpcRemoveNetworkIdentity(clientId){
    log('RpcRemoveNetworkIdentity called with clientId: ' + clientId);
    //let networkIdentityIndex = Object.values(networkIdentities).findIndex(obj => obj.clientId === clientId);
    //let networkIdentity = networkIdentities[networkIdentityIndex];

    let networkIdentity = null;
    let networkIdentityIndex = -1;

    for (const [key, value] of Object.entries(networkIdentities)) {
        if(value.clientId == clientId){
            log('Found NetworkIdentity! ');
            networkIdentityIndex = key;
            networkIdentity = value;
        }
    }

    if(networkIdentityIndex === -1){
        log('Identity not found...!');
        return;
    }

    log('Removing network identity: ' + JSON.stringify(networkIdentity));
    //networkIdentities.splice(networkIdentityIndex, 1);
    // we don't want to pop the element, as we are threating the array as a map
    //networkIdentities[networkIdentityIndex] = null;
    delete networkIdentities[networkIdentityIndex];
    log('New set of networkIdentities = ' + JSON.stringify(networkIdentities));

    clientDisconnectCallbacks.forEach(callback => {callback(clientId, networkIdentity)});
}

function memorySizeOf(obj) {
    let bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if(objClass === 'Object' || objClass === 'Array') {
                        for(var key in obj) {
                            if(!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return formatByteSize(sizeOf(obj));
};

/**---------------------------------------------------------------
 | Events
 ----------------------------------------------------------------*/
const serverEvents = {
    'executeCmd': function (server, client, data) {
        log('Received executeCmd event from client: ' + client + ', with data: ' + JSON.stringify(data));
        executeCmd(client, data);
    },

    'ClientConnected': function (server, client, data) {
        server.log(data, {'client_id': client});
        log('Received clientConnected event from client with ID: ' + client);
        clientConnected(client);
    },

    'clientLoggedIn': function (server, client, data) {
        log('Received clientLoggedIn event from client with ID: ' + client);
        clientLoggedIn(client, data.password);
    },

    [Events.CLIENT_CONNECTED]: (monsterr, clientId) => {
        log(clientId, 'connected! Hello there :-)');

        // Set client state to server stage - this will invoke ClientConnected event on Client
        setTimeout(function(){
            server.send(Events.START_STAGE, server.getCurrentStage().number).toClient(clientId)
        }, 1000);

    },
    [Events.CLIENT_RECONNECTED]: (monsterr, clientId) => {
        log(clientId, 'reconnected! Welcome back :-)');

        // Set client state to server stage - this will invoke ClientConnected event on Client
        setTimeout(function(){
            server.send(Events.START_STAGE, server.getCurrentStage().number).toClient(clientId)
        }, 1000);

    },
    [Events.CLIENT_DISCONNECTED]: (monsterr, clientId) => {
        console.log(clientId, 'disconnected! Bye bye...');
        clientDisconnected(clientId)
    }
};

const clientEvents = {
    'executeRPC': function (client, data) {
        log('Received executeRpc event from server with data: ' + JSON.stringify(data));
        executeRpc(data);
    },
    'createNetworkIdentity': function (client, data) {
        log('Received createNetworkIdentity event from server with data: ' + JSON.stringify(data));
        RpcCreateNetworkIdentity(data.networkIdentity.identityId, data.networkIdentity.clientId, data.networkIdentity.name, data.networkIdentity.color);
    },
    'setClientId': function (client, data) {
        log('Received setClientId event from server with data: ' + JSON.stringify(data));
        setClientId(data.clientId);
    },
    'newStateUpdate': function (client, data) {
        log('Received newStateUpdate event from server with data: ' + JSON.stringify(data));
        updateGameState(data.gameState);
        //applyStateChanges(data.stateChanges);

    },
    'removeNetworkIdentity': function (client, data) {
        log('Received removeEntities event from server with data: ' + JSON.stringify(data));
        RpcRemoveNetworkIdentity(data.clientId);
    },
    'removeEntities': function (client, data) {
        log('Received removeEntities event from server with data: ' + JSON.stringify(data));
        RpcRemoveEntities(data.entitiesId);
    },
    'newGameState': function (client, data) {
        log('Received newGameState event from server with data: ' + JSON.stringify(data));
        reconstructGameState(data.gameState);
    },
    [Events.END_STAGE]: (monsterr, clientId) => {
        log('Stage Ended...');
        endStageCallbacks.forEach(callback => {callback()});
    }


};

const serverCommands = {

};

/**---------------------------------------------------------------
 | interfaces
 ----------------------------------------------------------------*/
// Shared functions are a part of the interface

export const serverSharedInterface = Object.assign(serverInterface, sharedInterface);

export const clientSharedInterface = Object.assign(clientInterface, sharedInterface);

export function getCombinedServerEvents(events){
    return events ? Object.assign(events, serverEvents): serverEvents;
}

export function getCombinedClientEvents(events){
    return events ? Object.assign(events, clientEvents): clientEvents;
}

export function getCombinedServerCommands(commands){
    return commands ? Object.assign(commands, serverCommands): serverCommands;
}


