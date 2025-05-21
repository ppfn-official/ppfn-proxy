// This file overwrites the stock UV config.js

self.__uv$config = {
    prefix: "/uv/service/",
    // Custom encode/decode functions using encodeURIComponent/decodeURIComponent and base64
    encodeUrl: function(url) {
        // First encode URI components, then base64 encode for obfuscation
        return btoa(encodeURIComponent(url));
    },
    decodeUrl: function(encoded) {

            return decodeURIComponent(atob(encoded));
    },
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
};
// goon sigma 
//Andrei was here
//         -little man pocicle 2025