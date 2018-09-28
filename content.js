'use strict';

// From : https://stackoverflow.com/questions/3964710/replacing-selected-text-in-the-textarea
function getInputSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }

    return {
        start: start,
        end: end
    };
}

function replaceSelectedText(el, text) {
    var sel = getInputSelection(el), val = el.value;
    el.value = val.slice(0, sel.start) + text + val.slice(sel.end);
}

/**
 * Insert the text at the cursor into the active element. Note that we're
 * intentionally not appending or simply replacing the value of the editable
 * field, as we want to allow normal pasting conventions. If you paste at the
 * beginning, you shouldn't see all your text be replaced.
 * Taken from:
 * http://stackoverflow.com/questions/7404366/how-do-i-insert-some-text-where-the-cursor-is
 */
function insertTextAtCursor(text) {
    var el = document.activeElement;
    replaceSelectedText(el, text);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.data) {
        insertTextAtCursor(request.data);
    }
});

// You can add markdown to your cards in the card's description, checklists and comments, as well as in your Trello bio
// Detect elements that allow markdown and only show the context menu for those elements
document.addEventListener("mousedown", function(event){
	var selection = window.getSelection();
	if (selection.anchorNode != null) 
	{
		var classList = selection.anchorNode.classList;
		if (classList != null) 
		{
			if(classList.contains('comment-box') || classList.contains('edit')) {
				chrome.extension.sendMessage({cmd: "create_menu"});	
			} else {
				chrome.extension.sendMessage({cmd: "delete_menu"});
			}
		}
	}
}, true); 



