/**
 * 随机生成 [begin, end) 范围的数
 */
function random_int(begin, end) {
    return Math.floor(Math.random() * (end - begin) + begin);
}

/**
 * 随机生成字符串
 */
function random_string(len) {
    let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    let totalCount = $chars.length;
    let ret = [];
    for (let i = 0; i < len; i++) {
        ret.push($chars.charAt(Math.floor(Math.random() * totalCount)));
    }
    return ret.join('');
}

/**
 * 随机生成数字字符串
 */
function random_int_str(len) {
    let $chars = '0123456789';
    let totalCount = $chars.length;
    let ret = [];
    for (let i = 0; i < len; i++) {
        ret.push($chars.charAt(Math.floor(Math.random() * totalCount)));
    }
    return ret.join('');
}

module.exports = {
    random_int: random_int,
    random_string: random_string,
    random_int_str: random_int_str,
};