/**
 * UC1114 HEX Payload Decoder
 * 
 * Payload example: 0100010200000901000A0101
 */

function parseHexString(str) {
    const result = [];
    while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }
    return result;
}

function readUInt16LE(bytes) {
    const value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    const ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xFFFFFFFF);
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return (ref > 0x7FFFFFFF) ? ref - 0x100000000 : ref;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function consume(event) {

    const payload = event.data.payloadHex;
    //const payload = "FF120474657374";
    const bytes = parseHexString(payload);

    const decoded = {};
    //const lifecycle = {};

    for (let i = 0; i < bytes.length;) {
        const channelId = bytes[i++];
        const channelType = bytes[i++];

        // Custom message uplink
        if (channelId === 0xFF && channelType === 0x12) {
            var messageLength = bytes[i++];
            var message = '';
            for (let k = 0; k < messageLength; k++) {
                //var test = bytes[i + k];
                message += String.fromCharCode(bytes[i + k]);
            }
            decoded.message = message;
            break;
        }

        // Digital Input 1
        if (channelId === 0x01 && channelType !== 0xc8) {
            decoded.din1 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        // Digital Input 2
        else if (channelId === 0x02 && channelType !== 0xc8) {
            decoded.din2 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        // Pulse Counter 1
        else if (channelId === 0x01 && channelType === 0xc8) {
            decoded.counter1 = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // Pulse Counter 2
        else if (channelId === 0x02 && channelType === 0xc8) {
            decoded.counter2 = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        }
        // Digital Output 1
        else if (channelId === 0x09) {
            decoded.dout1 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        // Digital Output 2
        else if (channelId === 0x0a) {
            decoded.dout2 = bytes[i] === 0 ? "off" : "on";
            i += 1;
        }
        else {
            break;
        }
    }

    if (!isEmpty(decoded)) {
        emit("sample", { data: decoded, topic: "default" });
    }
}
