const net = require('net');

const socket = net.connect({
    host: '127.0.0.1',
    port: 6080,
});

socket.on('connect', () => {
    console.log('connect gateway success!');
});

socket.on('error', error => {
    console.log('socket error：', error.message);
});

socket.on('close', error => {
    console.log('socket close');
});

socket.on('data', data => {
    console.log(data);
});