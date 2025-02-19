function initController() {
    initLink();
    initInput();

    enableOpenLinkInDefaultBrowser();

    $('body').on('click', '.list-item-text', (e) => {
        showAllEpisodes($(e.target).parent().get(0))
    });
    $('body').on('click', '.info-channel', (e) => {
        showAllEpisodes($(e.target).parent().parent().get(0))
    });
}

function enableOpenLinkInDefaultBrowser() {
    $('body').on('click', 'a', (event) => {
        event.preventDefault();
        require("electron").shell.openExternal(event.target.href);
    });
    
    $('body').on('auxclick', 'a', (event) => {
        event.preventDefault();
        require("electron").shell.openExternal(event.target.href);
    });
}

/*
 *  Link
 */

function initLink() {
    $('#menu-episodes').click(() => showPage('newEpisodes'))
    $('#menu-favorites').click(() => showPage('favorites'))
    $('#menu-refresh').click(readFeeds)
    $('#menu-settings').click(() => showPage('settings'))
    $('#menu-archive').click(() => showPage('archive'))
    $('#menu-statistics').click(() => showPage('statistics'))
}

/*
 *  Input
 */
/* 
function matchText(e) {
    var char = String.fromCharCode(e.which)
    if (char.match(/^[^A-Za-z0-9+!?#\.\-]+$/)) 
        e.preventDefault();
}

function matchTextSearch(e) {
    var char = String.fromCharCode(e.which)
    if (char.match(/^[^A-Za-z0-9+!?#\.\-\ ']+$/)) 
        e.preventDefault();
}
 */
function initInput() {
    /* $('input').not('#search-input').keypress(function (e) {
        matchText(e)
    })
    
    $('#search-input').keypress(function (e) {
        matchTextSearch(e)
    }) */

    $('#search-input').keyup(function (e) {
        if(this.value == '')
            $("#bar-search").removeClass("search-animation");
        else
            $("#bar-search").addClass("search-animation");   
        search(this, e);
    })
    .focusout(function (e) {
        setTimeout(() => {
            $("#bar-search").removeClass("search-animation");
        }, 500);
    })
    .focusin(function (e) {
        if(this.value != '')
            $("#bar-search").addClass("search-animation");
    })
    
}

function _(obj) {
    return {...$(obj).data()};
}