/**
 * 网关服务
 */

const Cmd = require('../Cmd');
const Stype = require('../Stype');
const Responses = require('../Responses');
const log = require('../../utils/log');
const netbus = require('../../netbus/netbus');
const proto_man = require("../../netbus/proto_man");
const proto_tools = require("../../netbus/proto_tools");

function is_before_login(stype, ctype) {
    if (stype !== Stype.Auth) {
        return false
    }

    const cmd_set = [
        Cmd.Auth.GUEST_LOGIN,
        Cmd.Auth.UNAME_LOGIN,
        Cmd.Auth.GET_PHONE_REG_VARIFY,
        Cmd.Auth.PHONE_REG_ACCOUNT,
        Cmd.Auth.GET_FORGET_PWD_VERIFY,
        Cmd.Auth.RESET_USER_PWD,
    ];

    let index = cmd_set.indexOf(ctype);
    if (index !== -1) {
        return true;
    }

    return false;
}

function is_login_cmd(stype, ctype) {
	if(stype != Stype.Auth){
		return false;
	}

	if(ctype == Cmd.Auth.GUEST_LOGIN || ctype == Cmd.Auth.UNAME_LOGIN){
		return true;
    }
    
	return false;
}

//网关保存了session和uid的对应关系，所以可以把数据发送回客户端
let uid_socket_map = {};

function get_socket_by_uid(uid){
	return uid_socket_map[uid];
}

function save_socket_with_uid(uid, socket, proto_type){
	uid_socket_map[uid] = socket;
	socket.proto_type = proto_type;
}

function clear_socket_with_uid(uid){
	uid_socket_map[uid] = null;
	delete uid_socket_map[uid];
}

let service = {
    name: 'gw_service',  // 服务名称
    is_transfer: true,   // 是否为转发模块

	/**
	 * 收到客户端给我们发过来的数据
	 * @param {*} socket 
	 * @param {*} ctype 
	 * @param {*} body 
	 * @param {*} raw_cmd 为未解开的cmd,如果是网关只需要转发
	 */
	on_recv_player_cmd:  function(socket, stype, ctype, body, utag, proto_type, raw_cmd){
        log.info(`gw_service: 收到数据 stype = ${stype}, ctype = ${ctype} ${raw_cmd} ${is_before_login()}`);

        let service_socket = netbus.get_server_socket(stype);
        if (!service_socket) {
            log.error('gw_service: 未找到 service_socket');
            return;
        }

        // 设置能够标识客户端的 utag
        if (is_before_login(stype, ctype)) {
            utag = socket.socket_key;
        } else {
            if (socket.uid === 0) {
                // 未登录，发送了非法命令
                return;
            }
            utag = socket.uid;
        }

        // 加上 utag 然后转发给对应的服务器
        proto_tools.write_utag_inbuf(raw_cmd, utag);
        service_socket.send_encoded_cmd(raw_cmd);
	},

	/**
	 * 收到连接的服务给我们发过来的数据
	 */
	on_recv_server_return: function(socket, stype, ctype, body, utag, proto_type, raw_cmd){
        let client_socket = null;
        if (is_before_login(stype, ctype)) {
            client_socket = netbus.get_client_socket(utag);
            if (!client_socket) {
                return;
            }

            if (is_login_cmd(stype, ctype)) {
                let cmd_ret = proto_man.decode_cmd(proto_type, stype, ctype, raw_cmd);
                body = cmd_ret[2];
                if (body.status === Responses.OK) {  // 登录成功
                    let prev_socket = get_socket_by_uid(body.uid);
                    if (prev_socket) {  // 以前登录过，发送一个命令给客户端
                        prev_socket.send_cmd(stype, Cmd.Auth.RELOGIN, null, 0, prev_socket.proto_type);
                        prev_socket.uid = 0;  // 可能会有隐患，是否通知其它的服务
                        netbus.socket_close(prev_socket);
                    }

                    client_socket.uid = body.uid;  // 获取uid
                    save_socket_with_uid(body.uid, client_socket, proto_type);

                    body.uid = 0;
                    raw_cmd = proto_man.encode_cmd(utag, proto_type, stype, ctype, body);
                }
            }
        } else {
            client_socket = get_socket_by_uid(utag);
            if (!client_socket) {
                return;
            }
        }

        // 消除 utag，然后发送给客户端
        proto_tools.clear_utag_inbuf(raw_cmd);
        client_socket.send_encoded_cmd(raw_cmd);
	},

	/**
	 * 收到客户端断开连接
	 * @param {*} socket 
	 */
	on_player_disconnect: function(stype, uid){
        // 由 Auth 服务保存的就由 Auth 清空
        if (stype === Stype.Auth) {
            clear_socket_with_uid(uid);
        }

        let server_socket = netbus.get_server_socket(stype);
        if (!server_socket) {
            return;
        }

        let utag = uid;
        server_socket.send_cmd(stype, Cmd.User_Disconnect, null, utag, proto_man.PROTO_JSON);
	},
}

service.get_socket_by_uid = get_socket_by_uid;

module.exports = service;