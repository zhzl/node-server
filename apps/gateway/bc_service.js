/**
 * 广播服务
 * 游戏服务器发送数据和玩家的uid，网关根据uid依次把数据发给玩家
 */

require('./bc_proto');
const log = require('../../utils/log');
const gw_service = require('./gw_service');

let service = {
    name: 'bc_service',        // 服务名称
    is_transfer: false,        // 是否为转发模块

	/**
	 * 收到客户端给我们发过来的数据
	 * @param {*} socket 
	 * @param {*} ctype 
	 * @param {*} body 
	 * @param {*} raw_cmd 为未解开的cmd,如果是网关只需要转发
	 */
	on_recv_player_cmd:  function(socket, stype, ctype, body, utag, proto_type, raw_cmd){

	},

	/**
	 * 收到连接的服务给我们发过来的数据
	 */
	on_recv_server_return: function(socket, stype, ctype, body, utag, proto_type, raw_cmd){
        log(`bc_service: 收到消息 ${stype} ${ctype} ${body}`);

        let cmd_buf = body.cmd_buf;
        let users = body.users;

        for (let i in users) {
            let client_socket = gw_service.get_socket_by_uid(users[i]);
            if (!client_socket) {  // 玩家掉线
                continue;
            }

            client_socket.send_encoded_cmd(cmd_buf);
        }
	},

	/**
	 * 收到客户端断开连接
	 * @param {*} socket 
	 */
	on_player_disconnect: function(stype, uid){

	},
}

module.exports = service;