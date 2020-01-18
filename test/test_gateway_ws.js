const ws = require('ws');

const socket = new ws('ws://127.0.0.1:6081');

socket.on('open', () => {
    console.log('connect gateway success!');
});

socket.on('error', error => {
    console.log('websocket error：', error.message);
});

socket.on('close', error => {
    console.log('websocket close');
});

socket.on('message', data => {
    console.log(data);
});