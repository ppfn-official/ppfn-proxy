// --- Theme Presets ---
const themePresets = [
    { name: "Default", color: "#4a477b" },
    { name: "Dark", color: "#555555" },
    { name: "Light", color: "#ffffff" },
    { name: "Blue", color: "#3498db" },
    { name: "Purple", color: "#8e44ad" },
    { name: "Green", color: "#27ae60" },
    { name: "Red", color: "#e74c3c" }
];

// Helper to get accent color from primary
function getAccentColor(primaryHex) {
    const [h, s, l] = hexToHSL(primaryHex);
    return `hsl(${h}, ${s}%, ${Math.min(l+20,95)}%)`;
}
// Render theme circles
function renderThemePresets() {
    const container = document.getElementById('theme-presets');
    container.innerHTML = '';
    themePresets.forEach(preset => {
        const accent = getAccentColor(preset.color);
        const circle = document.createElement('div');
        circle.title = preset.name;
        circle.style.cssText = `
            width: 46px; height: 46px; border-radius: 50%; cursor: pointer; border: 2px solid var(--border-color);
            background: linear-gradient(90deg, ${preset.color} 50%, ${accent} 50%);
            box-shadow: 0 0 0 2px transparent;
            transition: box-shadow 0.2s;
        `;
        circle.addEventListener('click', () => {
            setTheme(preset.color);
            document.getElementById('custom-theme-color').value = preset.color;
            // Save to localStorage
            localStorage.setItem('ppfn-theme-color', preset.color);
            // Highlight selected
            Array.from(container.children).forEach(c => c.style.boxShadow = "0 0 0 2px transparent");
            circle.style.boxShadow = "0 0 0 2px var(--text-color)";
            // Always update the custom preview to match the current theme
            const customPreview = document.getElementById('custom-theme-preview');
            if (customPreview) {
                const accent = getAccentColor(preset.color);
                customPreview.style.background = `linear-gradient(90deg, ${preset.color} 50%, ${accent} 50%)`;
            }
        });
        container.appendChild(circle);
        
    });
}

// Custom color picker
document.addEventListener('DOMContentLoaded', function() {
    renderThemePresets();
    const customColor = document.getElementById('custom-theme-color');
    const customPreview = document.getElementById('custom-theme-preview');
    function updateCustomPreview(hex) {
        const accent = getAccentColor(hex);
        customPreview.style.background = `linear-gradient(90deg, ${hex} 50%, ${accent} 50%)`;
    }

    // Restore theme from localStorage if present
    const savedColor = localStorage.getItem('ppfn-theme-color');
    if (savedColor) {
        setTheme(savedColor);
        customColor.value = savedColor;
        updateCustomPreview(savedColor);
        // Highlight the matching preset if found, else none
        const presetIdx = themePresets.findIndex(p => p.color.toLowerCase() === savedColor.toLowerCase());
        if (presetIdx !== -1) {
            setTimeout(() => {
                document.getElementById('theme-presets').children[presetIdx].style.boxShadow = "0 0 0 2px var(--text-color)";
            }, 0);
        } else {
            // Remove highlight from all
            Array.from(document.getElementById('theme-presets').children).forEach(c => c.style.boxShadow = "0 0 0 2px transparent");
        }
    } else {
        updateCustomPreview(customColor.value);
        setTimeout(() => {
            document.getElementById('theme-presets').children[0].style.boxShadow = "0 0 0 2px var(--text-color)";
        }, 0);
    }

    customPreview.addEventListener('click', function() {
        customColor.click();
    });
    customColor.addEventListener('input', function() {
        setTheme(this.value);
        updateCustomPreview(this.value);
        // Save to localStorage
        localStorage.setItem('ppfn-theme-color', this.value);
        // Remove highlight from preset circles
        Array.from(document.getElementById('theme-presets').children).forEach(c => c.style.boxShadow = "0 0 0 2px transparent");
    });
});
let transportMode = localStorage.getItem('ppfn-transport-mode') || "epoxy"; // Default to epoxy

