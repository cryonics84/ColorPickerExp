import customServerEvents from './server-events'
import {getCombinedServerEvents, getCombinedServerCommands} from '../lib/netframe'
import commands from './server-commands'
import serverController, { adminCommands } from './server-controller'

// Export stage as the default export
export default {
  // Optionally define commands
  commands: getCombinedServerCommands(adminCommands),

  // Optionally define events
  events: getCombinedServerEvents(customServerEvents),

  // Optionally define a setup method that is run before stage begins
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage());

    serverController.init(server);
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
