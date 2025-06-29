// This file overwrites the stock UV config.js

self.__uv$config = {
    prefix: "/uv/service/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
    bare: {
        url: "http://localhost:8081", // or your server's address
    },
};
// goon sigma 
//Andrei was here
//         -little man popcicle 2025