// Only allow Epoxy (remove Bare button logic)
document.addEventListener('DOMContentLoaded', function() {
    window.baremuxConnection = null;

    const urlDiv = document.getElementById('url');
    const iframe = document.getElementById('site-frame');
    const backBtn = document.getElementById('back');
    const forwardBtn = document.getElementById('forward');
    const openNewBtn = document.getElementById('open_new');
    const reloadBtn = document.getElementById('reload');
    const homeBtn = document.getElementById('home');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Show spinner when navigating
    function showSpinner() {
        loadingSpinner.style.display = 'block';
    }
    function hideSpinner() {
        loadingSpinner.style.display = 'none';
    }
    // Save the original getter and setter
const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
Object.defineProperty(iframe, 'src', {
    get() {
        // Call the original getter
        return originalSrcDescriptor.get.call(this);
    },
    set(value) {
        showSpinner();
        // Call the original setter
        originalSrcDescriptor.set.call(this, value);
    },
    configurable: true,
    enumerable: true
});

    // Hide spinner when iframe DOM is loaded (via Ultraviolet's postMessage)
    window.addEventListener('message', (event) => {
        if (event.source !== iframe.contentWindow) return;
        if (event.data && event.data.type === 'uv-dom-ready') {
            hideSpinner();
        }
    });

    // Fallback: hide spinner on iframe load (in case postMessage missed)
    iframe.addEventListener('load', () => {
        setTimeout(hideSpinner, 500); // Give UV time to send dom-ready
    });

    // --- BEGIN: Periodically update URL bar from iframe ---
    let urlBarFocused = false;
    if (urlDiv) {
        urlDiv.addEventListener('focus', () => { urlBarFocused = true; });
        urlDiv.addEventListener('blur', () => { urlBarFocused = false; });
    }

    setInterval(() => {
        if (urlBarFocused) return;
        try {
            // Get iframe src
            let src = iframe.src;
            // Find the /uv/service/ part
            const prefix = __uv$config && __uv$config.prefix ? __uv$config.prefix : "/uv/service";
            const idx = src.indexOf(prefix);
            if (idx !== -1) {
                // Get the encoded part after /uv/service/
                let encoded = src.slice(idx + prefix.length);
                if (encoded) {
                    let decoded;
                    try {
                        decoded = window.__uv$config.decodeUrl(encoded);
                    } catch (e) {
                        decoded = '';
                    }
                    if (urlDiv.textContent !== decoded) {
                        urlDiv.textContent = decoded;
                    }
                }
            }
        } catch (e) {}
    }, 500);

    if (urlDiv) {
        urlDiv.addEventListener('mousedown', function(e) {
            if (document.activeElement !== urlDiv) {
                e.preventDefault();
                urlDiv.focus();
                const range = document.createRange();
                range.selectNodeContents(urlDiv);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }
    // --- END: Periodically update URL bar from iframe ---

    if (urlDiv) {
        urlDiv.addEventListener('input', function() {
            if (window.DOMPurify) {
                const clean = DOMPurify.sanitize(urlDiv.innerHTML, {ALLOWED_TAGS: [], ALLOWED_ATTR: []});
                if (urlDiv.innerHTML !== clean) {
                    urlDiv.innerHTML = clean;
                }
            }
        });

        urlDiv.addEventListener('keydown', async function(event) {
            if (event.key === "Enter" && urlDiv.textContent !== "") {
                event.preventDefault();
                urlDiv.blur();
                let url = urlDiv.textContent.trim();

                // Check for ppfn:// prefix
                if (url.startsWith("ppfn://")) {
                    const pageName = url.slice("ppfn://".length).trim();
                    if (pageName) {
                        const safePageName = pageName.replace(/[^a-zA-Z0-9_-]/g, "");
                        iframe.src = `/ppfn-pages/${safePageName}.html`;
                    }
                    return;
                }

                if (!url.includes(".")) {
                    url = "https://duckduckgo.com/?q=" + encodeURIComponent(url) + "&ia=web";
                } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = "https://" + url;
                }

                async function setupTransport() {
                    if (!window.baremuxConnection) {
                        window.baremuxConnection = new BareMux.BareMuxConnection("/baremux/worker.js");
                        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
                        try {
                            await window.baremuxConnection.setTransport("/baremux/index.mjs", [{ wisp: wispUrl }]);
                        } catch (bareErr) {
                            try {
                                await window.baremuxConnection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                            } catch (epoxyErr) {
                                alert("Both proxy transports failed. Please try again later.");
                                window.baremuxConnection = null;
                                return false;
                            }
                        }
                    }
                    return true;
                }

                const ok = await setupTransport();
                if (!ok) return;

                try {
                    const encodedUrl = __uv$config.encodeUrl(url);
                    iframe.src = __uv$config.prefix + encodedUrl;
                } catch (e) {}
            }
        });
    }


    const settingsBtn = document.getElementById('settings');
    const settingsPopup = document.getElementById('settings-popup');
    const closeSettings = document.getElementById('close-settings');
    const overlay = document.getElementById('settings-overlay');

    if (settingsBtn && settingsPopup && closeSettings && overlay) {
        settingsBtn.addEventListener('click', () => {
            settingsPopup.classList.remove('hidden');
        });
        closeSettings.addEventListener('click', () => {
            settingsPopup.classList.add('hidden');
        });
        overlay.addEventListener('click', () => {
            settingsPopup.classList.add('hidden');
        });
    }

    // Navigation buttons for iframe history
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.history.back();
        });
    }
    if (forwardBtn) {
        forwardBtn.addEventListener('click', function() {
            window.history.forward();
        });
    }
    if (homeBtn) {
        homeBtn.addEventListener('click', function() {
            urlDiv.textContent = "ppfn://home";
            iframe.src = `/ppfn-pages/home.html`;
        });
    }
    if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
            iframe.contentWindow.location.reload();
        });
    }
    if (openNewBtn) {
        openNewBtn.addEventListener('click', async function() {
            if (!urlDiv.textContent.trim().includes("ppfn://")) {
                const rawUrl = urlDiv.textContent.trim();
                let url = rawUrl;
                if (!url.includes(".")) {
                    url = "https://www.google.com/search?q=" + encodeURIComponent(url);
                } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    url = "https://" + url;
                }
                const proxiedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
                window.open(proxiedUrl, '_blank');
            }
        });
    }

    // Set home page if iframe is blank
    if (
        iframe.src === "about:blank" ||
        !iframe.src ||
        iframe.src === "data:text/html,about:blank"
    ) {
        urlDiv.textContent = "ppfn://home";
        iframe.src = `/ppfn-pages/home.html`;
        urlDiv.blur();
    }

});
function resetOverflowPosition(element) {
  element.scrollLeft = 0;
}
// Converts hex to HSL
function hexToHSL(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const num = parseInt(hex, 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100), r, g, b];
}

