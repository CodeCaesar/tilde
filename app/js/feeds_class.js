var allFeeds = null;

class FeedsUI extends ListUI {

/*
 * HEADER
 */

    getHeader() {
        return $('.settings-feed');
    }

    getHeaderImage() {
        return $('.settings-feed .settings-feed-image');
    }

    getHeaderTitle() {
        return $('.settings-feed .settings-feed-header .title-header');
    }

    getHeaderArtist() {
        return $('.settings-feed .settings-feed-header .artist-header');
    }

    getHeaderCount() {
        return $('.settings-feed .settings-feed-header .settings-feed-count');
    }

    getHeaderDescription() {
        return $('.settings-feed .settings-feed-header .description-header');
    }

    setHeaderArtistContent(artistName) {
        let $headerArtist = allFeeds.ui.getHeaderArtist().get(0);
        if($headerArtist && $headerArtist.innerHTML.trim() != artistName)
            $headerArtist.innerHTML = artistName;
    }

    setHeaderDescriptionContent(description) {
        let $headerDescription = allFeeds.ui.getHeaderDescription().get(0);
        if($headerDescription && $headerDescription.innerHTML.trim() != description)
            $headerDescription.innerHTML = description;
    }

    setHeaderCountValue(n) {
        this.getHeaderCount().get(0).innerHTML = n;
    }

    showHeader(podcast) {
        if(!(podcast instanceof Object))
            podcast = allFavoritePodcasts.getByFeedUrl(feedUrl);

        this.appendHeaderSection(podcast);

        let Artwork = podcast.data.artworkUrl;

        // NOTE: set settings information
        this.getHeaderImage().get(0).src = Artwork;
        this.getHeaderTitle().get(0).innerHTML = (podcast ? podcast.data.collectionName : 'null');
        this.getHeaderArtist().get(0).innerHTML = (podcast ? podcast.data.artistName : 'null');
        this.getHeaderCount().get(0).innerHTML = (podcast ? '0' : '-1'); 
        this.getHeaderDescription().get(0).innerHTML = getInfoFromDescription(podcast ? podcast.data.description : '');
    }

