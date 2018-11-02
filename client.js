import createClient from 'monsterr'
import stage1 from './src/stages/stage1/client/client'
import stage0 from './src/stages/stage0/client/client'

const stages = [
  stage0, stage1
]

let options = {
  canvasBackgroundColor: 'blue',
  htmlContainerHeight: 0 // Hide html
}

let events = {}
let commands = {}

createClient({
  events,
  commands,
  options,
  stages
})
