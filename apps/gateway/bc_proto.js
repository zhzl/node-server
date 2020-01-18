/**
 * 广播服务编码与解码
 */

const Cmd = require('../Cmd');
const Stype = require('../Stype');
const proto_man = require('../../netbus/proto_man');
const proto_tools = require('../../netbus/proto_tools');

/**
 * 编码器
 * @param {*} stype Stype.Broadcast
 * @param {*} ctype Cmd.Broadcast
 * @param {*} body body: {
 *  cmd_buf: <Buffer>, 要发送给用户的数据
 *  users: [uid1, uid2, uid3, ...], 要接收的用户
 * }
 */
function encode_broadcast(stype, ctype, body) {
    let buf_len = body.cmd_buf.length;
    let user_num = body.users.length;
    let total_len = proto_tools.header_size + (2 + buf_len) + (2 + user_num * 4);
    let cmd_buf = proto_tools.alloc_buffer(total_len);

    // 写入头信息
    let offset = proto_tools.write_cmd_header_inbuf(cmd_buf, stype, ctype);
    
    // 写入数据长度
    proto_tools.write_int16(cmd_buf, offset, buf_len);
    offset += 2;

    // 写入数据
    body.cmd_buf.copy(cmd_buf, offset, 0, buf_len);
    offset += buf_len;

    // 写入要接收消息的用户数量
    proto_tools.write_int16(cmd_buf, offset, user_num);
    offset += 2;

    // 写入用户 uid
    for (let i in body.users) {
        proto_tools.write_int32(cmd_buf, offset, body.users[i]);
        offset += 4;
    }

    return cmd_buf;
}

/**
 * 解码器
 * @param {*} cmd_buf 
 */
function decode_broadcast(cmd_buf) {
    let cmd = {};
    let body = {};
    cmd[0] = proto_tools.read_int16(cmd_buf, 0);
    cmd[1] = proto_tools.read_int16(cmd_buf, 2);
    cmd[2] = body;

    let offset = proto_tools.header_size;
    let buf_len = proto_tools.read_int16(cmd_buf, offset);
    offset += 2;

    body.cmd_buf = Buffer.allocUnsafe(buf_len);
    cmd_buf.copy(body.cmd_buf, 0, offset, offset + buf_len);
    offset += buf_len;

    body.users = [];
    let user_num = proto_tools.read_int16(cmd_buf, offset);
    offset += 2;

    for (let i = 0; i < user_num; i++) {
        let uid = proto_tools.read_int32(cmd_buf, offset);
        body.users.push(uid);
        offset += 4;
    }
    
    return cmd;
}

proto_man.reg_encoder(Stype.Broadcast, Cmd.Broadcast, encode_broadcast);
proto_man.reg_decoder(Stype.Broadcast, Cmd.Broadcast, decode_broadcast);