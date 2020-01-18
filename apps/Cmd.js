/**
 * 命令号
 */

module.exports = {
    // 用户掉线
    User_Disconnect: 10000,
    // 广播服务
    Broadcast: 10001,

    // 用户认证服务
    Auth: {
        GUEST_LOGIN: 1,             // 游客登录
        RELOGIN: 2,                 // 账号在其它地方登录
        EDIT_PROFILE: 3,            // 修改用户资料
        GUEST_UPGRADE_IDENTIFY: 4,  // 游客升级获取验证码
        BIND_PHONE_NUM: 5,          // 游客绑定手机账户
        UNAME_LOGIN: 6,             // 账号密码登录
        GET_PHONE_REG_VARIFY: 7,    // 获取手机注册的验证码
        PHONE_REG_ACCOUNT: 8,       // 注册账号
        GET_FORGET_PWD_VERIFY: 9,   // 忘记密码获取验证码
        RESET_USER_PWD: 10,         // 重置用户密码
    },

    // 系统服务
    GameSystem: {
        GET_GAME_INFO: 1,           // 获取游戏信息
        LOGIN_BONUES_INFO: 2,       // 获取登录奖励信息
        RECV_LOGIN_BONUES: 3,       // 领取登录奖励
        GET_WORLD_RANK_INFO: 4,     // 获取世界排行榜信息
    }
}
