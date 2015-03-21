window.addEventListener('load', function() {
    chrome.storage.sync.get({
        checkInterval: 10
    }, function(items) {
        options.frequency.value = items.checkInterval;
    });
    options.frequency.onchange = function() {
        console.log(options.frequency.value);
        chrome.storage.sync.set({
            "checkInterval": options.frequency.value
        });
    };
});
