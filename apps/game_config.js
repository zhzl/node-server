const HOST_IP = '127.0.0.1';

let game_config = {
    // 网关 ip
    GATEWAY_CONNECT_IP: '127.0.0.1',

    // 网关配置
    gateway_config: {
        host: HOST_IP,
        ports: [6080, 6081],  //6080: tcp  6081: websocket
    },

    // web 服务器
    webserver: {
        host: HOST_IP,
        port: 10001,
    }
}

module.exports = game_config;