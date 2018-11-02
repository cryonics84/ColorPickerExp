import customClientEvents from './client-events'
import {getCombinedClientEvents} from '../lib/netframe'
import clientController from './client-controller'

/* globals fabric */

// You can import html and css from anywhere.
import html from './stage1.html'
// css is immediately applied on import.
import './stage1.css'


// Export the complete stage as the default export
export default {
  // Remember to include your html in stage
  // The html is shown only during the stage.
  html,

  // Optionally define commands
  commands: {
    finish (client) {
      client.stageFinished() // <== this is how a client reports finished
      return false // <== false tells client not to pass command on to server
    }
  },

  // Optionally define events
  events: getCombinedClientEvents(customClientEvents),

  // Optionally define a setup method that is run before stage begins
  setup: (client) => {
    // You can prepare the canvas...


      //initiate the clientController
    clientController.init(client);
  },
  
  // Optionally define a teardown method that is run when stage finishes
  teardown (client) {
    //...
  },

  // Configure options
  options: {
    // You can set duration if you want the stage to
    // be timed on the client.
    duration: 0,
    // You can set how much space you want the html
    // to take up. 0 = none. 1 = all.
    htmlContainerHeight: 0
  }
}