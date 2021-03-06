import * as db from "../../sharedDB";
import {ParticipantData} from "../../stage1/shared/model/data";
import {Events} from "monsterr";
import serverController from "../../stage1/server/server-controller";

// Export stage as the default export
export default {
  // Optionally define commands
  commands: {
      'setGameSettings': function (server, _, ...data) {
          console.log('Received setGameSettings with args: ' + JSON.stringify(data));
          db.gameSettings.maxRounds = Number(data[0]);
          db.gameSettings.gameMode = data[1];
          db.gameSettings.networkMode = data[2] === 'multi';

      },
      'resetClient': function (server, _, ...args) {
          console.log('Resetting client...');
          db.participants = [];
      },

  },

  // Optionally define events
  events: {
      'sendFormData': function(server,client, data){
          console.log('Received form data from client: ' + JSON.stringify(data));
          let participant = new ParticipantData(client, data.age, data.gender, data.cpr, data.name, data.resolution);
          db.participants.push(participant);

          checkIfPlayersReady(server);
      },

  },


  // Optionally define a setup method that is run before stage begins
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage());

    db.gameSettings.maxPlayers = server.getPlayers().length;

    //If we performed a reset, then we don't want players to refill form unless admin has cleared DB.
    checkIfPlayersReady(server);
  },  
  
  // Optionally define a teardown method that is run when stage finishes
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE',
      server.getCurrentStage())
  },

  // Configure options
  options: {
    // You can set duration if you want the stage to
    // be timed on the server.
    // duration: 10000
  }
}


function checkIfPlayersReady(server){
    console.log('Checking if all players are ready...');

    console.log('current number of participants: ' + db.participants.length);
    console.log('current max participants: ' + db.gameSettings.maxPlayers);

    if(db.participants.length === db.gameSettings.maxPlayers){
        console.log('All players are ready. Changing stage');

        // Notify admin
        server.send('finishedRegistration').toAdmin();

        server.nextStage();
    }else{
        console.log('Waiting for players to finished registration form');
    }
}