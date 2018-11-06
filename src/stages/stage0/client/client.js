
/* globals fabric */

// You can import html and css from anywhere.
import html from './stage0.html'
// css is immediately applied on import.
import './stage0.css'

import {ParticipantData} from "../../stage1/shared/model/data";
import * as adminContent from "../../../adminHTML.html";

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
  events: {},

  // Optionally define a setup method that is run before stage begins
  setup: (client) => {
    // You can prepare the canvas...

      let summitButton = document.getElementById("summitButton");
      //summitButton.click = function(){testSummmit();};
      summitButton.onclick = (function(){
          onSummmit();
      });

      function onSummmit(){
        console.log('Submitting data');

        let survey = document.getElementById("survey");

        console.log('Form Values: ' + survey.elements);

        let name = survey.fname.value + ' ' + survey.lname.value;
        let age = survey.age.value;
        let cpr = survey.cpr.value;
        let gender = survey.gender.value;

        let data = new ParticipantData(-1, age, gender, cpr, name);

        console.log('Sending ParticipantData: ' + JSON.stringify(data));

        client.send('sendFormData', data);
          document.getElementById("stage0").innerHTML = ("<h1>Thank you. Please wait for other players to finish.</h1>");
      }

      console.log('logging ID: survey: ' + document.getElementById("survey"));
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
    htmlContainerHeight: 1
  }
}