    appendHeaderSection(podcast) {
        if(this.getHeader().get(0) == undefined) {
            let feedUrl = podcast.feedUrl

            var RightContent = document.getElementById("list")

            var SettingsDiv = document.createElement("div")
            SettingsDiv.classList.add("settings-feed")

            var PodcastImage = document.createElement("img")
            PodcastImage.classList.add("settings-feed-image")
            $(PodcastImage).on("error", function() {
                $(this).attr('src', './img/podcast_07prct.svg');
            });

            var $settingsHeader = $(
                `<div class="settings-feed-header">
                    <span class="title-header"></span><br>
                    <span class="artist-header" style="height: 0;"></span>
                    <span class="count-header">
                        <span class="settings-feed-count">-</span>
                        ${i18n.__('Episodes').toLowerCase()}
                    </span><br>
                    <span class="description-header" style="height:24px"></span>
                    <span class="description-other">
                        ${i18n.__('Other')}
                    </span>
                </div>`
            );

            $settingsHeader.find('.description-other').click(function() {
                let $descriptionHeader = $settingsHeader.find('.description-header');
                let initialHeightDH = $descriptionHeader.css('height');
                let finalHeightDH = null;

                let $artistHeader = $settingsHeader.find('.artist-header');
                let initialHeightAH = $artistHeader.css('height');
                let finalHeightAH = null;

                if($(this).html().trim() == i18n.__('Other')) {
                    $descriptionHeader.css('height', 'auto');
                    finalHeightDH = $descriptionHeader.css('height');
                    $descriptionHeader.css('height', initialHeightDH);
                    $(this).html(i18n.__('Reduce'));

                    $artistHeader.css('height', 'auto');
                    finalHeightAH = $artistHeader.css('height');
                    $artistHeader.css('height', initialHeightAH);
                } else { 
                    finalHeightDH = '24px';

                    finalHeightAH = '0';
                    $(this).html(i18n.__('Other'));
                }

                $descriptionHeader
                    .stop()
                    .animate(
                        {height: finalHeightDH},
                        300,
                        () => {
                            if(!($(this).html() == i18n.__('Other'))) 
                                $descriptionHeader.attr('style', '');
                        }
                    );

                $artistHeader
                    .stop()
                    .animate(
                        {height: finalHeightAH},
                        300,
                        () => {
                            if(!($(this).html() == i18n.__('Other'))) 
                                $artistHeader.attr('style', '');
                        }
                    );
            });

            var Buttons = document.createElement("div")
            Buttons.classList.add("settings-feed-buttons")

            var MoreElement = document.createElement("div")
            MoreElement.innerHTML = s_BackIcon;

            var FavoriteButton = document.createElement("div")
            
            var HeartButton = null;
            if (isAlreadyFavorite(podcast.feedUrl))
                HeartButton = getFullHeartButton(podcast);
            else
                HeartButton = getHeartButton(podcast);
            
            FavoriteButton.append(HeartButton);

            Buttons.append(MoreElement)
            Buttons.append(FavoriteButton)

            $(MoreElement).click(function () {
                let page = $('#content-right-header').find('h1').html();
                page = $(page).html();
                
                switch(page) {
                    case i18n.__('New Episodes'):
                        showNewEpisodesPage();
                        break;
                    case i18n.__('Archive'):
                        showArchivePage();
                        break;
                    case i18n.__('Favorites'):
                        showFavoritesPage();
                        break;
                    case i18n.__('Search'):
                        let results = $('#content-right-header span').data().results;
                        if(results)
                            showSearchList(results);
                        else
                            showNewEpisodesPage();
                        break;
                    default:
                        showNewEpisodesPage();
                }
            })

            SettingsDiv.append(PodcastImage)
            SettingsDiv.append($settingsHeader.get(0))
            SettingsDiv.append(Buttons)

            if(podcast)
                $(SettingsDiv).attr({
                    collectionName: podcast.data.collectionName,
                    feedUrl: podcast.feedUrl
                });

            RightContent.append(SettingsDiv)
        }
    }

    getData() { 
        return _(this.getHeader()).feed;
    }

    setData(data) {
        if(this.checkPageByFeedUrl(data[0].feedUrl))
            this.getHeader().data({feed: data});
    }

/*
 * PAGE
 */

    getInfoFeedView() {
        let $header = this.getHeader();
        if(!$header.get(0))
            return undefined;
        return {
            collectionName: $header.attr('collectionname'),
            feedUrl: $header.attr('feedurl')
        }
    }

    getFeedUrlByHeader() {
        let infoFeed = this.getInfoFeedView();
        if(infoFeed)
            return infoFeed.feedUrl;
        else
            return undefined;
    }

    getCollectionNameByHeader() {
        let infoFeed = this.getInfoFeedView();
        if(infoFeed)
            return infoFeed.collectionName;
        else
            return undefined;
    }

    getArtworkSrcFromView() {
        let $image = this.getHeaderImage().get(0);
        return ($image ? $image.src : '');
    }

    checkPageByFeedUrl(feedUrl) {
        let infoFeed = this.getInfoFeedView();
        return (infoFeed && infoFeed.feedUrl == feedUrl); 
    }   

/*
 * LIST
 */

    showNothingToShow(feedUrl) {
        /*
         *  ToDo
         */
        if(this.checkPageByFeedUrl(feedUrl)) 
            super.showNothingToShow(s_FeedNothingFoundIcon, 'feed-nothing-to-show');
    }

    add(episode, i) {
        this.updateItemCount(episode.feedUrl);
        if(this.checkPageByFeedUrl(episode.feedUrl)) {
            if(i == undefined)
                i = this.dataObject.findEpisodeByEpisodeUrl(episode.feedUrl, episode.episodeUrl);
            this.getData().splice(i, 0, episode)
            
            super.add(episode, i);
        }
    }

