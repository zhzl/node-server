/**
 * 服务管理器
 */

const log = require('../utils/log')
const proto_man = require('./proto_man.js')

// 存储所有的服务
let service_modules = {};

// 注册服务
function register_service(stype, service) {
    if (service_modules[stype]) {
        log.warn(service_modules[stype].name, 'service is registed!!!');
    }
    service_modules[stype] = service;
}

// 收到客户端数据
function on_recv_client_cmd(socket, cmd_buf) {
    // 根据收到的数据解码命令
    if (socket.is_encrypt) {
        log.info('解密数据');
        cmd_buf = proto_man.decrypt_cmd(cmd_buf);
    }

    // 解命令头
    let cmd_header = proto_man.decode_cmd_header(cmd_buf);
    if (!cmd_header) {
        return false;
    }

    stype = cmd_header[0];
    ctype = cmd_header[1];
    utag = cmd_header[2];
    proto_type = cmd_header[3];

    if (!service_modules[stype]) {
        log.error('未找到对应的模块, stype = ' + stype + JSON.stringify(service_modules));
        return false;
    }

    if (service_modules[stype].is_transfer) {
        //转发给对应的服务
        service_modules[stype].on_recv_player_cmd(socket, stype, ctype, null, utag, proto_type, cmd_buf);
        return true;
    }

    let cmd = proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
    if (!cmd) {
        log.error('服务管理器解析数据失败');
        return false;
    }

    body = cmd[2];
    service_modules[stype].on_recv_player_cmd(socket, stype, ctype, body, utag, proto_type, cmd_buf);

    return true;
}

// 收到连接的服务器数据
function on_recv_server_return(socket, cmd_buf) {
    // 根据收到的数据解码命令
    if (socket.is_encrypt) {
        log.info('解密数据');
        cmd_buf = proto_man.decrypt_cmd(cmd_buf);
    }

    // 解命令头
    let cmd_header = proto_man.decode_cmd_header(cmd_buf);
    if (!cmd_header) {
        return false;
    }

    stype = cmd_header[0];
    ctype = cmd_header[1];
    utag = cmd_header[2];
    proto_type = cmd_header[3];

    if (!service_modules[stype]) {
        log.error('未找到对应的模块, stype = ' + stype + JSON.stringify(service_modules));
        return false;
    }

    if (service_modules[stype].is_transfer) {
        //转发给对应的服务
        service_modules[stype].on_recv_server_return(socket, stype, ctype, null, utag, proto_type, cmd_buf);
        return true;
    }

    let cmd = proto_man.decode_cmd(proto_type, stype, ctype, cmd_buf);
    if (!cmd) {
        log.error('服务管理器解析数据失败');
        return false;
    }

    body = cmd[2];
    service_modules[stype].on_recv_server_return(socket, stype, ctype, body, utag, proto_type, cmd_buf);

    return true;
}

// 客户端掉线
function on_client_lost_connect(socket) {
    log.info('服务管理器 玩家离开');
    let uid = socket.uid;
    if (uid === 0) {
        return;
    }

    socket.uid = 0;
    // 遍历所有的服务模块，通知在这个服务上的这个玩家掉线了
    for (let key in service_modules) {  // key 为 stype
        if (service_modules[key].on_player_disconnect) {
            service_modules[key].on_player_disconnect(key, uid);
        }
    }
}

module.exports = {
    register_service: register_service,
    on_recv_client_cmd: on_recv_client_cmd,
    on_recv_server_return: on_recv_server_return,
    on_client_lost_connect: on_client_lost_connect
}
