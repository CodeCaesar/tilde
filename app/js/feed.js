process.dlopen = () => {
  throw new Error('Load native module is not safe')
}
const xmlParserWorker = new Worker('./js/xmlparser_worker.js')
const updateFeedWorker = new Worker('./js/update_feed_worker.js')

setInterval(function () { 
    readFeeds();
    console.log('Feeds have been read!');
}, 30 * 60 * 1000);

function checkDateIsInTheLastWeek(episode) {
    var day = new Date();
    var previousweek = day.getTime() - 7 * 24 * 60 * 60 * 1000;

    return (compareEpisodeDates(episode, {pubDate: previousweek}) > 0);
}

function compareEpisodeDates(episode1, episode2) {
    if(episode1 && episode2) {
        let pubDate1 = (episode1.pubDate ? episode1.pubDate : getInfoEpisodeByObj(episode1).pubDate);
        let pubDate2 = (episode2.pubDate ? episode2.pubDate : getInfoEpisodeByObj(episode2).pubDate);
        let date1 = new Date(pubDate1);
        let date2 = new Date(pubDate2);
        if(date1.getTime() < date2.getTime())
            return -1;
        if(date1.getTime() > date2.getTime())
            return 1;
        return 0;
    }
    return undefined;
}


function getInfoEpisodeByObj(episode) {
    let feedUrl = episode.feedUrl;
    let episodeUrl = episode.episodeUrl;
    if(feedUrl && episodeUrl)
        return allFeeds.getEpisodeByEpisodeUrl(feedUrl, episodeUrl);
    return undefined;
}

