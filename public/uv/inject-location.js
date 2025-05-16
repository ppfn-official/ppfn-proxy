document.addEventListener('DOMContentLoaded', function () {
    // Create address bar
    let addressBar = document.createElement('input');
    addressBar.type = 'text';
    addressBar.id = 'uv-address-bar';
    addressBar.style.position = 'fixed';
    addressBar.style.top = '10px';
    addressBar.style.left = '60px';
    addressBar.style.width = '60vw';
    addressBar.style.zIndex = 9999;
    addressBar.style.background = '#fff';
    addressBar.style.color = '#000';
    addressBar.style.border = '1px solid #ccc';
    addressBar.style.padding = '4px 8px';
    document.body.appendChild(addressBar);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.innerText = '←';
    backBtn.style.position = 'fixed';
    backBtn.style.top = '10px';
    backBtn.style.left = '10px';
    backBtn.style.zIndex = 9999;
    backBtn.onclick = () => window.history.back();
    document.body.appendChild(backBtn);

    // Forward button
    const forwardBtn = document.createElement('button');
    forwardBtn.innerText = '→';
    forwardBtn.style.position = 'fixed';
    forwardBtn.style.top = '10px';
    forwardBtn.style.left = '35px';
    forwardBtn.style.zIndex = 9999;
    forwardBtn.onclick = () => window.history.forward();
    document.body.appendChild(forwardBtn);

    // Patch history methods to trigger events
    function patchHistoryMethod(type) {
        const orig = history[type];
        history[type] = function () {
            const rv = orig.apply(this, arguments);
            window.dispatchEvent(new Event(type.toLowerCase()));
            return rv;
        };
    }
    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');

    // Function to update address bar with original URL
    function updateAddressBar() {
        fetch(`/api/decode?url=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`)
            .then(res => res.json())
            .then(data => {
                if (data.decoded) {
                    addressBar.value = data.decoded;
                } else {
                    addressBar.value = window.location.href;
                }
            })
            .catch(() => {
                addressBar.value = window.location.href;
            });
    }

    // Update on navigation
    window.addEventListener('popstate', updateAddressBar);
    window.addEventListener('pushstate', updateAddressBar);
    window.addEventListener('replacestate', updateAddressBar);

    // Initial update
    updateAddressBar();
});