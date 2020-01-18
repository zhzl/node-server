require('../init')
const ws = require('ws');
const Stype = require('../apps/Stype');
const Cmd = require('../apps/Cmd');
const proto_man = require('../netbus/proto_man');

const socket = new ws('ws://127.0.0.1:6081');

socket.on('open', () => {
    console.log('connect gateway success!');

    send_cmd(socket, Stype.Auth, Cmd.Auth.GUEST_LOGIN, 'jdlfkgjsldfjgksflgj');
});

socket.on('error', error => {
    console.log('websocket error：', error.message);
});

socket.on('close', error => {
    console.log('websocket close');
});

socket.on('message', data => {
    data = proto_man.decode_cmd(proto_man.PROTO_JSON, Stype.Auth, Cmd.Auth.GUEST_LOGIN, data);
    console.log(data);
});

function send_cmd(socket, stype, ctype, body) {
    let cmd_buf = proto_man.encode_cmd(null, proto_man.PROTO_JSON, stype, ctype, body);
    socket.send(cmd_buf);
}