    remove(episode) {
        this.updateItemCount(episode.feedUrl);
        if(this.checkPageByFeedUrl(episode.feedUrl)) {
            this.setData(this.getData().splice(this.getData().indexOf(episode), 1));
            super.removeByEpisodeUrl(episode.episodeUrl, this.dataObject[episode.feedUrl]);
        }
    }

    updateItemCount(FeedUrl) {
        let $count = this.getHeaderCount().get(0);
        if($count && this.getFeedUrlByHeader() == FeedUrl)
            $count.innerHTML = allFeeds.getFeedPodcast(FeedUrl).length;
    }

    convertItemIntoInfoItemList(obj) {
        let episode = _(obj);

        let $obj = $(obj);
        $obj.attr('info-mode', '');
        let $descriptionItem = $obj.find('.list-item-description');
        $obj.off('click');
        
        $obj.find('div').not(".list-item-description").css('display', 'none');
        $obj.css('grid-template-columns', '1fr 5em 5em');
        $descriptionItem.before(
            `<span id="info-item-list" style="opacity: 0;">
                <br>
                <span class="info-title">
                    ${episode.episodeTitle}
                </span>
                <br>
                <span class="info-duration">
                    ${$obj.find('.list-item-sub-text').get(1).innerHTML}
                </span>
                <br>
                <span class="info-description">
                    ${getInfoFromDescription(episode.episodeDescription)}
                </span>
                <br>
                <span class="info-pubdate">
                    ${$obj.find('.list-item-sub-text').get(0).innerHTML}
                </span>
                <span class="info-download">
                    ${allArchiveEpisodes.ui.getDownloadStateButton(episode.episodeUrl)}
                </span>
                <br>
                <br>
            </span>`
        );
        
        $obj.find('#info-item-list')
            .stop()
            .animate({opacity: 1.0}, 500)
        
        $descriptionItem.html(s_ArrowUpIcon);
        
        let initialHeight = $obj.css('height');
        $obj.css('height', 'auto');
        let autoHeight = $obj.css('height');
        $obj.css('height', initialHeight);
        
        $obj
            .stop()
            .animate(
                {height: autoHeight},
                300, 
                function () {
                    $obj.css('height', 'auto');
                });
    }

    convertInfoItemIntoItemList($obj) {
        if($obj.get(0)) {
            let height = $obj.get(0).offsetHeight;
            $obj.removeAttr('info-mode');

            $obj.click(function(e) {
                if($(e.target).is('svg') || $(e.target).is('path') || $(e.target).hasClass('list-item-icon') || $(e.target).hasClass('list-item-text')) {
                    e.preventDefault();
                    return;
                }
                playerManager.startsPlaying(_(this));
            });

            $obj.find('div')
                .not('.list-item-flag')
                .removeAttr('style');

            $obj.css('grid-template-columns', '3fr 1fr 1fr 6em 5em 5em');
            
            $obj
                .css('background-color', '')
                .css('height', height)
                .stop()
                .animate(
                    {height: '3.2em'}, //2.86em
                    300,
                    function () {
                        $obj.css('height', '');
                    }); 

            $obj.find('#info-item-list').remove();
            
            $obj.find('.list-item-description')
                .html(s_InfoIcon);
                
            $obj.find('.list-item-flag').css('display', '');
        }
    }

