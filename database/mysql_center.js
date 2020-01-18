const mysql = require('mysql');
const util = require('util');
const log = require('../utils/log');
const Responses = require('../apps/Responses');

let conn_pool = null;
function connect_to_center(host, port, db_name, uname, upwd) {
    conn_pool = mysql.createPool({
		host: host,        // 数据库服务器的IP地址
		port: port,        // my.cnf指定了端口，默认的mysql的端口是3306,
		database: db_name, // 要连接的数据库
		user: uname,
		password: upwd,
    });
}

/**
 * 
 * @param {*} sql 
 * @param {*} callback 接收3个参数：1 err, 2 rows, 3 每个字段的说明 
 */
function mysql_exec(sql, callback) {
	conn_pool.getConnection((err, conn) => {
		if (err) {
			if (callback) {
				log.error('连接数据库出错, message = ', err.message);
				callback(err, null, null);
			}
			return;
		}

		conn.query(sql, (sql_err, sql_result, fields_desc) => {
			conn.release();
			if (sql_err) {
				if (callback) {
					callback(sql_err, null, null);
				}
				return;
			}
			if (callback) {
				callback(null, sql_result, fields_desc);
			}
		});
	});
}

/**
 * 通过 ukey 获取用户信息
 * @param {*} ukey 
 * @param {*} callback 
 */
function get_guest_uinfo_by_ukey(ukey, callback) {
	let sql = 'select uid, unick, usex, uface, uvip, status, is_guest, guest_key from uinfo where guest_key = \"%s\"';
	let sql_cmd = util.format(sql, ukey);
	log.info(sql_cmd);
	mysql_exec(sql_cmd, (sql_err, sql_ret, field_desc) => {
		if (sql_err) {
			log.error('执行数据库指令出错, message: ', sql_err.message);
			callback(Responses.SYSTEM_ERR, null);
			return;
		}
		callback(Responses.OK, sql_ret);
	});
}

function insert_guest_user(uface, unick, usex, ukey, callback) {
	let sql = 'insert into uinfo(`guest_key`, `unick`, `uface`, `usex`, `is_guest`) values(\"%s\", \"%s\", %d, %d, 1)';
	let sql_cmd = util.format(sql, ukey, unick, uface, usex);
	log.info(sql_cmd);
	mysql_exec(sql_cmd, (sql_err, sql_ret, field_desc) => {
		if (sql_err) {
			log.error('执行数据库指令出错, message: ', sql_err.message);
			callback(Responses.SYSTEM_ERR, null);
			return;
		}
		callback(Responses.OK, null);
	});
}

module.exports = {
	connect_to_center: connect_to_center,
	get_guest_uinfo_by_ukey: get_guest_uinfo_by_ukey,
	insert_guest_user: insert_guest_user,
}