const redis = require('redis');
const log = require('../utils/log');

let center_redis = null;

function connect_to_center(host, port, db_index) {
    // 创建 client
    center_redis = redis.createClient({
        host: host,
        port: port,
        db: db_index,
    });

    // 连上服务器
    center_redis.on('ready', () => {
        log.info('redis ready');
    });

    center_redis.on('error', err => {
        log.info('redis error: ', err.message);
    });

    center_redis.on('end', () => {
        log.info('redis end');
    });
}

function set_uinfo_inredis(uid, uinfo) {
    if (center_redis === null) {
        return;
    }

    let key = 'my_game_center_user_uid_' + uid;
    uinfo.uface = uinfo.uface.toString();
    uinfo.usex = uinfo.usex.toString();
    uinfo.uvip = uinfo.uvip.toString();
    uinfo.is_guest = uinfo.is_guest.toString();

    log.info('redis center hmset ', key);

    center_redis.hmset(key, uinfo, err => {
        if (err) {
            log.info(err);
        }
    });
}

module.exports = {
    connect_to_center: connect_to_center,
    set_uinfo_inredis: set_uinfo_inredis,
}