    getNewItemList(episode) {
        let $listElement = $(buildListItem(
            [
                getBoldTextPart(episode.episodeTitle),
                getSubTextPart(new Date(episode.pubDate).toLocaleString()),
                getSubTextPart(getDurationFromDurationKey(episode)),
                getProgressionFlagPart(episode.episodeUrl),
                getDescriptionPart(),
                getAddToArchiveButtonPart(episode.episodeUrl)
            ],
            "3fr 1fr 1fr 6em 5em 5em"
        ));

        $listElement.click(function(e) { 
            if($(e.target).is('svg') || $(e.target).is('path') || $(e.target).hasClass('list-item-icon') || $(e.target).hasClass('list-item-text')) {
                e.preventDefault();
                return;
            }
            playerManager.startsPlaying(_(this));
        });

        $listElement.data(episode);
        $listElement.attr('url', episode.episodeUrl);

        if(allArchiveEpisodes.downloadManager.isDownloadInProgress(episode.episodeUrl))
            $listElement
                .css('--progress', `${allArchiveEpisodes.downloadManager.data[episode.episodeUrl].progress || 0}%`)
                .addClass("download-in-progress");

        switch(allArchiveEpisodes.getStateDownload(episode.episodeUrl)) {
            case 'in_progress':
                $listElement.addClass("download-in-progress");
                break;
            case 'error':
                $listElement.addClass("download-error");
                break;
            default:
                break;
        }

        if(playerManager.isPlaying(episode.episodeUrl))
            $listElement.addClass("select-episode");

        $listElement.find('.list-item-description').click(() => {
            if($listElement.is('[info-mode]'))
                this.convertInfoItemIntoItemList($listElement);
            else {
                this.convertInfoItemIntoItemList(this.getAllItemsList().filter('[info-mode]'));
                this.convertItemIntoInfoItemList($listElement);
            }
        })
        
        return $listElement;
    }

    showLastNFeedElements(feed) {
        if(!feed || 
            feed.length == 0 || 
            !this.checkPageByFeedUrl(feed[0].feedUrl) || 
            this.getAllItemsList().get(0) ||
            this.getShowMoreEpisodesBottomElement().get(0) ||
            this.getShowMoreEpisodesTopElement().get(0))
            return;
        
        clearMenuSelection();
        this.setHeaderCountValue(feed.length);
        
        this.setData(feed);
        this.showList(feed);
    }

    showOther10Elements(feed) {
        let i = this.lastEpisodeDisplayed + 1;
        let delay = 0;
        while(i < feed.length && i < this.lastEpisodeDisplayed + 11) {
            let episode = feed[i];
            this.getNewItemList(episode)
                .delay(140 * delay++)
                .hide()
                .css('opacity', 0.0)
                .insertBefore(this.getShowMoreEpisodesBottomElement())
                .slideDown(100,function () {
                    $(this).animate({opacity: 1.0});
                });

            i++;
        }
        this.lastEpisodeDisplayed = i - 1;
    }

    showsPrevious10Elements(feed) {
        let i = this.firstEpisodeDisplayed - 1;
        let delay = 0;
        while(i >= 0 && i >= this.firstEpisodeDisplayed - 10) {
            let episode = feed[i];
            this.getNewItemList(episode)
                .delay(140 * delay++)
                .hide()
                .css('opacity', 0.0)
                .insertBefore(this.getFirstItemList())
                .slideDown(100, function () {
                    $(this).animate({opacity: 1.0}, 200);
                });
            
            i--;
        }
        this.firstEpisodeDisplayed = i + 1;
    }

    appendShowMoreEpisodesButton() {
        this.getList()
            .append(this.getShowMoreEpisodesBottomHtml())

        function clickFunction(obj) {
            let $button = obj.getList().find('.more-episodes-bottom').find('.show-more-episodes-button');
            $button.off('click');
            
            let feed = obj.getData();

            obj.showOther10Elements(feed);
            obj.removeExtraPreviousElements();
            console.log("_ ", obj.firstEpisodeDisplayed, obj.lastEpisodeDisplayed)

            if(obj.lastEpisodeIsDisplayed(feed)) {
                let $showMoreEpisodesRowBottom = obj.getShowMoreEpisodesBottomElement();

                $showMoreEpisodesRowBottom
                    .css('opacity', 0.7)
                    .animate({opacity: 0.0}, 150)
                    .slideUp(150, () => { 
                        $showMoreEpisodesRowBottom.hide(); 
                        $showMoreEpisodesRowBottom.css('opacity', ''); 
                        
                        $button.click(() => {
                            clickFunction(obj);
                        });
                    });
            } else {
                $button.click(() => {
                    clickFunction(obj);
                });
            }
        }

        this.getList().find('.more-episodes-bottom').find('.show-more-episodes-button')
            .click(() => {
                clickFunction(this);
            });
    }

