const net = require('net');
const ws = require('ws');
const log = require('../utils/log');
const tcppkg = require('./tcppkg');
const proto_man = require('./proto_man');
const proto_tools = require('./proto_tools');
const service_manager = require('./service_manager');

// 所有客户端用户
let global_socket_list = {};
let global_socket_key = 1;

/**
 * 获取客户端 socket
 * @param socket_key
 */
function get_client_socket(socket_key) {
    return global_socket_list[socket_key];
}

/**
 * 客户端连入
 * @param {*} socket 
 * @param {*} is_ws 是否为 websocket
 * @param {*} is_encrypt 
 */
function on_socket_enter(socket, is_ws, is_encrypt) {
    if (is_ws) {
        log.info("socket enter", socket._socket.remoteAddress, socket._socket.remotePort, 'is_ws = true');
    } else {
        log.info("socket enter", socket.remoteAddress, socket.remotePort, 'is_ws = false');
    }

    socket.last_pkg = null;
    socket.is_ws = is_ws;
    socket.is_connected = true;
    socket.is_encrypt = is_encrypt;
    socket.uid = 0;    // 用户唯一标识 uid

    // 扩展 socket 的方法，供外部使用
    socket.send_cmd = socket_send_cmd;
    socket.send_encoded_cmd = socket_send_encoded_cmd;

    // 保存用户到 socket 列表
    global_socket_list[global_socket_key] = socket;
    socket.socket_key = global_socket_key;
    global_socket_key++;
}

/**
 * 客户端离开
 * @param {*} socket 
 */
function on_socket_exit(socket) {
    log.info("socket exit", ' is_ws = ', socket.is_ws);

    service_manager.on_client_lost_connect(socket);

    socket.last_pkg = null;
    socket.is_ws = false;
    socket.is_connected = false;

    // 从列表删除用户的 socket
    if (global_socket_list[socket.socket_key]) {
        global_socket_list[socket.socket_key] = null;
        delete global_socket_list[socket.socket_key];
        socket.socket_key = null;
    }
}

/**
 * 收到客户端消息
 * @param {*} socket 
 * @param {*} cmd_buf 
 */
function on_socket_recv_cmd(socket, cmd_buf) {
    let result = service_manager.on_recv_client_cmd(socket, cmd_buf);
    if (!result) {
        log.err('解码失败');
        socket_close(socket);
    }
}

/**
 * 服务器主动关闭 socket
 * @param {*} socket 
 */
function socket_close(socket) {
    log.warn('服务器主动关闭了socket', socket.is_ws, socket.socket_key);
    if (socket.is_ws) {
        socket.end();
    } else {
        socket.close();
    }
}

function socket_send_cmd(stype, ctype, body, utag, proto_type) {
    if (!this.is_connected) {
        log.error("客户端未连接,不能发送消息");
        return;
    }
    let cmd = proto_man.encode_cmd(utag, proto_type, stype, ctype, body);
    if (cmd) {
        this.send_encoded_cmd(cmd);
    }
}

function socket_send_encoded_cmd(cmd) {
    if (this.is_connected == false) {
        log.error('客户端未连接,不能发送消息');
        return;
    }

    if (this.is_encrypt) {
        log.info('加密数据')
        cmd = proto_man.encrypt_cmd(cmd);
    }

    let socket = this;
    let stype = proto_tools.read_int16(cmd, 0);
    let ctype = proto_tools.read_int16(cmd, 2);
    let uid = proto_tools.read_int32(cmd, 4);
    if (socket.is_ws) {
        socket.send(cmd);
        log.info('回给内部客户端的消息为: stype = ' + stype + ',ctype = ' + ctype + ',uid = ' + uid + ',body = ' + data);
    } else {
        let data = tcppkg.package_data(cmd);
        socket.write(data);
        log.info('回给客户端的消息为: stype = ' + stype + ',ctype = ' + ctype + ',uid = ' + uid + ',body = ' + cmd);
    }
}

/********************* tcp server begin ************************/

