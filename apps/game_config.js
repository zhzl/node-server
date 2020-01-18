/**
 * 游戏配置
 */

const Stype = require('./Stype');
const HOST_IP = '127.0.0.1';
const mysql_root_password = '123456';

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
        // 'GameSystem': {
        //     stype: Stype.GameSystem,
        //     host: HOST_IP,
        //     port: 6087
        // },
    },

    // 中心服务器
    center_server: {
        host: HOST_IP,
        port: 6086,
        stypes: [Stype.Auth],
    },

    // 中心数据库
    center_database: {
        host: HOST_IP,
        port: 3306,
        db_name: 'mygame_center',
        uname: 'root',
        upwd: mysql_root_password
    },

    // 中心 redis
    center_redis: {
        host: HOST_IP,
        port: 6379,
        db_index: 0
    }
}

module.exports = game_config;