    prependShowMoreEpisodesButton() {
        this.getHeader()
            .after(this.getShowMoreEpisodesTopHtml())

        function clickFunction(obj) {
            let $button = obj.getList().find('.more-episodes-top').find('.show-more-episodes-button');
            $button.off('click');
            
            let feed = obj.getData();

            obj.showsPrevious10Elements(feed);
            let timeout = 130 * (obj.getAllItemsList().length - obj.bufferSize);
            obj.removeExtraNextElements();
            console.log("^", obj.firstEpisodeDisplayed, obj.lastEpisodeDisplayed)
            
            if(obj.firstEpisodeIsDisplayed()) {
                let $showMoreEpisodesRowTop = obj.getShowMoreEpisodesTopElement();
                
                $showMoreEpisodesRowTop
                    .css('opacity', 0.7)
                    .animate({opacity: 0.0}, 150)
                    .slideUp(150, () => { 
                        $showMoreEpisodesRowTop.hide(); 
                        $showMoreEpisodesRowTop.css('opacity', ''); 

                        setTimeout(() => {
                            $button.click(() => {
                                clickFunction(obj);
                            });
                        }, timeout);
                    });
            } else {
                setTimeout(() => {
                    $button.click(() => {
                        clickFunction(obj);
                    });
                }, timeout);
            }
        }

        this.getList().find('.more-episodes-top').find('.show-more-episodes-button')
            .click(() => {
                clickFunction(this);
            });
    }
}

class Feeds {
    constructor() {
        this.load();
        this.ui = new FeedsUI(this);
        this.playback = new Playback();
        this.lastFeedUrlToReload = null;
    }

    load() {
        if (!fs.existsSync(getFeedDirPath()))
            fs.mkdirSync(getFeedDirPath());

        if (!fs.existsSync(getIndexFeedFilePath()))
            fs.openSync(getIndexFeedFilePath(), 'w');

        let fileContent = ifExistsReadFile(getIndexFeedFilePath());
        this.index = JSON.parse(fileContent == "" ? "[]": fileContent);
        
        for(let i in this.index) {
            let indicator = this.index[i].indicator;
            if (!fs.existsSync(this.getFeedPathByIndicator(indicator)))
                fs.openSync(this.getFeedPathByIndicator(indicator), 'w');

            let fileContent = ifExistsReadFile(this.getFeedPathByIndicator(indicator));
            this[this.index[i].feedUrl] = JSON.parse(fileContent == '' || fileContent == 'undefined' ? "[]": fileContent);
        }
    }

    updateByFeedUrl(feedUrl) {
        fs.writeFileSync(this.getFeedPathByFeedUrl(feedUrl), JSON.stringify(this[feedUrl], null, "\t"));
    }

    updateByIndicator(indicator) {
        let feedUrl = this.getFeedUrlByIndicator(indicator);
        fs.writeFileSync(this.getFeedPathByIndicator(indicator), JSON.stringify(this[feedUrl], null, "\t"));
    }

    updateIndex() {
        fs.writeFileSync(getIndexFeedFilePath(), JSON.stringify(this.index, null, "\t"));
    }

    updateAll() {
        this.updateIndex();
        for(let i in this.index)
            this.update(this.index[i].feedUrl);
    }

    getFeedPathByIndicator(indicator) {
        return getFeedDirPath() + '/' + indicator + '.json';
    }

    getFeedPathByFeedUrl(feedUrl) {
        return getFeedDirPath() + '/' + this.getIndicatorByFeedUrl(feedUrl) + '.json';
    }

    getIndicatorByFeedUrl(feedUrl) {
        let i = this.getIofIndexByFeedUrl(feedUrl);
        if(i != -1)
            return this.index[i].indicator;
        return undefined;
    }

    getIofIndexByFeedUrl(feedUrl) {
        for(let i in this.index)
            if(this.index[i].feedUrl == feedUrl)
                return i;
        return -1;
    }

    getFeedUrlByIndicator(indicator) {
        for(let i in this.index)
            if(this.index[i].indicator == indicator)
                return this.index[i].feedUrl;
        return undefined;
    }

