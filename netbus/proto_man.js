/**
 * 规定：
 * (1): 服务号和命令号不能为 0
 * (2): 服务号和命名号大小不能超过2个细节的整数 65536
 * (3): buf 协议里 0-1 字节存放服务号，2-3 字节存放命令号
 * (4): 加密/解密
 * (5): 服务号和命令号都用小端存储
 * (6): 所有文本都使用 utf8
 */

const log = require('../utils/log')
const proto_tools = require('./proto_tools')

// 加密
function encrypt_cmd(cmd_buf) {
    return cmd_buf;
}

// 解密
function decrypt_cmd(cmd_buf) {
    return cmd_buf;
}

// json 编码
function json_encode(stype, ctype, body) {
    let cmd = {};
    cmd[0] = body;
    let str = JSON.stringify(cmd);
    let cmd_buf = proto_tools.encode_str_cmd(stype, ctype, str);
    return cmd_buf;
}

// json 解码
function json_decode(cmd_buf) {
    let cmd = proto_tools.decode_str_cmd(cmd_buf);
    let cmd_json = cmd[2];
    try {
        var body_set = JSON.parse(cmd_json);
        cmd[2] = body_set[0];//取出0
    } catch (e) {
        return null;
    }

    if (typeof (cmd[0]) == 'undefined' ||
        typeof (cmd[1]) == 'undefined' ||
        typeof (cmd[2]) == 'undefined') {
        return null;
    }

    return cmd;
}

/**
 * 消息封包
 * @param {*} utag 
 * @param {*} proto_type 协议类型 json/buf
 * @param {*} stype 服务号 服务号和命令号不能为0
 * @param {*} ctype 命令号
 * @param {*} body 消息内容 为对应的json对象
 */
function encode_cmd(utag, proto_type, stype, ctype, body) {
    let buf = null;
    if (proto_type === proto_man.PROTO_JSON) {
        buf = json_encode(stype, ctype, body);
    } else if (proto_type === proto_man.PROTO_BUF) {
        let key = get_key(stype, ctype);
        if (!encoders[key]) {
            log.error('未找到对应的编码器');
            return null;
        }
        // 改为通用模板
        buf = encoders[key](stype, ctype, body);
    }

    proto_tools.write_utag_inbuf(buf, utag);
    proto_tools.write_prototype_inbuf(buf, proto_type);
    return buf;
}

/**
 * 消息解包
 * @param {*} proto_type 
 * @param {*} stype 
 * @param {*} ctype 
 * @param {*} cmd_buf 
 */
function decode_cmd(proto_type, stype, ctype, cmd_buf) {
	if(cmd_buf.length < proto_tools.header_size){
		return null;
    }
    
    let cmd = null;
    if (proto_type === proto_man.PROTO_JSON) {
        cmd = json_decode(cmd_buf);
    } else if (proto_type === proto_man.PROTO_BUF) {
        let key = get_key(stype, ctype);

		if(!decoders[key]){
			log.error('未找到对应的解码器');
			return null;
		}
		cmd = decoders[key](cmd_buf);
    }

    return cmd;
}

function decode_cmd_header(cmd_buf){
	if(cmd_buf.length < proto_tools.header_size){
		return null;
	}
	var cmd = {};
	cmd[0] = proto_tools.read_int16(cmd_buf, 0);
	cmd[1] = proto_tools.read_int16(cmd_buf, 2);
	cmd[2] = proto_tools.read_uint32(cmd_buf, 4);
	cmd[3] = proto_tools.read_int16(cmd_buf, 8);
	return cmd;
}

//key = stype+ctype   value = decoder/encoder
function get_key(stype, ctype) {
    return (stype * 65536 + ctype);
}

//buff协议的编码/解码管理  stype, ctype ==>encode/decode
var decoders = {};//保存当前buf协议所有的解码函数  stype,ctype ===> decoder
var encoders = {};//保存当前buf协议所有的编码函数, stype,ctype ===> encoder

//encode_func(body) return 二进制Buffer数据
function reg_encoder(stype, ctype, encoder_func) {
    var key = get_key(stype, ctype);
    if (encoders[key]) {
        //已经注册过了，是否重复注册
        log.warn('stype: ', stype, "ctype: ", ctype, '已经注册过了.');
    }
    encoders[key] = encoder_func;
}

//decode_func(cmd_buf) return {0: stype, 1: ctype, 2: body}
function reg_decoder(stype, ctype, decode_func) {
    var key = get_key(stype, ctype);
    if (decoders[key]) {
        //已经注册过了，是否重复注册
        log.warn('stype: ', stype, "ctype: ", ctype, '已经注册过了.');
    }
    decoders[key] = decode_func;
}

let proto_man = {
    PROTO_JSON: 1,  // JSON 协议
    PROTO_BUF: 2,   // 二进制协议

    encode_cmd: encode_cmd,
    decode_cmd: decode_cmd,
    
	reg_decoder: reg_decoder,
	reg_encoder: reg_encoder,

	encrypt_cmd: encrypt_cmd,
	decrypt_cmd: decrypt_cmd,

	decode_cmd_header: decode_cmd_header,
}

module.exports = proto_man;