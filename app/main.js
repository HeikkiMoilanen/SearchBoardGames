(function () {
    'use strict';

    angular
        .module('app')
        .controller('Main', ['$http', main]);

    function main($http) {
        var vm = this;
        var useTestData = false;
        var cacheExpirationHours = 24;
        init();

        function init() {
            vm.getBoardGameGeekData = getBoardGameGeekData;
            vm.getHuutoNetItems = getHuutoNetItems;
            vm.cacheResults = cacheResults;
            vm.boardGameGeekResults = [];
            vm.huutoNetResults = [];
            if (!getCachedResults()) {
                vm.getBoardGameGeekData();
            }
        }

        function getBoardGameGeekData() {
            if (useTestData) {
                generateTestData();
                return;
            }
            $http({
                method: 'GET',
                url: "http://bgg-api.herokuapp.com/api/v1/hot"
            }).then(function success(response) {
                vm.boardGameGeekResults = response.data.items.item
                var hotGameTitles = parseBoardGameGeekResults(vm.boardGameGeekResults);
                for (var i = 0; i < hotGameTitles.length; i++) {
                    getHuutoNetItems(hotGameTitles[i])
                }
            });

            function parseBoardGameGeekResults(boardGameGeekResults) {
                var hotGames = []
                for (var x = 0; x < boardGameGeekResults.length; x++) {
                    hotGames.push(boardGameGeekResults[x].name[0].$.value);
                }
                return hotGames;
            }
        }

        function getHuutoNetItems(query) {
            var category = "168-170" //lauta- ja korttipelit
            $http({
                method: 'GET',
                url: "https://api.huuto.net/1.1/items?words=" + query + "&category=" + category
            }).then(function success(response) {
                if (response.data.items.length > 0) {
                    var huutoNetResults = parseHuutoNetResponse(response);
                    var huutoNetResultWithQuery = { "query": query, "results": huutoNetResults };
                    vm.huutoNetResults.push(huutoNetResultWithQuery);
                    vm.cacheResults(vm.huutoNetResults);
                }
            });

            function parseHuutoNetResponse(response) {
                var items = response.data.items;
                var parsedResults = [];
                    // show max 5 results for a single item
                for (var i = 0; i < items.length && i <= 5; i++) {
                    var parsedItem = {}
                    if (items[i].links && items[i].links.alternative) {
                        parsedItem.url = items[i].links.alternative
                    }
                    if (items[i].title) {
                        parsedItem.title = items[i].title;
                    }
                    if (items[i].currentPrice) {
                        var currentPrice = items[i].currentPrice;
                        parsedItem.currentPrice = currentPrice.toFixed(2);
                    }
                    if (items[i].buyNowPrice) {
                        parsedItem.buyNowPrice = items[i].buyNowPrice;
                    }
                    if (items[i].closingTime) {
                        if (Date.parse(items[i].closingTime)) {
                            var closingTime = new Date(items[i].closingTime);
                            var month = ["Tammikuuta", "Helmikuuta", "Maaliskuuta", "Huhtikuuta", "Toukokuuta", "Kesäkuuta",
                                    "Heinäkuuta", "Elokuuta", "Syyskuuta", "Lokakuuta", "Marraskuuta", "Joulukuuta"][closingTime.getMonth()];
                            var dateString = closingTime.getDay() + '. ' + month + ' ' + closingTime.getFullYear();
                            parsedItem.closingTime = dateString;
                        }
                    }
                    if (items[i].images && items[i].images.length > 0 && items[i].images[0].links) {
                        parsedItem.image = items[i].images[0].links.thumbnail;
                    } else {
                        parsedItem.image = "";
                    }

                    parsedResults[i] = parsedItem;
                }
                return parsedResults;
            }
        }

        function cacheResults(huutoNetResults) {
            var cachedResults = { 'timestamp': new Date(), 'huutoNetResults': huutoNetResults };
            var cachedResultsStr = JSON.stringify(cachedResults);
            localStorage['cachedResults'] = cachedResultsStr;
        }

        function getCachedResults() {
            var cachedResults = JSON.parse(localStorage['cachedResults']);
            if (!cachedResults) {
                console.log("didn't find cached results");
                return false;
            }
            var cachedDate = Date.parse(cachedResults['timestamp']);
            var expirationMilliseconds = vm.cacheExpirationHours * 60 * 60 * 1000;
            if (new Date() - cachedDate > expirationMilliseconds) {
                console.log("cache expired");
                localStorage.removeItem('cachedResults');
                return false;
            }
            console.log('using cache');

            vm.huutoNetResults = cachedResults.huutoNetResults;
            return true;
        }

        function generateTestData() {
            vm.huutoNetResults.push([{ "url": "https://www.huuto.net/kohteet/dominion-valatakunta/390663264", "title": "dominion valatakunta", "currentPrice": 24, "closingTime": "2016-01-24T12:27:05+0200", "image": "https://kuvat.huuto.net/9/e1/426b51dee8d97d7498c433f7595be-s.jpg" }, { "url": "https://www.huuto.net/kohteet/dominion---alkemia-5-lisaosa/391669389", "title": "Dominion - Alkemia (5. lisäosa)", "currentPrice": 19.9, "closingTime": "2016-02-01T17:09:32+0200", "image": "https://kuvat.huuto.net/b/95/2b42bf69a546a90b3a45ea0276dc3-s.jpg" }, { "url": "https://www.huuto.net/kohteet/dominion---alkemia-5-lisaosa/391657571", "title": "Dominion - Alkemia (5. lisäosa)", "currentPrice": 19.9, "closingTime": "2016-02-01T15:11:28+0200", "image": "https://kuvat.huuto.net/1/c1/567ecd32ac148de3a6a78dc131ab0-s.jpg" }])
            vm.huutoNetResults.push([{ "url": "https://www.huuto.net/kohteet/splendor--lautapeli---kuin-uusi/391839747", "title": "Splendor – lautapeli - KUIN UUSI", "currentPrice": 15, "buyNowPrice": 15, "closingTime": "2016-05-18T21:56:00+0300", "image": "https://kuvat.huuto.net/1/a8/1c4d63fba40609a7bdbc89f4a5462-s.jpg" }, { "url": "https://www.huuto.net/kohteet/9050028-city-of-splendors-waterdeep-forgotten-realms/390574314", "title": "9050028 City of Splendors: Waterdeep (Forgotten Realms)", "currentPrice": 39.5, "closingTime": "2016-01-23T12:39:50+0200", "image": "https://kuvat.huuto.net/a/5a/a9b20c97ba1ec4b55c777c067cf0c-s.jpg" }]);
            vm.huutoNetResults.push([{ "url": "https://www.huuto.net/kohteet/juno-eclipse-alternative-by-paul-la-rue-x-wing-miniatures/390886978", "title": "Juno Eclipse Alternative by Paul La Rue, X-Wing Miniatures", "currentPrice": 5, "closingTime": "2016-01-25T23:06:28+0200", "image": "https://kuvat.huuto.net/e/93/4a5d6c6e5e79889253afce8ee74cf-s.jpg" }, { "url": "https://www.huuto.net/kohteet/tie-advanced-sininen-raider-versio-x-wing-miniatures/389461363", "title": "Tie Advanced (sininen Raider-versio), X-Wing Miniatures", "currentPrice": 19.9, "buyNowPrice": 19.9, "closingTime": "2016-04-28T22:17:00+0300", "image": "https://kuvat.huuto.net/1/56/6c6b717708dccc1a5483f24120266-s.jpg" }]);
        }
    }
})();