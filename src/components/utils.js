export function toArray(value) {
    return Array.from ? Array.from(value) : Array.slice.call(value);
}

// arrayBuffer转换成DataURL
export function arrayBufferToDataURL(arrayBuffer, mimeType) {
    const chunks = [];

    // Chunk Typed Array for better performance (#435)
    const chunkSize = 8192;
    let uint8 = new Uint8Array(arrayBuffer);

    while (uint8.length > 0) {
        // XXX: Babel's `toConsumableArray` helper will throw error in IE or Safari 9
        chunks.push(String.fromCharCode.apply(null, toArray(uint8.subarray(0, chunkSize))));
        uint8 = uint8.subarray(chunkSize);
    }

    return `data:${mimeType};base64,${btoa(chunks.join(''))}`;
}

// objectURL转换成Blob对象
export function objectURLToBlob(url, callback) {
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.responseType = "blob";
    http.onload = function () {
        if (this.status == 200 || this.status === 0) {
            callback(this.response);
        }
    };
    http.send();
}

// dataURL转换成ArrayBuffer
export function dataURLToArrayBuffer(dataURL) {
    const base64 = dataURL.replace(/^data:.*,/, '');
    const binary = atob(base64);
    const arrayBuffer = new ArrayBuffer(binary.length);
    const uint8 = new Uint8Array(arrayBuffer);

    let i = binary.length;
    while(i--){
        uint8[i] = binary.charCodeAt(i);
    }
    return arrayBuffer;
}

// ArrayBuffer对象 Unicode码转字符串
function getStringFromCharCode(dataView, start, length) {
    var str = '';
    var i;
    for (i = start, length += start; i < length; i++) {
        str += String.fromCharCode(dataView.getUint8(i));
    }
    return str;
}

/**
 * dataURL转换成Blob对象
 */
export function dataURLToBlob(dataURL) {
    // base64拆分开
    let arr = dataURL.split(',');
    // 获取到格式
    let format = arr[0].match(/:(.*?);/)[1];
    // 获取到base64解码数据
    let data = window.atob(arr[1]);
    // 因为颜色数据刚好都是符合8位二进制的无符号整数,所以这里采用Uint8Array,8位无符号正整数数组来处理
    let n = data.length;
    let u8arr = new Uint8Array(n);
    while(n--){
        // 获得图像数据字符对应的Unicode编码，0-255之间
        u8arr[n] = data.charCodeAt(n);
    }
    return new Blob([u8arr], {type:format});
}


/**
 * 获取方向值
 * @param {ArrayBuffer} arrayBuffer类型的图片数据
 * @returns {number} 返回方向值
 */
export function getOrientation(arrayBuffer) {
    var dataView = new DataView(arrayBuffer);
    var orientation; // 当图像没有正确的Exif信息时忽略范围错误(大部分图片是没有方向值的，只有照片图片才有方向值，如果是普通图片获取不到方向值直接返回1正常正常处理就行)

    try {
        var littleEndian;
        var app1Start;
        var ifdStart; // 仅处理JPEG图像 (start by 0xFFD8)

        if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
            var length = dataView.byteLength;
            var offset = 2;

            while (offset + 1 < length) {
                if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
                    app1Start = offset;
                    break;
                }

                offset += 1;
            }
        }

        if (app1Start) {
            var exifIDCode = app1Start + 4;
            var tiffOffset = app1Start + 10;

            if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
                var endianness = dataView.getUint16(tiffOffset);
                littleEndian = endianness === 0x4949;

                if (littleEndian || endianness === 0x4D4D
                    /* bigEndian */
                ) {
                    if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
                        var firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

                        if (firstIFDOffset >= 0x00000008) {
                            ifdStart = tiffOffset + firstIFDOffset;
                        }
                    }
                }
            }
        }

        if (ifdStart) {
            var _length = dataView.getUint16(ifdStart, littleEndian);

            var _offset;

            var i;

            for (i = 0; i < _length; i += 1) {
                _offset = ifdStart + i * 12 + 2;

                if (dataView.getUint16(_offset, littleEndian) === 0x0112
                    /* Orientation */
                ) {
                    // 8 is the offset of the current tag's value
                    _offset += 8; // Get the original orientation value

                    orientation = dataView.getUint16(_offset, littleEndian); // Override the orientation with its default value

                    dataView.setUint16(_offset, 1, littleEndian);
                    break;
                }
            }
        }
    } catch (error) {
        orientation = 1;
    }

    return orientation;
}

/**
 * 获取图片数据ArrayBuffer存储格式
 * @param {imagePath} 图片路径或远程地址
 * @returns {ArrayBuffer} ArrayBuffer数据
 */
export function getImageArrayBuffer(imagePath) {
    let data = null;
    return new Promise((reslove, reject) => {
        if (imagePath) {
            // DataURI(base64地址)
            if (/^data:/i.test(imagePath)) {
                data = dataURLToArrayBuffer(imagePath);
                reslove(data)
            } else if (/^blob:/i.test(imagePath)) {
                // ObjectURL(blob地址)
                var fileReader = new FileReader();
                fileReader.onload = function (e) {
                    data = e.target.result;
                    reslove(data)
                };
                objectURLToBlob(imagePath, function (blob) {
                    fileReader.readAsArrayBuffer(blob);
                });
            } else {
                // 普通图片地址
                var http = new XMLHttpRequest();
                http.onload = function () {
                    if (this.status == 200 || this.status === 0) {
                        data = http.response
                        reslove(data)
                    } else {
                        throw "Could not load image";
                    }
                    http = null;
                };
                http.open("GET", imagePath, true);
                http.responseType = "arraybuffer";
                http.send(null);
            }
        } else {
            reject('img error')
        }
    })
}

/**
 * 解析Exif方向值。
 * @param {number} 方向值
 * @returns {Object} 解析好的校正数据
 */
export function parseOrientation(orientation) {
    let rotate = 0;
    let scaleX = 1;
    let scaleY = 1;

    switch (orientation) {
        // Flip horizontal
        case 2:
            scaleX = -1;
            break;
        // 向左旋转180°
        case 3:
            rotate = -180;
            break;
        // Flip vertical
        case 4:
            scaleY = -1;
            break;
        // Flip vertical and rotate right 90°
        case 5:
            rotate = 90;
            scaleY = -1;
            break;
        // 向右旋转90°
        case 6:
            rotate = 90;
            break;
        // Flip horizontal and rotate right 90°
        case 7:
            rotate = 90;
            scaleX = -1;
            break;
        // 向左旋转90°
        case 8:
            rotate = -90;
            break;
    }

    return {
        rotate: rotate,
        scaleX: scaleX,
        scaleY: scaleY
    };
}