function start_tcp_server(ip, port, is_encrypt) {
    log.info(`start_tcp_server, ip = ${ip}, port = ${port}`);

    const server = net.createServer(socket => {
        add_client_socket_event_listener(socket, is_encrypt);
    });

    // 服务器发生错误
    server.on('error', err => {
        log.error('server error.');
    });

    // 服务器关闭
    server.on('close', () => {
        log.error('server close.');
    });

    server.listen({
        host: ip,
        port: port,
        exclusive: true,
    });
}

function add_client_socket_event_listener(socket, is_encrypt) {
    // 设置你接收的格式
    // socket.setEncoding("utf8");
    // socket.setEncoding("hex");   // 转成二进制的文本编码

    // 接收到客户端的数据
    // data 默认是Buffer对象
    // 如果你没有设置任何编码 <Buffer 48 65 6c 6c 6f 57 6f 72 6c 64 21>
    // 如果设置 utf8 编码，那么底层会先转换成 utf8 的字符串：utf8 --> HelloWorld!!!
    // 如果设置 hex 编码：hex--> "48656c6c6f576f726c6421"
    socket.on('data', data => {
        // 检验数据合法性
        if (Buffer.isBuffer(data)) {
            log.error('tcp 协议未收到 Buffer 类型的数据');
            socket_close(socket);
            return;
        }

        // 检测是否有上次未处理完的数据
        let last_pkg = socket.last_pkg;
        if (last_pkg) {
            last_pkg = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
        } else {
            last_pkg = data;
        }

        // 读取包数据
        let offset = 0;
        let pkg_len = tcppkg.read_package_size(last_pkg, offset);
        if (pkg_len < 0) {
            return;
        }

        while (last_pkg.length - offset >= pkg_len) {  // 判断是否有完整的包
            // 根据长度信息来读取我们的数据
            let cmd_buf;
            cmd_buf = Buffer.allocUnsafe(pkg_len - 2);  // 2个长度信息
            last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
            on_socket_recv_cmd(socket, cmd_buf);

            offset += pkg_len;
            if (offset >= last_pkg.length) {  // 包处理完了
                break;
            }

            let pkg_len = tcppkg.read_package_size(last_pkg, offset);
            if (pkg_len < 0) {
                return;
            }
        }

        // 处理剩下的半包
        if (offset >= last_pkg.length) {
            last_pkg = null;
        } else {
            let buf = Buffer.allocUnsafe(last_pkg.length - offset);
            last_pkg.copy(buf, 0, offset, last_pkg.length);
            last_pkg = buf;
        }
        socket.last_pkg = last_pkg;
    });

    socket.on('error', err => {
        log.error('socket error:', err.message);
    });

    // 客户端断开连接
    socket.on('close', () => {
        on_socket_exit(socket);
    });

    on_socket_enter(socket, false, is_encrypt);
}

/********************* tcp server end ************************/


/********************* ws server begin ************************/

function start_ws_server(ip, port, is_encrypt) {
    log.info(`start_ws_server, ip = ${ip}, port = ${port}`);

    let server = new ws.Server({
        host: ip,
        port: port
    });

    server.on('connection', socket => {
        ws_add_client_socket_event_listener(socket, is_encrypt);
    });

    server.on('error', err => {
        log.info('ws listen error');
    });

    server.on('close', data => {
        log.info('ws listen close');
    });
}

function ws_add_client_socket_event_listener(socket, is_encrypt) {
    // message 事件, data已经是根据websocket协议解码开来的原始数据；
    // websocket底层有数据包的封包协议，所以，绝对不会出现粘包的情况。
    // 每解一个数据包，就会触发一个message事件;
    socket.on('message', data => {
        if (!Buffer.isBuffer(data)) {
            log.error('ws, buf协议, 收到的数据不是buf');
            socket_close(socket);
            return;
        }
        on_socket_recv_cmd(socket, data);
    });

    socket.on('error', err => {
        log.info("client error", err);
    });

    socket.on('close', () => {
        on_socket_exit(socket);
    });

    on_socket_enter(socket, true, is_encrypt);
}

/********************* ws server end ************************/

/********************* server to server ************************/

