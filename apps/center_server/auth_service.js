const log = require('../../utils/log');
const Cmd = require('../Cmd');
const Stype = require('../Stype');
const Responses = require('../Responses');
const auth_model = require('./auth_model');

function guest_login(socket, utag, proto_type, body) {
	if (!body) {
		socket.send_cmd(Stype.Auth, Cmd.Auth.GUEST_LOGIN, Responses.INVALID_PARAMS, utag, proto_type);
		return;
	}

	let ukey = body;
	auth_model.guest_login(ukey, ret => {
		socket.send_cmd(Stype.Auth, Cmd.Auth.GUEST_LOGIN, ret, utag, proto_type);
	});
}

let service = {
    name: 'auth_service',      // 服务名称
    is_transfer: false,        // 是否为转发模块

	/**
	 * 收到客户端给我们发过来的数据
	 * @param {*} socket 
	 * @param {*} ctype 
	 * @param {*} body 
	 * @param {*} raw_cmd 为未解开的cmd,如果是网关只需要转发
	 */
	on_recv_player_cmd:  function(socket, stype, ctype, body, utag, proto_type, raw_cmd){
		log.info(`auth_service: ${stype} ${ctype} utag = ${utag} ${body}`);
		switch (ctype) {
			case Cmd.Auth.GUEST_LOGIN:
				guest_login(socket, utag, proto_type, body);	
				break;
		}
	},

	/**
	 * 收到连接的服务给我们发过来的数据
	 */
	on_recv_server_return: function(socket, stype, ctype, body, utag, proto_type, raw_cmd){

	},

	/**
	 * 收到客户端断开连接
	 * @param {*} socket 
	 */
	on_player_disconnect: function(stype, uid){

	},
}

module.exports = service;