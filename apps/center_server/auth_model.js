const log = require('../../utils/log');
const utils = require('../../utils/utils');
const Responses = require('../Responses');
const mysql_center = require('../../database/mysql_center');
const redis_center = require('../../database/redis_center');

/**
 * 游客登录
 * @param {*} ukey 
 * @param {*} callback 
 */
function guest_login(ukey, callback) {
    let unick = `游客${utils.random_int_str(4)}`;
    let usex = utils.random_int(0, 2);
    let uface = 0;

    // 查询数据库有无用户
    mysql_center.get_guest_uinfo_by_ukey(ukey, (status, data) => {
        if (status !== Responses.OK) {
            write_err(status, callback);
            return;
        }

        // 没有注册
        if (data.length <= 0) {
            // 注册游客用户
            mysql_center.insert_guest_user(uface, unick, usex, ukey, (status, data) => {
                if (status !== Responses.OK) {
                    write_err(status, callback);
                    return;
                }
                // 重新登录
                guest_login(ukey, callback);
            });
        } else {
            if (data[0].status !== 0) {  // 非法账号
                write_err(Responses.ILLEGAL_ACCOUNT, callback);
                return;
            }

            log.info('data = ', JSON.stringify(data));

            if (data[0].is_guest != 1) { // 非游客账号
                write_err(Responses.INVALIDI_OPT, callback);
                return;
            }

            guest_login_success(data[0], callback);
        }
    });

}

function guest_login_success(data, callback) {
    let ret = {};
    // 游客登录成功
    ret['status'] = Responses.OK;
    ret['uid'] = data.uid;
    ret['unick'] = data.unick;
    ret['usex'] = data.usex;
    ret['uface'] = data.uface;
    ret['uvip'] = data.uvip;
    ret['ukey'] = data.guest_key;
    ret.is_guest = data.is_guest;

    // 将用户信息缓存到 redis
    redis_center.set_uinfo_inredis(data.uid, {
        unick: data.unick,
        uface: data.uface,
        usex: data.usex,
        uvip: data.uvip,
        is_guest: 1,
    });

    callback(ret);
}

function write_err(status, callback) {
    let ret = {};
    ret.status = status;
    callback(ret);
}

module.exports = {
    guest_login: guest_login,
}