// 所有服务器 socket
let server_connect_list = {};

function get_server_socket(stype) {
    return server_connect_list[stype];
}

// gameway 需要连接其他的服务器
function connect_tcp_server(stype, host, port, is_encrypt) {
    let socket = net.connect({
        port: port,
        host: host
    });
    socket.is_connected = false;

    // 连接成功
    socket.on('connect', ()=>{
        socket.is_connected = true;
        on_socket_connected(stype, socket, false, is_encrypt);
    });

    socket.on('data', data => {
        //检测数据合法性
		if(!Buffer.isBuffer(data)){
			log.error('tcp协议未收到buf类型的数据');
		    socket_close(socket);
			return;
        }
        
        // 检测是否有上次未处理完的数据
        let last_pkg = socket.last_pkg;
        if (last_pkg) {
            last_pkg = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
        } else {
            last_pkg = data;
        }

        // 读取包数据
        let offset = 0;
        let pkg_len = tcppkg.read_package_size(last_pkg, offset);
        if (pkg_len < 0) {
            return;
        }

        while (last_pkg.length - offset >= pkg_len) {  // 判断是否有完整的包
            // 根据长度信息来读取我们的数据
            let cmd_buf;
            cmd_buf = Buffer.allocUnsafe(pkg_len - 2);  // 2个长度信息
            last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
            on_recv_cmd_server_return(socket, cmd_buf);

            offset += pkg_len;
            if (offset >= last_pkg.length) {  // 包处理完了
                break;
            }

            let pkg_len = tcppkg.read_package_size(last_pkg, offset);
            if (pkg_len < 0) {
                return;
            }
        }

        // 处理剩下的半包
        if (offset >= last_pkg.length) {
            last_pkg = null;
        } else {
            let buf = Buffer.allocUnsafe(last_pkg.length - offset);
            last_pkg.copy(buf, 0, offset, last_pkg.length);
            last_pkg = buf;
        }
        socket.last_pkg = last_pkg;
    });

    socket.on('close', ()=> {
        if (socket.is_connected) {
            on_socket_disconnect(socket);
        }
        socket.end();
        // 3s 后重连
        setTimeout(() => {
			log.warn('reconnect: ', stype, host, port, is_encrypt);
			connect_tcp_server(stype, host, port, is_encrypt);
        }, 3000);
    });

    socket.on('error', err => {

    });
}

// 收到服务器返回的消息
function on_recv_cmd_server_return(socket, cmd_buf) {
    let result = service_manager.on_recv_cmd_server_return(socket, cmd_buf);
    if (!result) {
        log.error('解码失败');
        socket_close(socket);
    }
}

// 成功连接到其他的服务器 -- gameway 使用
function on_socket_connected(stype, socket, is_ws, is_encrypt) {
    if (is_ws) {
        log.info("socket enter", socket._socket.remoteAddress, socket._socket.remotePort, 'is_ws = true');
    } else {
        log.info("socket enter", socket.remoteAddress, socket.remotePort, 'is_ws = false');
    }

    socket.last_pkg = null;
    socket.is_ws = is_ws;
    socket.is_connected = true;
    socket.is_encrypt = is_encrypt;

    // 扩展 socket 的方法，供外部使用
    socket.send_cmd = socket_send_cmd;
    socket.send_encoded_cmd = socket_send_encoded_cmd;

    // 保存用户到 socket 列表
    global_socket_list[stype] = socket;
    socket.socket_key = stype;
}

// 服务器断开连接
function on_socket_disconnect(socket) {
    socket.last_pkg = null;
    socket.is_ws = false;
    socket.is_connected = false;

    let stype = socket.socket_key;
    socket.socket_key = null;

    if (server_connect_list[stype]) {
        server_connect_list[stype] = null;
        delete server_connect_list[stype];
    }
}

module.exports = {
    start_tcp_server: start_tcp_server,
    start_ws_server: start_ws_server,
    socket_close: socket_close,
    connect_tcp_server: connect_tcp_server,
    get_client_socket: get_client_socket,
    get_server_socket: get_server_socket
}