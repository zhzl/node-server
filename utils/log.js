// 这里是 node.js 中的 util
// http://nodejs.cn/api/util.html
const util = require('util');

// 日志等级
const LEVEL = {
    ALL: Infinity,
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    NONE: -Infinity
};

// 日志颜色
// 参考：https://baijiahao.baidu.com/s?id=1630601858000127124&wfr=spider&for=pc
const COLOR = {
    RESET: '\u001b[0m',
    INFO: '\u001b[32m', // green
    WARN: '\u001b[33m', // yellow
    ERROR: '\u001b[31m' // red
}

// 日志等级
let globalLevel = LEVEL.ALL;
// 是否开启日志颜色
let coloredOutput = true;

function setLevel(level) {
    globalLevel = level;
}

function setColoredOutput(bool) {
    coloredOutput = bool;
}

function info() {
    if (LEVEL.INFO <= globalLevel) {
        // apply: 劫持 util 的 format 方法，相当于 this.format(arguments).
        // https://www.cnblogs.com/faithZZZ/p/6999327.html
        log(LEVEL.INFO, util.format.apply(this, arguments));
    }
}

function warn() {
    if (LEVEL.WARN <= globalLevel) {
        log(LEVEL.WARN, util.format.apply(this, arguments));
    }
}

function error() {
    if (LEVEL.ERROR <= globalLevel) {
        log(LEVEL.ERROR, util.format.apply(this, arguments));
    }
}

// 不应该直接调用 log 方法，否则得到的是错误的堆栈信息
function log(level, message) {
    let orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack; }
    let stack = new Error().stack;
    Error.prepareStackTrace = orig;
    // stack 是完整的堆栈信息数组，前三项为：
    // 0: log -- 1: (info, warn, error) -- 2: caller
    let caller = stack[2];

    // 获取 caller 的文件名、行号、列号
    let lineSep = process.platform == 'win32' ? '\\' : '/';
    let fileNameSplited = caller.getFileName().split(lineSep);
    let fileName = fileNameSplited[fileNameSplited.length - 1];
    let lineNumber = caller.getLineNumber();
    let columnNumber = caller.getColumnNumber();

    // 日志等级
    let levelString;
    switch (level) {
        case LEVEL.INFO:
            levelString = '[INFO]';
            break;
        case LEVEL.WARN:
            levelString = '[WARN]';
            break;
        case LEVEL.ERROR:
            levelString = '[ERROR]';
            break;
        default:
            levelString = '[]';
            break;
    }

    // 当前时间
    let nowString = (new Date()).toLocaleString();

    // 格式化输出
    let output = util.format('[%s] %s %s(%d,%d) %s',
        nowString, levelString, fileName, lineNumber, columnNumber, message
    );

    // 日志颜色
    if (!coloredOutput) {
        process.stdout.write(output + '\n');
    } else {
        switch (level) {
            case LEVEL.INFO:
                process.stdout.write(COLOR.INFO + output + COLOR.RESET + '\n');
                break;
            case LEVEL.WARN:
                process.stdout.write(COLOR.WARN + output + COLOR.RESET + '\n');
                break;
            case LEVEL.ERROR:
                process.stdout.write(COLOR.ERROR + output + COLOR.RESET + '\n');
                break;
            default:
                break;
        }
    }
}

module.exports = {
    info: info,
    warn: warn,
    error: error,
    LEVEL: LEVEL,
    setLevel: setLevel,
    setColoredOutput: setColoredOutput
}