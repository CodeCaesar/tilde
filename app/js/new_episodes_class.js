var allNewEpisodes = null;

class NewEpisodesUI extends ListUI {

    showNothingToShow() {
        if(this.isNewEpisodesPage()) 
            super.showNothingToShow(s_NewEpisodesNothingFoundIcon, 'new_episodes-nothing-to-show');
    }

    isNewEpisodesPage() {
        return (this.getPageType() == 'newEpisodes');
    }

    add(episode, i) {
        if(this.isNewEpisodesPage())
            super.add(episode, i);

        setItemCounts();
    }


    directAdd(episode, i, forceOriginalDirectAdd) {
        if(this.isNewEpisodesPage() || forceOriginalDirectAdd)
            super.directAdd(episode, i);
    }

    removeByEpisodeUrl(episodeUrl) {
        if(this.isNewEpisodesPage()) 
            super.removeByEpisodeUrl(episodeUrl, this.dataObject.getAll());

        setItemCounts();
    }

    showAll() {
        if(this.dataObject.isEmpty())
            this.showNothingToShow();

        let $list = this.getList();
        let epShownCounter = 0;
        for(let i in this.dataObject.episodes) {
            let episode = this.dataObject.get(i);
            if(!checkDateIsInTheLastWeek(episode))
                this.dataObject.removeByEpisodeUrl(episode.episodeUrl);
            else if(epShownCounter < this.bufferSize) {
                $list.append(this.getNewItemList(episode));
                epShownCounter++;
            }
        }
        setItemCounts();

        let length = this.length()

        this.firstEpisodeDisplayed = 0;
        this.lastEpisodeDisplayed = length - 1;
        
        this.appendShowMoreEpisodesButton();
        this.prependShowMoreEpisodesButton();
/* 
        if(this.bufferSize < this.dataObject.length())
            this.getShowMoreEpisodesBottomElement().show();
 */
        setScrollPositionOnTop();
    }

    convertItemIntoInfoItemList(obj) {
        let episode = _(obj);

        let $obj = $(obj);
        $obj.attr('info-mode', '');
        let $descriptionItem = $obj.find('.list-item-description');
        $obj.off('click');
        
        $obj.find('div').not(".list-item-description").css('display', 'none');
        $obj.css('grid-template-columns', '5em 1fr 5em 5em');
        $descriptionItem.before(
            `<span id="info-item-list" style="opacity: 0;"> 
                <br>
                <span class="info-title">
                    ${episode.episodeTitle}
                </span>
                <br>
                <span class="info-channel">
                    ${episode.channelName}
                </span>
                <br>
                <span class="info-duration">
                    ${$obj.find('.list-item-sub-text').html()}
                </span>
                <br>
                <span class="info-description">
                    ${getInfoFromDescription(episode.episodeDescription)}
                </span>
                <br>
                <span class="info-pubdate">
                    ${new Date(episode.pubDate).toLocaleString()}
                </span>
                <span class="info-download">
                    ${allArchiveEpisodes.ui.getDownloadStateButton(episode.episodeUrl)}
                </span>
                <br>
                <br>
            </span>`
        )
        
        $obj.find('#info-item-list')
            .stop()
            .animate({opacity: 1.0}, 500);
        
        $descriptionItem.html(s_ArrowUpIcon);
        
        let initialHeight = $obj.css('height');
        $obj.css('height', 'auto');
        let autoHeight = $obj.css('height');
        $obj.css('height', initialHeight)
        
        $obj.find('img')
            .css('position', 'relative')
            .css('top', '0px')
            .stop()
            .animate({top: '22px'}, 300);

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
            $obj.css('grid-template-columns', '5em 1fr 6em 1fr 6em 5em 5em');

            $obj.find('img')
                .stop()
                .animate({top: '0px'}, 300, function () {
                    $obj.find('img').removeAttr('style');
                });

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

            
            $obj.find('.list-item-flag')
                .css('display', '');
        }
    }

    getNewItemList(newEpisode) {
        let episode = getInfoEpisodeByObj(newEpisode);

        let artwork = episode.artwork;
        let duration = getDurationFromDurationKey(episode);
        
        let $listElement = $(buildListItem(
            [
                getImagePart(artwork),
                getBoldTextPart(episode.episodeTitle),
                getSubTextPart(duration),
                getTextPart(episode.channelName),
                getProgressionFlagPart(episode.episodeUrl),
                getDescriptionPart(),
                getAddToArchiveButtonPart(episode.episodeUrl)
            ],
            "5em 1fr 6em 1fr 6em 5em 5em"
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
            $listElement.addClass("select-episode")
        
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
}

class NewEpisodes {
    constructor() {
        this.load();
        this.ui = new NewEpisodesUI(this);
    }

    load() {
        if (!fs.existsSync(getNewEpisodesSaveFilePath()))
            fs.openSync(getNewEpisodesSaveFilePath(), 'w');
            
        let fileContent = ifExistsReadFile(getNewEpisodesSaveFilePath());
        this.episodes = JSON.parse(fileContent == "" ? "[]": fileContent);
    }

    update() {
        fs.writeFileSync(getNewEpisodesSaveFilePath(), JSON.stringify(this.episodes, null, "\t"));
    }
    
    length() {
        return this.episodes.length;
    }

    isEmpty() {
        return (this.length() == 0);
    }

    getAll() {
        return this.episodes;
    }

    get(i) {
        return this.episodes[i];
    }

    getInfoByIndex(i) {
        let newEpisode = this.get(i);
        return getInfoEpisodeByObj(newEpisode);
    }
    
    findByEpisodeUrl(episodeUrl) {
        for(let i in this.episodes)
            if(this.episodes[i].episodeUrl == episodeUrl)
                return i;
        return -1;
    }

    getByEpisodeUrl(episodeUrl) {
        let i = this.findByEpisodeUrl(episodeUrl);
        return (i != -1 ? this.episodes[i] : undefined);
    }
    
    add(episode) {
        episode = {
            feedUrl: episode.feedUrl,
            episodeUrl: episode.episodeUrl
        }
        if(this.findByEpisodeUrl(episode.episodeUrl) == -1) {
            let i = 0;
            while(i < this.length() && compareEpisodeDates(this.episodes[i], episode) > 0)
                i++;
            this.episodes.splice(i, 0, episode);
            this.update();
            this.ui.add(episode, i);
            return episode;
        } 
        return null;
    }
    
    removeByEpisodeUrl(episodeUrl) {
        let i = this.findByEpisodeUrl(episodeUrl);
        if(i != -1) {
            this.episodes.splice(i, 1);
            this.update();
            this.ui.removeByEpisodeUrl(episodeUrl);
            return true;
        }
        return false;
    }

    removePodcastEpisodes(feedUrl) {
        for(let i = this.episodes.length - 1; i >= 0; i--) {
            if(this.episodes[i].feedUrl == feedUrl)  
                this.episodes.splice(i, 1);
        }
        this.update();
    }
}

function loadNewEpisodes() {
    allNewEpisodes = new NewEpisodes();
}