require('../init')
const net = require('net');
const Stype = require('../apps/Stype');
const Cmd = require('../apps/Cmd');
const tcppkg = require('../netbus/tcppkg');
const proto_man = require('../netbus/proto_man');

const socket = net.connect({
    host: '127.0.0.1',
    port: 6080,
});

socket.on('connect', () => {
    console.log('connect gateway success!');

    send_cmd(socket, Stype.Auth, Cmd.Auth.GUEST_LOGIN, 'asdfgh');
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

function send_cmd(socket, stype, ctype, body) {
    let cmd_buf = proto_man.encode_cmd(null, proto_man.PROTO_JSON, stype, ctype, body);
    cmd_buf = tcppkg.package_data(cmd_buf);
    socket.write(cmd_buf);
}