// Returns "#fff" or "#000" depending on which is more readable on the given rgb
function getContrastYIQ(r, g, b) {
    // YIQ equation from https://24ways.org/2010/calculating-color-contrast/
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 175) ? "#000" : "#fff";
}

function setTheme(primaryHex) {
    const [h, s, l, r, g, b] = hexToHSL(primaryHex);

    // Pick best text color for contrast
    const textColor = getContrastYIQ(r*255, g*255, b*255);

    const root = document.documentElement;
    root.style.setProperty('--primary-bg', `hsl(${h}, ${s}%, ${Math.max(l-10,10)}%)`);
    root.style.setProperty('--nav-bg', `hsl(${h}, ${s}%, ${Math.max(l-20,5)}%)`);
    root.style.setProperty('--accent-bg', `hsl(${h}, ${s}%, ${Math.min(l+20,95)}%)`);
    root.style.setProperty('--text-color', textColor);
    root.style.setProperty('--spinner-bg', `hsla(${h}, ${s}%, ${l}%, 0.7)`);
    root.style.setProperty('--hover-bg', `hsl(${h}, ${s}%, ${Math.max(l-5,0)}%)`);
    root.style.setProperty('--settings-panel-bg', `hsl(${h}, ${s}%, ${Math.max(l-20,5)}%)`);
    root.style.setProperty('--settings-overlay-bg', `hsla(${h}, 10%, 10%, 0.5)`);
    root.style.setProperty('--border-color', `hsl(${h}, ${s}%, ${Math.max(l-30,0)}%)`);
}

// Example usage: setTheme('#3498db');
setTheme('#4a477b'); // Change this hex to your desired primary color

// After setTheme is defined, add this function:
function notifyHomeThemeUpdate() {
    const iframe = document.getElementById('site-frame');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'ppfn-theme-update' }, '*');
    }
}

// Patch setTheme to notify home page
const _originalSetTheme = setTheme;
setTheme = function(primaryHex) {
    _originalSetTheme(primaryHex);
    notifyHomeThemeUpdate();
};
// --- Tab Cloaking ---
function ppfnTabCloak(title, favicon) {
    if (title) document.title = title;
    if (favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = favicon;
    }
}
function ppfnResetTabCloak() {
    document.title = "PPFN-Unblocker";
    let link = document.querySelector("link[rel~='icon']");
    if (link) link.href = "https://raw.githubusercontent.com/ppfn-official/ppfn/refs/heads/MAIN/ppfn.png";
}

// --- About:Blank Cloak ---
function ppfnAboutBlankCloak() {
    const win = window.open("about:blank", "_blank");
    if (win) {
        win.document.body.style.margin = "0";
        win.document.body.style.padding = "0";
        win.document.body.style.background = "black";
        const iframe = win.document.createElement('iframe');
        iframe.src = window.location.href;
        iframe.style.width = "100vw";
        iframe.style.height = "100vh";
        iframe.style.border = "none";
        win.document.body.appendChild(iframe);
    } else {
        alert("Popup blocked! Please allow popups for this site.");
    }
}

