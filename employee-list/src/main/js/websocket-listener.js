'use strict';

const SockJS = require('sockjs-client'); //pull in the SockJS JavaScript lib for talking over WebSockets
require('stompjs'); //Pull in the stomp-websocket JavaScript library to use the STOMP sub-protocol.

function register(registrations) {
    const socket = SockJS('/payroll'); //Point the WebSocket at the application’s /payroll endpoint
    const stompClient = Stomp.over(socket);
    stompClient.connect({}, function(frame) {
        //Iterate over the array of registrations supplied so that each can subscribe for callback as messages arrive
        registrations.forEach(function (registration) {
            //Each registration entry has a route and a callback
            stompClient.subscribe(registration.route, registration.callback);
        });
    });
}

module.exports.register = register;