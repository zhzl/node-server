/**
 * 中心服务器
 */

require('../../init');
const game_config = require('../game_config');
const netbus = require('../../netbus/netbus');
const service_manager = require('../../netbus/service_manager');
const Stype = require('../Stype');
const auth_service = require('./auth_service');

// 启动中心服务器
netbus.start_tcp_server(game_config.center_server.host, game_config.center_server.port, false);
// 注册auth服务
service_manager.register_service(Stype.Auth, auth_service);

// 连接中心数据库
const mysql_center = require('../../database/mysql_center');
mysql_center.connect_to_center(
    game_config.center_database.host,
    game_config.center_database.port,
    game_config.center_database.db_name,
    game_config.center_database.uname,
    game_config.center_database.upwd,
);

// 连接中心redis
const redis_center = require('../../database/redis_center');
redis_center.connect_to_center(
    game_config.center_redis.host,
    game_config.center_redis.port,
    game_config.center_redis.db_index,
);