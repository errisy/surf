var NCBI = (function () {
    function NCBI() {
        var _this = this;
        this.BLAST = function (sequence, limit, onRetrieved, messageMonitor) {
            _this.Cancel();
            var NCBIEntries;
            var BlastCallback = function () {
                var retrieveUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id={id}&rettype=gb';
                var links = NCBIEntries.map(function (key) { return retrieveUrl.replace('{id}', key); });
                var onProteinRetrieved = function (value) {
                    var protein = NCBIParser.parseNCBIProteinEntry(value);
                    onRetrieved([protein]);
                };
                var NCBIProteinDownloader = new Downloader(links, onProteinRetrieved, 5, true);
            };
            _this.blast = new NCBIBlast(sequence, limit, NCBIEntries, BlastCallback, messageMonitor);
            _this.blast.start();
        };
        this.Cancel = function () {
            if (_this.blast) {
                _this.blast.cancel = true;
                _this.blast.downloaded = null;
                _this.blast = null;
            }
        };
    }
    return NCBI;
}());
var NCBIBlast = (function () {
    function NCBIBlast(sequence, limit, results, callback, messageMonitor) {
        var _this = this;
        this.cancel = false;
        this.callCount = 0;
        this.timeElapsed = 0;
        this.start = function () {
            if (_this.messageMonitor)
                _this.messageMonitor('NCBI BLAST query has been submit. Waiting for response...');
            //console.log(this.url);
            CORS.get(_this.url).success(_this.retrievingCallback).error(_this.retrievingError);
        };
        this.retrievingCallback = function (value) {
            //console.log(value);
            if (_this.cancel) {
                CORS.interval.cancel(_this.countDownPromise);
                _this.countDownPromise = null;
                if (_this.messageMonitor)
                    _this.messageMonitor('NCBI BLAST query (' + _this.id + ') is  cancelled.');
                _this.id = null;
                return;
            }
            if (NCBIBlast.ptnOutput.IsMatch(value)) {
                var xml = jQuery(jQuery.parseXML(value));
                var hits = xml.find('Hit_accession');
                var results = _this.results;
                hits.each(function (index, elem) {
                    results.push(elem.innerHTML);
                });
                if (_this.downloaded)
                    _this.downloaded();
                CORS.interval.cancel(_this.countDownPromise);
            }
            else {
                if (!_this.id)
                    if (NCBIBlast.ptnRID.IsMatch(value)) {
                        var m = NCBIBlast.ptnRID.Match(value);
                        _this.id = m.groups[1];
                    }
                var readyIn;
                if (NCBIBlast.ptnReady.IsMatch(value)) {
                    var m = NCBIBlast.ptnReady.Match(value);
                    readyIn = m.groups[1];
                }
                if (NCBIBlast.ptnWillUpdate.IsMatch(value)) {
                    var m = NCBIBlast.ptnWillUpdate.Match(value);
                    readyIn = m.groups[1];
                }
                if (!readyIn)
                    console.log(value);
                var count = Number(readyIn);
                if (_this.messageMonitor)
                    _this.messageMonitor('NCBI BLAST query (' + _this.id + ') will be updated in ' + readyIn + ' seconds. (Total ' + _this.timeElapsed.toString() + ' seconds elapsed)');
                if (isNaN(count))
                    count = 1;
                if (count == undefined)
                    count = 1;
                if (count < 1)
                    count = 1;
                _this.countDown = count;
                _this.countDownPromise = CORS.interval(_this.retriveCountDown, 1000);
            }
        };
        this.retriveCountDown = function () {
            if (_this.cancel) {
                CORS.interval.cancel(_this.countDownPromise);
                _this.countDownPromise = null;
                if (_this.messageMonitor)
                    _this.messageMonitor('NCBI BLAST query (' + _this.id + ') is  cancelled.');
                _this.id = null;
                return;
            }
            _this.countDown -= 1;
            _this.timeElapsed += 1;
            if (_this.countDown <= 0) {
                CORS.interval.cancel(_this.countDownPromise);
                _this.countDownPromise = null;
                _this.callCount += 1;
                var rUrl = NCBIBlast.retrievingUrl.replace('{0}', _this.id).replace('{1}', _this.limit.toString()).replace('{2}', _this.callCount.toString());
                if (_this.messageMonitor)
                    _this.messageMonitor('NCBI BLAST query (' + _this.id + ') is updating...');
                CORS.get(rUrl)
                    .success(_this.retrievingCallback)
                    .error(_this.retrievingError);
            }
            else {
                if (_this.messageMonitor)
                    _this.messageMonitor('NCBI BLAST query (' + _this.id + ') will be updated in ' + _this.countDown.toString() + ' seconds. (Total ' + _this.timeElapsed.toString() + ' seconds elapsed)');
            }
        };
        this.retrievingError = function (value) {
            if (_this.messageMonitor)
                _this.messageMonitor('NCBI BLAST error.');
        };
        this.limit = limit;
        this.url = NCBIBlast.baseUrl.replace('{0}', sequence).replace('{1}', limit.toString());
        this.results = results;
        this.downloaded = callback;
        this.messageMonitor = messageMonitor;
    }
    NCBIBlast.ptnRID = /<input name="RID" value="(\w+)" type="hidden" \/>/ig;
    NCBIBlast.ptnReady = /will be ready in (\d+) second/ig;
    NCBIBlast.ptnWillUpdate = /<p class="WAITING">This page will be automatically updated in <b>(\d+)<\/b> seconds<\/p>/ig;
    NCBIBlast.ptnOutput = /<!DOCTYPE BlastOutput/ig;
    NCBIBlast.baseUrl = 'http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Put&QUERY={0}=blastp&FILTER=L&DATABASE=nr&ALIGNMENTS=0&DESCRIPTIONS={1}';
    NCBIBlast.retrievingUrl = 'http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&RID={0}&FORMAT_OBJECT=Alignment&ALIGNMENT_TYPE=Pairwise&FORMAT_TYPE=XML&DESCRIPTIONS={1}&ALIGNMENTS=0&SHOW_LINKOUT=yes&CallCount={2}';
    return NCBIBlast;
}());
var NCBIEntryDownloader = (function () {
    function NCBIEntryDownloader(entries, onRetrieved) {
        var _this = this;
        this.parallelCalls = 0;
        this.count = 0;
        this.start = function () {
            _this.request();
        };
        this.request = function () {
            if (_this.parallelCalls < NCBIEntryDownloader.parallelCallNumber && _this.entries.length > 0) {
                var ids = _this.entries.splice(0, Math.min(NCBIEntryDownloader.parallelCallNumber - _this.parallelCalls, _this.entries.length));
                _this.count += 1;
                _this.parallelCalls += ids.length;
                ids.forEach(function (id) {
                    var url = NCBIEntryDownloader.proteinUrl.replace('{id}', id).replace('{count}', _this.count.toString());
                    CORS.get(url)
                        .success(_this.downloadCallback(id))
                        .error(_this.downloadError(id));
                });
            }
        };
        this.downloadCallback = function (id) {
            var that = _this;
            return function (value) {
                var entry = NCBIParser.parseNCBIProteinEntry(value);
                that.onRetrieved([entry]);
                that.parallelCalls -= 1;
                that.request();
            };
        };
        this.downloadError = function (id) {
            var that = _this;
            return function (value) {
                that.parallelCalls -= 1;
                that.entries.push(id); //add the id back to list;
                that.request();
            };
        };
        this.entries = entries;
        this.onRetrieved = onRetrieved;
    }
    NCBIEntryDownloader.parallelCallNumber = 5;
    NCBIEntryDownloader.proteinUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id={id}&rettype=gb&callcount={count}';
    return NCBIEntryDownloader;
}());
var Downloader = (function () {
    function Downloader(urls, onRetrieved, parallelCallLimit, useCallCount, onComplete) {
        var _this = this;
        this.total = 0;
        this.downloaded = 0;
        this.failed = 0;
        this.parallelCallLimit = 5;
        this.parallelCallNumber = 0;
        this.count = 0;
        this.require = function () {
            if (_this.parallelCallNumber < _this.parallelCallLimit && _this.urls.length > 0) {
                var ids = _this.urls.splice(0, Math.min(_this.parallelCallLimit - _this.parallelCallNumber, _this.urls.length));
                _this.count += 1;
                _this.parallelCallNumber += ids.length;
                var that = _this;
                ids.forEach(function (url) {
                    CORS.get(_this.useCallCount ? url + '&CallCountRefresher=' + _this.count.toString() : url)
                        .success(that.downloadCallback)
                        .error(that.downloadError(url));
                });
            }
            if (_this.count == (_this.downloaded + _this.failed))
                if (_this.onComplete)
                    _this.onComplete(_this.downloaded, _this.failed);
        };
        this.downloadCallback = function (value, status) {
            _this.onRetrieved(value);
            _this.downloaded += 1;
            _this.parallelCallNumber -= 1;
            _this.require();
        };
        this.downloadError = function (url) {
            var that = _this;
            return function (value, status) {
                switch (status) {
                    case 200:
                        break;
                    case 400:
                        console.log('400: Bad Request:', url);
                        _this.failed += 1;
                        break;
                    case 404:
                        console.log('404 Not Found: ', url);
                        _this.failed += 1;
                        break;
                    default:
                        //by default, we will try again;
                        that.urls.push(url); //add the id back to list because of error;
                        console.log('Download Failure:', url, status);
                }
                that.parallelCallNumber -= 1;
                that.require();
            };
        };
        this.urls = urls;
        this.onRetrieved = onRetrieved;
        this.useCallCount = useCallCount;
        this.onComplete = onComplete;
        this.total = this.urls.length;
        if (this.urls)
            if (this.urls.length > 0)
                this.require();
    }
    return Downloader;
}());
var NCBIProteinEntry = (function () {
    function NCBIProteinEntry() {
    }
    return NCBIProteinEntry;
}());
var NCBIParser = (function () {
    function NCBIParser() {
    }
    NCBIParser.parseNCBIProteinEntry = function (value) {
        var sections = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r])\w+/ig);
        sections = sections.map(function (value) { return value.replace(/^[\n\r]+/, ''); });
        var id = SectionDivider.SelectSection(sections, NCBIParser.ptnACCESSION)[0];
        var def = SectionDivider.SelectSection(sections, NCBIParser.ptnDefinition)[0];
        var source = SectionDivider.SelectSection(sections, NCBIParser.ptnSource)[0];
        var origin = SectionDivider.SelectSection(sections, NCBIParser.ptnORIGIN)[0];
        var entry = new NCBIProteinEntry();
        entry.id = id.replace(NCBIParser.ptnACCESSION, '').replace(/\s+/ig, '');
        entry.definition = def.replace(NCBIParser.ptnDefinition, '').replace(/\s\s+/ig, ' ');
        entry.source = source.split('\n')[0].substr(12);
        entry.sequence = ProteinUtil.AminoAcidFilter(origin.replace(NCBIParser.ptnORIGIN, ''));
        return entry;
    };
    NCBIParser.ptnDefinition = /^DEFINITION\s+/ig;
    NCBIParser.ptnSource = /^SOURCE\s+/ig;
    NCBIParser.ptnORIGIN = /^ORIGIN\s+/ig;
    NCBIParser.ptnACCESSION = /^ACCESSION\s+/ig;
    NCBIParser.ptnORGANISM = /\n\s{2}ORGANISM\s+/ig;
    return NCBIParser;
}());
//# sourceMappingURL=ncbi.js.map