function urlify(text) {
    let urlRegex = /(https?:\/\/)?[\w\-@~]+(\.[\w\-~]+)+(\/[\w\-~@:%]*)*(#[\w\-]*)?(\?[^\s]*)?/gi;
    return text.replace(urlRegex, function (url) {
        if(url.length <= 3)
            return url;
        let content = url;
        if(url.indexOf('@') != -1)
            url = 'mailto:' + url;
        else if(url.substr(0, 4) != 'http')
            url = 'http://' + url;
        return '<a href="' + url + '">' + content + '</a>';
    })
}

function getInfoFromDescription(episodeDescription) {
    episodeDescription = episodeDescription.replaceAll('\n<br>', '<br>')
                                           .replaceAll('<br>\n', '<br>')
                                           .replaceAll('\n', '<br>');
    return (episodeDescription.indexOf('</a>') == -1 ? urlify(episodeDescription) : episodeDescription);
}

function getDurationFromDurationKey(episode) {
    if(!episode.durationKey)
        return "#h #min";

    let duration = parseFeedEpisodeDuration(episode.durationKey.split(":"));

    if (duration.hours == 0 && duration.minutes == 0) 
        duration = "";
    else
        duration = duration.hours + "h " + duration.minutes + "min";
    return duration;
}

function setRefreshingStateUI() {
    $('#menu-refresh').addClass('is-refreshing');
    $('#menu-refresh').off('click');
}

function unsetRefreshingStateUI() {
    setTimeout(() => {
        $('#menu-refresh').removeClass('is-refreshing');
        $('#menu-refresh').click(readFeeds);
    }, 2000); 
}

function readFeeds() {
    setRefreshingStateUI();

    if(!allFavoritePodcasts.isEmpty()) {
        let podcasts = allFavoritePodcasts.getAll();
        for (let i in podcasts) {
            allFeeds.lastFeedUrlToReload = podcasts[i].feedUrl;
            readFeedByFeedUrl(podcasts[i].feedUrl, (i == podcasts.length - 1));
        }
    } else
        unsetRefreshingStateUI();
    allArchiveEpisodes.downloadManager.saveAll();
}

function readFeedByFeedUrl(feedUrl, forceUnsetRefreshing) {
    makeRequest(feedUrl, updateFeed, (jqXHR) => {
        // ERR_INTERNET_DISCONNECTED
        if(jqXHR.status == 0 || forceUnsetRefreshing) 
            unsetRefreshingStateUI();
    });
}

function updateFeed(_Content, FeedUrl) {
    allFeeds.initFeed(FeedUrl)

    if (isContent302NotFound(_Content)) {
        allFeeds.ui.showNothingToShow(FeedUrl);
    } else {
        if (_Content.includes("<html>")) 
            allFeeds.ui.showNothingToShow(FeedUrl);
        else 
            processEpisodes(_Content, FeedUrl);
    }
}

xmlParserWorker.onmessage = function(ev) {
    let newFeed = ev.data.json;
    let podcastData = ev.data.podcastData; 
    let feedUrl = podcastData.feedUrl;
    let oldFeed =  allFeeds.getFeedPodcast(feedUrl);
    oldFeed = (!oldFeed ? [] : oldFeed);

    allFavoritePodcasts.setData(podcastData); 
    allFeeds.set(newFeed);
    
    if(allFeeds.ui.checkPageByFeedUrl(feedUrl)) {
        allFeeds.ui.setHeaderArtistContent(podcastData.data.artistName);
        allFeeds.ui.setHeaderDescriptionContent(getInfoFromDescription(podcastData ? podcastData.data.description : ''));
    }

    updateFeedWorker.postMessage({
        oldFeed: oldFeed,
        newFeed: newFeed
    })

    if(allFeeds.lastFeedUrlToReload == feedUrl)
        unsetRefreshingStateUI();
}

updateFeedWorker.onmessage = function(ev) {
    let feedUrl = ev.data.feedUrl;
    let new_episodes = ev.data.new_episodes;
    let deleted_episodes = ev.data.deleted_episodes;
    let initialLength = ev.data.initialLength;
    let feed = ev.data.feed;
    
    if(initialLength == 0 && new_episodes.length == feed.length) {
        allFeeds.ui.showLastNFeedElements(feed);
        addEpisodesFromTheLastWeek(feedUrl, feed);
    } else {
        for(let i in new_episodes) {
            let index = allFeeds.findEpisodeByEpisodeUrl(feedUrl, new_episodes[i])
            let episode = feed[index];
            
            allFeeds.ui.add(episode, index);
            if(!getSettings(feedUrl) && checkDateIsInTheLastWeek(episode))
                allNewEpisodes.add(episode);
        }
    }

    for(let i = deleted_episodes.length - 1; i >= 0; i--) {
        let episodeUrl = deleted_episodes[i];

        allFeeds.ui.remove(feedUrl, episodeUrl);
        allFeeds.playback.remove(episodeUrl)
        allNewEpisodes.removeByEpisodeUrl(episodeUrl);
        allArchiveEpisodes.removeByEpisodeUrl(episodeUrl);
    } 
}

function addEpisodesFromTheLastWeek(feedUrl, feed) {
    if(!getSettings(feedUrl)) {
        for(let i in feed) {
            let episode = feed[i];
            if(checkDateIsInTheLastWeek(episode)) 
                allNewEpisodes.add(episode);
            else 
                return;
        }
    }
}

function showAllEpisodes(obj) {
    let podcast = _(obj);

    let tmpPodcast = allFavoritePodcasts.getByFeedUrl(podcast.feedUrl);
    if(tmpPodcast)
        podcast = tmpPodcast;
    if(!podcast.data)
        podcast = getPodcastFromEpisode(podcast);

    setGridLayout(false);

    clearBody();
    setHeaderViewAction();
    removeContentRightHeader();
    
    getAllEpisodesFromFeed(podcast);
}

function getAllEpisodesFromFeed(podcast) {
    let feedUrl = podcast.feedUrl;

    allFeeds.ui.showHeader(podcast);

    let feed = allFeeds.getFeedPodcast(feedUrl);
    allFeeds.ui.showLastNFeedElements(feed);
    
    makeRequest(feedUrl, processEpisodes, () => {
        allFeeds.ui.showNothingToShow(feedUrl);
    });
}

// ---------------------------------------------------------------------------------------------------------------------
// NOTE: Helper to clear corrupt feeds

function isContent302NotFound(content) {
    return (content == "" || content.includes("302 Found"));
}

// ---------------------------------------------------------------------------------------------------------------------

function processEpisodes(content, feedUrl) {
    xmlParserWorker.postMessage({
        xml: content,
        feedUrl: feedUrl,
        artwork: getBestArtworkUrl(feedUrl)
    });
}

function addToArchive(self) {
    let listElement = self.parentElement.parentElement;
    
    allArchiveEpisodes.add(_(listElement));

}

function removeFromArchive(self) {
    let listElement = self.parentElement.parentElement;

    allArchiveEpisodes.removeByEpisodeUrl(_(listElement).episodeUrl);
}