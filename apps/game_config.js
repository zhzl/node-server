/**
 * 游戏配置
 */

const Stype = require('./Stype');
const HOST_IP = '127.0.0.1';

let game_config = {
    // 网关 ip
    GATEWAY_CONNECT_IP: '127.0.0.1',

    // web服务器
    webserver: {
        host: HOST_IP,
        port: 10001,
    },

    // 网关配置
    gateway_config: {
        host: HOST_IP,
        ports: [6080, 6081],  //6080: tcp  6081: websocket
    },

    // 网关连接的其它服务
    gw_connect_servers: {
        // 登录服务
        'Auth': {
            stype: Stype.Auth,
            host: HOST_IP,
            port: 6086
        },
        // 系统服务
        'GameSystem': {
            stype: Stype.GameSystem,
            host: HOST_IP,
            port: 6087
        },
    }
}

module.exports = game_config;