// --- Advanced About:Blank Cloak (historyless) ---
let advBlankWin = null;
function ppfnEnableAdvBlank() {
    if (!advBlankWin || advBlankWin.closed) {
        advBlankWin = window.open("about:blank", "_blank", "noopener,noreferrer");
        if (advBlankWin) {
            advBlankWin.document.body.style.margin = "0";
            advBlankWin.document.body.style.padding = "0";
            advBlankWin.document.body.style.background = "black";
            const iframe = advBlankWin.document.createElement('iframe');
            iframe.src = window.location.href;
            iframe.style.width = "100vw";
            iframe.style.height = "100vh";
            iframe.style.border = "none";
            advBlankWin.document.body.appendChild(iframe);
        }
    }
}
function ppfnDisableAdvBlank() {
    if (advBlankWin && !advBlankWin.closed) {
        advBlankWin.close();
    }
}

// --- Clickoff Cloaking ---
let clickoffEnabled = false;
function ppfnEnableClickoff() {
    if (clickoffEnabled) return;
    clickoffEnabled = true;
    window.addEventListener('blur', ppfnClickoffHandler);
}
function ppfnDisableClickoff() {
    clickoffEnabled = false;
    window.removeEventListener('blur', ppfnClickoffHandler);
    ppfnResetTabCloak();
}
function ppfnClickoffHandler() {
    if (clickoffEnabled) {
        ppfnTabCloak("Google Docs", "/assets/img/docs.png");
    }
}

// --- Leave Confirmation ---
let leaveConfirmEnabled = false;
function ppfnToggleLeaveConfirm() {
    leaveConfirmEnabled = !leaveConfirmEnabled;
    const btn = document.getElementById('leave-confirm-btn');
    if (leaveConfirmEnabled) {
        window.addEventListener('beforeunload', ppfnLeaveConfirmHandler);
        if (btn) btn.classList.add('active');
    } else {
        window.removeEventListener('beforeunload', ppfnLeaveConfirmHandler);
        if (btn) btn.classList.remove('active');
    }
}
function ppfnLeaveConfirmHandler(e) {
    e.preventDefault();
    e.returnValue = '';
    return '';
}

// --- Panic Key ---
let panicKey = null;
function ppfnSetPanicKey() {
    const combo = prompt("Enter a key combo (e.g. Ctrl+Shift+P):");
    if (!combo) return;
    panicKey = combo.toLowerCase();
    window.addEventListener('keydown', ppfnPanicKeyHandler);
    alert("Panic key set to: " + combo);
}
function ppfnRemovePanicKey() {
    panicKey = null;
    window.removeEventListener('keydown', ppfnPanicKeyHandler);
    alert("Panic key removed.");
}
function ppfnPanicKeyHandler(e) {
    if (!panicKey) return;
    const keys = panicKey.split('+').map(k => k.trim());
    const match = keys.every(k =>
        (k === "ctrl" && e.ctrlKey) ||
        (k === "shift" && e.shiftKey) ||
        (k === "alt" && e.altKey) ||
        (k.length === 1 && e.key.toLowerCase() === k)
    );
    if (match) {
        window.location.href = "https://www.google.com";
    }
}
window.addEventListener('message', function(event) {
    const iframe = document.getElementById('site-frame');
    if (!iframe || event.source !== iframe.contentWindow) return;
    if (event.data && event.data.type === 'uv-location' && typeof event.data.href === 'string') {
        const newUrl = event.data.href;
        // Only update if different
        if (document.getElementById('url').textContent !== newUrl) {
            document.getElementById('url').textContent = newUrl;
        }
        // Always re-encode and set iframe.src so the query is inside the encoded string
        const encodedUrl = __uv$config.encodeUrl(newUrl);
        const newSrc = __uv$config.prefix + encodedUrl;
        if (iframe.src !== newSrc) {
            iframe.src = newSrc;
        }
    }
});
// Add event listener for expanding url bar if too small
document.addEventListener('DOMContentLoaded', function() {
    const urlDiv = document.getElementById('url');
    if (!urlDiv) return;
    urlDiv.addEventListener('focus', function() {
        if (urlDiv.offsetWidth < 150) {
            const navBtns = Array.from(document.querySelectorAll('.navb, #ppfn-txt, #unblocker-txt'));
            navBtns.forEach(btn => btn.style.display = 'none');
            urlDiv.style.flex = "1 1 100%";
            urlDiv.style.width = "100vw";
            urlDiv.style.marginLeft = "20px";
            urlDiv.style.marginRight = "20px";
            urlDiv.classList.add('expanded-urlbar');

            function restoreNavBtns() {
                navBtns.forEach(btn => btn.style.display = '');
                urlDiv.style.flex = "";
                urlDiv.style.width = "";
                urlDiv.style.marginLeft = "";
                urlDiv.style.marginRight = "";
                urlDiv.classList.remove('expanded-urlbar');
                urlDiv.removeEventListener('blur', restoreNavBtns);
            }
            urlDiv.addEventListener('blur', restoreNavBtns);
        }
    });
});