    length(feedUrl) {
        if(!this[feedUrl])
            return 0;
        return this[feedUrl].length;
    }

    lengthIndex() {
        return this.index.length;
    }

    getNewIndicator() {
        let getNewIndicator = undefined;
        do {
            getNewIndicator = '_' + Math.random().toString(36).substr(2, 9);
        } while(this.getFeedUrlByIndicator(getNewIndicator));
        return getNewIndicator;
    }

    getFeedPodcast(feedUrl) {
        return this[feedUrl];
    }

    getEpisode(feedUrl, i) {
        if(i < 0 || i >= this.length(feedUrl))
            return undefined;
        return this[feedUrl][i];
    }

    findEpisodeByEpisodeUrl(feedUrl, episodeUrl) {
        let feed = this[feedUrl];
        if(feed != undefined) {
            let i = feed.map(e => e.episodeUrl).indexOf(episodeUrl);
            return i;
        }
        return -1;
    }

    getEpisodeByEpisodeUrl(feedUrl, episodeUrl) {
        let i = this.findEpisodeByEpisodeUrl(feedUrl, episodeUrl);
        if(i != -1) 
            return this[feedUrl][i];
        return undefined;
    }

    getLastEpisode(feedUrl) {
        return this.getEpisode(feedUrl, 0);
    }
    
    initFeed(feedUrl) {
        let indicator = this.getIndicatorByFeedUrl(feedUrl);
        if(!indicator) {
            indicator = this.getNewIndicator();

            if (!fs.existsSync(this.getFeedPathByIndicator(indicator)))
                fs.openSync(this.getFeedPathByIndicator(indicator), 'w');

            let fileContent = ifExistsReadFile(this.getFeedPathByIndicator(indicator));
            this[feedUrl] = JSON.parse(fileContent == '' || fileContent == 'undefined' ? "[]": fileContent);
            
            this.index.push({feedUrl: feedUrl, indicator: indicator});
            this.updateIndex();
        }
        return indicator;
    }

    unsafeSet(feed) {
        if(!feed[0])
            return;
        let feedUrl = feed[0].feedUrl;
        if(this[feedUrl]) {
            this[feedUrl] = feed;
            return feedUrl;
        }
        return false;
    }

    set(feed) {
        let feedUrl = this.unsafeSet(feed);

        if(feedUrl) {
            this.updateByFeedUrl(feedUrl);
            return feedUrl;
        }
        return false;
    }

    delete(feedUrl) {
        let i = this.getIofIndexByFeedUrl(feedUrl);
        if(i == -1)
            return;
        let indicator = this.index[i].indicator;
        try {
            fs.unlinkSync(this.getFeedPathByIndicator(indicator));
            delete this[feedUrl];
            this.index.splice(i, 1);
            this.updateIndex();
            console.log('successfully deleted ' + this.getFeedPathByIndicator(indicator));
        } catch (err) {
            console.log('error in deleting ' + this.getFeedPathByIndicator(indicator));
        }
    }

    findEpisodeByEpisodeUrl(feedUrl, episodeUrl) {
        for(let i in this[feedUrl])
            if(this[feedUrl][i].episodeUrl == episodeUrl)
                return i;
        return -1
    }

    setPlaybackPositionByEpisodeUrl(feedUrl, episodeUrl, playbackPosition, duration) {
            this.playback.alwaysSetPositionAndDuration(feedUrl, episodeUrl, playbackPosition, duration);
    }

    getPlaybackPositionByEpisodeUrl(episodeUrl) {
        return this.playback.getPosition(episodeUrl);
    }

    setPlaybackDoneByEpisodeUrl(feedUrl, episodeUrl, done) {
            this.playback.alwaysSetDone(feedUrl, episodeUrl, done);
    }

    getPlaybackDoneByEpisodeUrl(episodeUrl) {
        return this.playback.getDone(episodeUrl);
    }
}

function loadFeeds() {
    allFeeds = new Feeds();
}