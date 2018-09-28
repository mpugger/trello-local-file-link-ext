'use strict';

// A gotcha of sorts with chrome extensions involving clipboard actions is that
// only the content scripts can interact with the page that a user loads. This
// means that we can't put our calls to actually paste into the page in the
// background file, because the background scripts are not able to paste into
// the dom of the page. However, only background pages are able to access the
// system clipboard. Therefore we have to do a little trickery to move between
// the two. We're going to define the functions here to actually read from the
// clipboard into a div, and then
// we'll get that pasted data from the background page and do the actual
// insertion in our content script. The idea of this comes from:
// https://stackoverflow.com/questions/6969403/cant-get-execcommandpaste-to-work-in-chrome
/**
 * Retrieve the current content of the system clipboard.
 */
function getContentFromClipboard() {
    var pasteTarget = document.createElement("div");
    pasteTarget.contentEditable = true;
    var actElem = document.activeElement.appendChild(pasteTarget).parentNode;
    pasteTarget.focus();
    document.execCommand("Paste", null, null);
    var paste = pasteTarget.innerText;
    actElem.removeChild(pasteTarget);
    return paste;
}

/**
 * Send the value that should be pasted to the content script.
 */
function sendPasteToContentScript(toBePasted) {
    // We first need to find the active tab and window and then send the data
    // along. This is based on:
    // https://developer.chrome.com/extensions/messaging
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {data: toBePasted});
    });
}

/**
 * The function that will handle our context menu clicks.
 */
function onClickHandler(info, tab) {
    var clipboardContent = getContentFromClipboard();
    if (info.menuItemId === 'pasteLocalFileLocationIntoTrello') 
	{
		// turn into file metadata
		// [c://<file name>](file://c:/file%20name)
		var link = "[" + clipboardContent.replace(/\\/g, "\\\\") + "](file://" + clipboardContent.replace(/ /g, "%20") + ")";
        sendPasteToContentScript(link);
    }
}

// Register the click handler for our context menu.
chrome.contextMenus.onClicked.addListener(onClickHandler);

// Set up the single one item "paste"
//chrome.runtime.onInstalled.addListener(function(details) {
    
//});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.cmd == "create_menu") {
        chrome.contextMenus.removeAll(function() {
            chrome.contextMenus.create(
	        {
	            'title': 'Paste Local File Link',
	            'id': 'pasteLocalFileLocationIntoTrello',
	            'contexts': ['editable'],
				'documentUrlPatterns' : ['https://trello.com/c/*']
	        });
        });
    } else if(request.cmd == "delete_menu") {
        chrome.contextMenus.removeAll();
    }
});