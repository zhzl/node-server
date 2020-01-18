/**
 * 小端存储
 */

/**
 * 读取 8 位整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 */
function read_int8(cmd_buf, offset) {
    return cmd_buf.readInt8(offset);
}

/**
 * 读取 16 位整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 */
function read_int16(cmd_buf, offset) {
    return cmd_buf.readInt16LE(offset);
}

/**
 * 读取 32 位整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 */
function read_int32(cmd_buf, offset) {
    return cmd_buf.readInt32LE(offset);
}

/**
 * 读取 32 位无符号整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 */
function read_uint32(cmd_buf, offset) {
    return cmd_buf.readUInt32LE(offset);
}

/**
 * 读取单精度浮点数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 */
function read_float(cmd_buf, offset) {
    return cmd_buf.readFloatLE(offset);
}

/**
 * 写入 8 位整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 * @param {*} value   数值
 */
function write_int8(cmd_buf, offset, value) {
    cmd_buf.writeInt8(value, offset);
}

/**
 * 写入 16 位整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 * @param {*} value   数值
 */
function write_int16(cmd_buf, offset, value){
	cmd_buf.writeInt16LE(value, offset);
}

/**
 * 写入 32 位整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 * @param {*} value   数值
 */
function write_int32(cmd_buf, offset, value){
	cmd_buf.writeInt32LE(value, offset);
}

/**
 * 写入 32 位无符号整数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 * @param {*} value   数值
 */
function write_uint32(cmd_buf, offset, value){
	cmd_buf.writeUInt32LE(value, offset);
}

/**
 * 写入单精度浮点数
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 * @param {*} value   数值
 */
function write_float(cmd_buf, offset, value){
	cmd_buf.writeFloatLE(value, offset);
}

/**
 * 读取指定字节数的 utf8 字符串
 * @param {*} cmd_buf   Buffer 对象
 * @param {*} offset    偏移
 * @param {*} byte_len  字节数
 */
function read_str(cmd_buf, offset, byte_len) {
    return cmd_buf.toString('utf8', offset, offset + byte_len);
}

/**
 * 写入字符串
 * @param {*} cmd_buf Buffer 对象
 * @param {*} offset  偏移
 * @param {*} str     字符串
 */
function write_str(cmd_buf, offset, str){
	cmd_buf.write(str, offset);
}

/**
 * 写入 utf8 字符串
 * @param {*} cmd_buf 
 * @param {*} offset 
 * @param {*} str 
 * @param {*} byte_len 
 */
function write_str_inbuf(cmd_buf, offset, str, byte_len) {
    if (typeof(byte_len) === 'undefined') {
        byte_len = str.utf8_byte_len();
    }
    write_int16(cmd_buf, offset, byte_len);
    offset += 2;

    write_str(cmd_buf, offset, str);
    offset += byte_len;

    return offset;
}

/**
 * 读取 utf8 字符串
 * @param {*} cmd_buf 
 * @param {*} offset 
 */
function read_str_inbuf(cmd_buf, offset) {
    let byte_len = read_int16(cmd_buf, offset);
    offset += 2;

    let str = read_str(cmd_buf, offset, byte_len);
    offset += byte_len;

    return [str, offset];
}

/**
 * 分配内存空间
 * @param {*} total_len 
 */
function alloc_buffer(total_len) {
    return Buffer.allocUnsafe(total_len);
}

function write_cmd_header_inbuf(cmd_buf, stype, ctype) {
    write_int16(cmd_buf, 0, stype);
    write_int16(cmd_buf, 2, ctype);
    write_int32(cmd_buf, 4, 0);
    return proto_tools.header_size;
}

function decode_empty_cmd(cmd_buf) {
    let cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    cmd[2] = null;
    return cmd;
}

function encode_empty_cmd(stype, ctype) {
    let cmd_buf = alloc_buffer(proto_tools.header_size);
    write_cmd_header_inbuf(cmd_buf, stype, ctype);
    return cmd_buf;
}

function decode_status_cmd(cmd_buf) {
    let cmd = {};
	cmd[0] = read_int16(cmd_buf, 0);
	cmd[1] = read_int16(cmd_buf, 2);
    var str = read_str_inbuf(cmd_buf, proto_tools.header_size)[0];
    try{
		cmd[2] = JSON.parse(str);
	}catch(e){
		cmd[2] = str;
	}
	return cmd;
}

function encode_status_cmd(stype, ctype, status) {
    let total_len = proto_tools.header_size + 2;
    let type = Object.prototype.toString.call(status);
    let str = '';
    if (type === "[Object Object]") {
        str = JSON.stringify(status);
        total_len += JSON.stringify(str).utf8_byte_len();
    } else {
        str = status;
        total_len += status.utf8_byte_len();
    }
    let cmd_buf = alloc_buffer(total_len);
    write_cmd_header_inbuf(cmd_buf, stype, ctype);
    write_str_inbuf(cmd_buf, proto_tools.header_size, str);
}

function decode_str_cmd(cmd_buf) {
	var cmd = {};
	cmd[0] = read_int16(cmd_buf, 0);
	cmd[1] = read_int16(cmd_buf, 2);
	
	var ret = read_str_inbuf(cmd_buf, proto_tools.header_size);
	cmd[2] = ret[0];

	return cmd;
}

function encode_str_cmd(stype, ctype, str) {
    let byte_len = str.utf8_byte_len();
    let total_len = proto_tools.header_size + 2 + byte_len;
    let cmd_buf = alloc_buffer(total_len);
    write_cmd_header_inbuf(cmd_buf, stype, ctype);
    write_str_inbuf(cmd_buf, proto_tools.header_size, str, byte_len);
    return cmd_buf;
}

function write_utag_inbuf(cmd_buf, utag) {
    write_uint32(cmd_buf, 4, utag);
}

function write_prototype_inbuf(cmd_buf, proto_type){
	write_int16(cmd_buf, 8, proto_type);
}

function clear_utag_inbuf(cmd_buf){
	write_uint32(cmd_buf, 4, 0);
}

let proto_tools = {
    header_size: 10,  // 2(stype) + 2(ctype) + 4(utag) + 2(协议类型 buf/json)

    // 源操作
	read_int8: read_int8,
	read_int16: read_int16,
	read_int32: read_int32,
	read_uint32: read_uint32,
    read_float: read_float,
	write_int8: write_int8,
	write_int16: write_int16,
	write_int32: write_int32,
	write_uint32: write_uint32,
    write_float: write_float,

    // 通用操作
	alloc_buffer: alloc_buffer,
	write_cmd_header_inbuf: write_cmd_header_inbuf,
	write_str_inbuf: write_str_inbuf,
	read_str_inbuf: read_str_inbuf,

    // 模板编码解码
	encode_empty_cmd: encode_empty_cmd,
	encode_status_cmd: encode_status_cmd,
	encode_str_cmd: encode_str_cmd,

	decode_empty_cmd: decode_empty_cmd,
	decode_status_cmd: decode_status_cmd,
    decode_str_cmd: decode_str_cmd,
    
	write_prototype_inbuf: write_prototype_inbuf,
	write_utag_inbuf: write_utag_inbuf,
	clear_utag_inbuf: clear_utag_inbuf,
}

module.exports = proto_tools;