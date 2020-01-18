/**
 * 网关服务器
 * 只有这台机器会放到外网,其他的服务器在局域网
 * 转发模块
 * 
 * 功能：
 * (1) 将客户端发来的数据转发给对应的服务器
 * (2) 将对应的服务发回来的请求回给客户端
 * (3) 做负载均衡 可选，可以考虑Maker-Work模式. 主要做服务,负载也可以通过服务开子服务解决
 */

require('../../init.js');
const game_config = require('../game_config');
const netbus = require('../../netbus/netbus');
const service_manager = require('../../netbus/service_manager');
const gw_service = require('./gw_service');
const bc_service = require('./bc_service');
let Stype = require('../Stype');

let host = game_config.gateway_config.host;
let ports = game_config.gateway_config.ports;

// 启动服务器
// TCP
netbus.start_tcp_server(host, ports[0], true);
// WebSocket
netbus.start_ws_server(host, ports[1], true);

// 注册广播服务
service_manager.register_service(Stype.Broadcast, bc_service);

// 网关连接其它服务器
let game_server = game_config.gw_connect_servers;
for (let key in game_server) {
    netbus.connect_tcp_server(game_server[key].stype, game_server[key].host, game_server[key].port, false);
    service_manager.register_service(game_server[key].stype, gw_service);
}
