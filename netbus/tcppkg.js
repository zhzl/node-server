const tcppkg = {
    read_package_size(pkg_data, offset) {
        if (pkg_data.length - offset < 2) {  // 没有办法获取长度信息
            return -1;
        }
        return pkg_data.readInt16LE(offset);
    },

    package_data(data) {
        let buf = Buffer.allocUnsafe(2 + data.length);
        buf.writeInt16LE(2 + data.length, 0);
        buf.fill(data, 2);
    }
}

module.exports = tcppkg;