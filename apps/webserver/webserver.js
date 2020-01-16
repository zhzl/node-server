const fs = require('fs');
const path = require('path');
const express = require('express');
const log = require('../../utils/log')
const game_config = require('../game_config')

const app = express();
const host = game_config.webserver.host;
const port = game_config.webserver.port;

const www_root = path.join(__dirname, '../../www_root');
if (fs.existsSync(www_root)) {
    app.use(express.static(www_root));
} else {
    log.warn('www_root is not exist!');
}

// 设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

// 获取服务器配置信息
app.get('/server_info', function(req, res) {
    const data = {
        host: game_config.GATEWAY_CONNECT_IP,
        tcp_port: game_config.gateway_config.ports[0],
        ws_port: game_config.gateway_config.ports[1],
    };

    let str_data = JSON.stringify(data);
    res.send(str_data);
    res.end();
});

// 启动 web 服务器
app.listen(port);
log.info('webserver started at host '+ host + ' port ' + port);
