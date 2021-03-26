(function () {
    function run() {
        var g = function (id) {
                return document.getElementById(id);
            }, ttl = g('mmt'), btn = g('mmb'), menu = g('mm'), overlay = g('mm-overlay'), body = document.getElementsByTagName('body')[0], on = false, height;
        if (!btn || !menu || !body) {
            return;
        }
        function toggleClasses() {
            var className = on ? 'on' : 'off';
            btn.className = className;
            menu.className = className;
            overlay.className = className;
        }
        function toggleMenu() {
            on = !on;
            toggleClasses();
            if (on) {
                height = Math.max(window.innerHeight || document.documentElement.clientHeight, body.offsetHeight, menu.offsetHeight);
                menu.style.height = height + 'px';
                overlay.style.height = height - 49 + 'px';
            }
        }
        ttl.onclick = toggleMenu;
        btn.onclick = toggleMenu;
        overlay.onclick = toggleMenu;
        menu.onclick = function (e) {
            var target, parent;
            target = e ? e.target : window.event.srcElement;
            target = target.nodeType === 3 ? target.parentNode : target;
            if (target.tagName === 'DIV' && target.id !== 'mm') {
                parent = target.parentNode;
                parent.className = parent.className ? '' : 'expanded';
                return;
            }
            on = false;
            toggleClasses();
        };
    }
    var readyTimer = setInterval(function () {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            run();
            clearInterval(readyTimer);
        }
    }, 10);
}());
(function ($) {
    function isMobile() {
        var innerWidth = window.innerWidth;
        var clientWidth = document.documentElement.clientWidth;
        var width = innerWidth && clientWidth ? Math.min(innerWidth, clientWidth) : innerWidth || clientWidth;
        return width <= 650;
    }
    function isCopied(id, idsMap) {
        return Object.keys(idsMap).some(function (pId) {
            return pId.split('_copy').length > 1;
        });
    }
    function getParentId(elt) {
        return $(elt.parentNode).attr('data-id');
    }
    function fixImgAspectRatio(data) {
        var cmps = $('.image-container .col'), styles = '';
        cmps.each(function (index, elt) {
            var image = $(elt).parents('.image-container')[0], actualHeight = parseFloat($(image).attr('data-height')), actualWidth = parseFloat($(image).attr('data-width')), $imageParentNode = $(image.parentNode), parentId = getParentId(image);
            if ($imageParentNode.attr('data-kind') === 'Component') {
                var newImageWidth = $(image).outerWidth();
                var newImageHeight = newImageWidth * (actualHeight / actualWidth);
                styles += 'div[data-id="' + parentId + '"] .imgFixRatio {' + 'height: ' + actualHeight + 'px !important;' + 'width: ' + actualWidth + 'px !important;' + 'min-height: ' + Math.min(actualHeight, newImageHeight) + 'px !important;' + 'max-height: ' + newImageHeight + 'px;}';
            } else if (!$imageParentNode.hasClass('stretched') && $imageParentNode.attr('data-kind').toLowerCase() === 'block' && !data[parentId]) {
                var isTopLevelImage = $imageParentNode.hasClass('mobileTopLevelComponents');
                var imageWidth = $(image).outerWidth();
                var maxHeight = imageWidth * (actualHeight / actualWidth);
                styles += 'div[data-id="' + parentId + '"] .imgFixRatio {' + 'height: ' + actualHeight + 'px !important;' + 'width: ' + actualWidth + 'px !important;' + 'min-height: ' + Math.min(actualHeight, maxHeight) + 'px !important;' + 'max-height: ' + maxHeight + 'px;}';
                styles += 'div[data-id="' + parentId + '"] {' + 'display: flex;' + 'justify-content: center;}';
                if (isTopLevelImage) {
                    styles += 'div[data-id="' + parentId + '"] {' + 'padding-left: 18px;' + 'padding-right: 18px;}';
                }
            } else {
                var minHeight = $(image).outerWidth() * (actualHeight / actualWidth);
                styles += 'div[data-id="' + getParentId(image) + '"] .imgFixRatio { min-height: ' + minHeight + 'px !important;}';
            }
            $(image).addClass('imgFixRatio');
        });
        return styles;
    }
    function fixVideoHeight() {
        var videoCmps = $('iframe[data-kind="VIDEO"]'), styles = '';
        videoCmps.each(function (index, elt) {
            var height = $(elt).outerWidth() * (parseFloat(elt.height) / parseFloat(elt.width));
            styles += 'div[data-id="' + getParentId(elt) + '"] .videoFixRatio { height: ' + height + 'px;} ';
            $(elt).addClass('videoFixRatio');
        });
        return styles;
    }
    function fixCmpsHeightForMobile(data) {
        var styles = fixImgAspectRatio(data);
        styles += fixVideoHeight();
        $('<style data-dynamicStyle type="text/css">' + styles + '</style>').appendTo('head');
    }
    function updateCopiedBlockElts(blocks, blockEltsMap, requiredIds, data) {
        Object.keys(requiredIds).forEach(function (id) {
            var idParts = id.split('_');
            if (idParts.length > 1) {
                if (blockEltsMap[idParts[0]]) {
                    blockEltsMap[id] = $(blockEltsMap[idParts[0]][0].cloneNode(true));
                } else {
                    for (var i = 0; i < blocks.length; i++) {
                        var cmpId = blocks[i].getAttribute('data-id');
                        if (cmpId === idParts[0]) {
                            blockEltsMap[id] = $(blocks[i].cloneNode(true));
                            break;
                        }
                    }
                }
            }
        });
    }
    function getCurrentWindowWidth() {
        return $(window).width();
    }
    function triggerChangeToMobileView() {
        $(window).trigger('changed-to-mobile-view');
    }
    function run() {
        var mobileEditorChanges = JSON.parse($(document.body).attr('data-mobile-editor')), root = mobileEditorChanges.root, data = mobileEditorChanges.data, groups = mobileEditorChanges.groups, wrappedCmpsMap = mobileEditorChanges.wrappedCmpsMap, styles = mobileEditorChanges.styles, templateElt = $('.template'), isMobileView = $(templateElt).data('mobile-view'), isMobileWidth = isMobile();
        function move() {
            if (!templateElt.length) {
                return;
            }
            if (!isMobileView || !isMobileWidth) {
                return;
            }
            var blocks = $('div[data-id][data-kind$=\'Block\']'), components = $('div[data-id][data-kind$=\'Component\']'), componentEltsMap = {}, blockEltsMap = {}, groupsEltsMap = {}, groupsItemsEltsMap = {}, i, cmpId, col, extractElts = function (elts, extractTo, requiredIds, getAll) {
                    for (i = 0; i < elts.length; i++) {
                        cmpId = elts[i].getAttribute('data-id');
                        if (requiredIds && requiredIds[cmpId] || getAll) {
                            extractTo[cmpId] = $(elts[i]).detach();
                        }
                    }
                };
            $(document.body).addClass('mobileMenu');
            var requiredIds = {};
            Object.keys(data).forEach(function (parentId) {
                requiredIds[parentId] = true;
                data[parentId].forEach(function (childId) {
                    requiredIds[childId] = true;
                    if (groups[childId]) {
                        groups[childId].forEach(function (itemId) {
                            requiredIds[itemId] = true;
                        });
                    }
                });
            });
            Object.keys(wrappedCmpsMap).forEach(function (textId) {
                var wrappedCmpsElts = $('div[data-id="' + textId + '"] .mceNonEditable div[data-specific-kind]');
                for (var j = 0; j < wrappedCmpsElts.length; j++) {
                    var elt = $(wrappedCmpsElts[j]);
                    if (!elt.hasClass('mobileDown')) {
                        requiredIds[elt.attr('data-id')] = false;
                    }
                }
                wrappedCmpsMap[textId].forEach(function (wId) {
                    if (requiredIds[wId]) {
                        if (isCopied(wId, requiredIds)) {
                            requiredIds[wId] = false;
                        } else {
                            requiredIds[wId] = true;
                        }
                    }
                });
            });
            extractElts(components, componentEltsMap, requiredIds);
            extractElts(blocks, blockEltsMap, requiredIds);
            Object.keys(groups).forEach(function (groupId) {
                var reqGroupItemIds = groups[groupId].reduce(function (acc, item) {
                    acc[item] = true;
                    return acc;
                }, {});
                extractElts(components, groupsItemsEltsMap, reqGroupItemIds);
                groupsEltsMap[groupId] = $('<div></div>').addClass('mobileGroup');
                groups[groupId].forEach(function (itemId) {
                    groupsEltsMap[groupId].append(groupsItemsEltsMap[itemId]);
                });
            });
            updateCopiedBlockElts(blocks, blockEltsMap, requiredIds, data);
            var process = function (parentId, parentElt, isRoot) {
                var cmpSequence = data[parentId], newParent = parentElt;
                if (cmpSequence) {
                    if (!isRoot) {
                        var parent = parentElt || blockEltsMap[parentId];
                        if (parent && $(parent).attr('data-specific-kind') !== 'TEXT') {
                            col = parent.find('.col')[0];
                            if (col) {
                                $(col).addClass('mobile-moved-hidden').css('display', 'none');
                                newParent = $(col.parentNode);
                            }
                        }
                    }
                    if (cmpSequence.length) {
                        var extraContainer = $('<div></div>').addClass('extraContainer');
                        extraContainer.css('overflow', 'auto');
                        newParent.append(extraContainer);
                        newParent = extraContainer;
                        cmpSequence.forEach(function (cmpId) {
                            var child = blockEltsMap[cmpId] || componentEltsMap[cmpId] || groupsEltsMap[cmpId];
                            if (child) {
                                child.addClass('mobile-moved' + (isRoot ? ' mobileTopLevelComponents' : ''));
                                if ($(child).find('.stretched').length) {
                                    child.addClass('stretched');
                                }
                                var extra = $('<div></div>').addClass('extra');
                                if (styles[cmpId]) {
                                    extra.css(styles[cmpId]);
                                }
                                var newEl = newParent[0].appendChild(extra[0]);
                                newEl.appendChild(child[0]);
                                process(cmpId, $(child[0]));
                            }
                        });
                    }
                }
            };
            process(root, $(templateElt), true);
            fixCmpsHeightForMobile(data);
            $(templateElt).addClass('mobileV mobileViewLoaded');
            triggerChangeToMobileView();
        }
        try {
            move();
        } finally {
            $(templateElt).css('visibility', 'visible');
            $(document.body).css('overflow-x', 'auto');
        }
        var windowWidth = getCurrentWindowWidth();
        $(window).resize(function () {
            if (isMobileView && isMobileWidth) {
                var newWindowWidth = getCurrentWindowWidth();
                if (windowWidth !== newWindowWidth) {
                    windowWidth = newWindowWidth;
                    fixCmpsHeightForMobile(data);
                    triggerChangeToMobileView();
                }
            }
        });
    }
    run();
    window.runMobileSort = run;
}(oneJQuery));