window.addEventListener('load', function() {
  var frequency = $('#options select[name="frequency"]');

  // restore options
  chrome.storage.sync.get({ checkInterval: 0 }, function(items) {
    frequency.val(items.checkInterval);
  });

  // on change event
  frequency.change(function() {
    chrome.storage.sync.set({ checkInterval: frequency.val() });
    chrome.runtime.sendMessage({ name: 'frequencyChanged' });
  });
});
