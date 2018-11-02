/**
 * Bot interface.
 * 
 * Handle events to implement functionality.
 */

const io = require('socket.io-client')
const socket = io('http://localhost:3000/clients').connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', () => console.log('disconnected'))
socket.on('error', err => console.log(err))
socket.on('event', handleEvent)

/**
 * Handle incoming events
 * Has format
 * {
 *  type: string,
 *  payload: any
 * }
 */
function handleEvent(event) {
  console.log('event', event)
}

/**
 * Send events to server
 * Must have format
 * {
 *  type: string,
 *  payload: any
 * }
 */
socket.emit('event', { type: 'my_event', payload: 'data' })