class NCBI {
    constructor() {
    }
    public blast: NCBIBlast;
    public BLAST = (sequence: string, limit: number, onRetrieved: (proteins: NCBIProteinEntry[]) => void, messageMonitor: (value: string) => void) => {
        this.Cancel();
        var NCBIEntries: string[];        
        var BlastCallback = () => {
            var retrieveUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id={id}&rettype=gb';
            var links = NCBIEntries.map((key: string) => retrieveUrl.replace('{id}', key));

            var onProteinRetrieved = (value: string) => {
                var protein = NCBIParser.parseNCBIProteinEntry(value);
                onRetrieved([protein]);
            };
            var NCBIProteinDownloader = new Downloader(links, onProteinRetrieved, 5, true);
        }
        this.blast = new NCBIBlast(sequence, limit, NCBIEntries, BlastCallback, messageMonitor);
        this.blast.start();
    }
    public Cancel = () => {
        if (this.blast) {
            this.blast.cancel = true;
            this.blast.downloaded = null;
            this.blast = null;
        }
    }
}
class NCBIBlast {
    public limit: number;
    public cancel: boolean = false;
    public messageMonitor: (value: string) => void;
    public url: string;
    public retrievingUrl: string;
    public results: string[];
    public downloaded: () => void;
    public id: string;
    public countDown: number;
    public callCount: number = 0;
    public timeElapsed: number = 0;
    public countDownPromise: ng.IPromise<any>;
    static ptnRID = /<input name="RID" value="(\w+)" type="hidden" \/>/ig;
    static ptnReady = /will be ready in (\d+) second/ig;
    static ptnWillUpdate = /<p class="WAITING">This page will be automatically updated in <b>(\d+)<\/b> seconds<\/p>/ig;
    static ptnOutput = /<!DOCTYPE BlastOutput/ig;
    static baseUrl = 'http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Put&QUERY={0}=blastp&FILTER=L&DATABASE=nr&ALIGNMENTS=0&DESCRIPTIONS={1}';
    static retrievingUrl = 'http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?CMD=Get&RID={0}&FORMAT_OBJECT=Alignment&ALIGNMENT_TYPE=Pairwise&FORMAT_TYPE=XML&DESCRIPTIONS={1}&ALIGNMENTS=0&SHOW_LINKOUT=yes&CallCount={2}';

    constructor(sequence: string, limit: number, results: string[], callback: () => void, messageMonitor?: (value: string) => void) {
        this.limit = limit;
        this.url = NCBIBlast.baseUrl.replace('{0}', sequence).replace('{1}', limit.toString());
        this.results = results;
        this.downloaded = callback;
        this.messageMonitor = messageMonitor;
    }
    public start = () => {
        if (this.messageMonitor) this.messageMonitor('NCBI BLAST query has been submit. Waiting for response...');
        //console.log(this.url);
        CORS.get(this.url).success(this.retrievingCallback).error(this.retrievingError);
    }

    public retrievingCallback = (value: string) => {
        //console.log(value);
        if (this.cancel) {
            CORS.interval.cancel(this.countDownPromise);
            this.countDownPromise = null;
            if (this.messageMonitor) this.messageMonitor('NCBI BLAST query (' + this.id + ') is  cancelled.');
            this.id = null;
            return;
        }
        if (NCBIBlast.ptnOutput.IsMatch(value)) {
            var xml = jQuery(jQuery.parseXML(value));
            var hits = xml.find('Hit_accession');
            var results = this.results;
            hits.each((index: number, elem: Element) => {
                results.push(elem.innerHTML);
            });
            if (this.downloaded) this.downloaded();
            CORS.interval.cancel(this.countDownPromise);
        }
        else {
            if (!this.id)if (NCBIBlast.ptnRID.IsMatch(value)) {
                var m = NCBIBlast.ptnRID.Match(value);
                this.id = m.groups[1];
            }
            var readyIn: string;
            if (NCBIBlast.ptnReady.IsMatch(value)) {
                var m = NCBIBlast.ptnReady.Match(value);
                readyIn = m.groups[1];
            }
            if (NCBIBlast.ptnWillUpdate.IsMatch(value)) {
                var m = NCBIBlast.ptnWillUpdate.Match(value);
                readyIn = m.groups[1];
            }
            if (!readyIn) console.log(value);
            var count = Number(readyIn);
            if (this.messageMonitor) this.messageMonitor('NCBI BLAST query (' + this.id + ') will be updated in ' + readyIn + ' seconds. (Total ' + this.timeElapsed.toString() + ' seconds elapsed)');
            if (isNaN(count)) count = 1;
            if (count == undefined) count = 1;
            if (count < 1) count = 1;
            this.countDown = count;
            this.countDownPromise = CORS.interval(this.retriveCountDown, 1000);
        }
    }
    public retriveCountDown = () => {
        if (this.cancel) {
            CORS.interval.cancel(this.countDownPromise);
            this.countDownPromise = null;
            if (this.messageMonitor) this.messageMonitor('NCBI BLAST query (' + this.id + ') is  cancelled.');
            this.id = null;
            return;
        }
        this.countDown -= 1;
        this.timeElapsed += 1;
        if (this.countDown <= 0) {
            CORS.interval.cancel(this.countDownPromise);
            this.countDownPromise = null;
            this.callCount += 1;
            var rUrl = NCBIBlast.retrievingUrl.replace('{0}', this.id).replace('{1}', this.limit.toString()).replace('{2}', this.callCount.toString());
            if (this.messageMonitor) this.messageMonitor('NCBI BLAST query (' + this.id + ') is updating...');
            CORS.get(rUrl)
                .success(this.retrievingCallback)
                .error(this.retrievingError);
        }
        else {
            if (this.messageMonitor) this.messageMonitor('NCBI BLAST query (' + this.id + ') will be updated in ' + this.countDown.toString() + ' seconds. (Total ' + this.timeElapsed.toString() + ' seconds elapsed)');
        }
    }
    public retrievingError = (value: string) => {
        if (this.messageMonitor) this.messageMonitor('NCBI BLAST error.');
    }
}

class NCBIEntryDownloader {
    public entries: string[];
    public onRetrieved: (retrieved: NCBIProteinEntry[]) => void;
    constructor(entries: string[], onRetrieved: (retrieved: NCBIProteinEntry[])=>void) {
        this.entries = entries;
        this.onRetrieved = onRetrieved;
    }
    static parallelCallNumber: number = 5;
    static proteinUrl = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id={id}&rettype=gb&callcount={count}';
    public parallelCalls: number = 0;
    public count: number = 0;
    public start = () => {
        this.request();
    }
    public request = () => {
        if (this.parallelCalls < NCBIEntryDownloader.parallelCallNumber && this.entries.length > 0) {
            var ids = this.entries.splice(0, Math.min(NCBIEntryDownloader.parallelCallNumber - this.parallelCalls, this.entries.length));
            this.count += 1;
            this.parallelCalls += ids.length;

            ids.forEach((id: string) => {
                var url = NCBIEntryDownloader.proteinUrl.replace('{id}', id).replace('{count}', this.count.toString());
                CORS.get(url)
                    .success(this.downloadCallback(id))
                    .error(this.downloadError(id));
            });
        }
    }
    public downloadCallback = (id: string) => {
        var that = this;
        return (value: string) => {
            var entry = NCBIParser.parseNCBIProteinEntry(value);
            that.onRetrieved([entry]);
            that.parallelCalls -= 1;
            that.request();
        }
    }
    public downloadError = (id: string) => {
        var that = this;
        return (value: string) => {
            that.parallelCalls -= 1;
            that.entries.push(id);//add the id back to list;
            that.request();
        }
    }
}

class Downloader {
    public urls: string[];
    public onRetrieved: (retrieved: string) => void;
    public useCallCount: boolean;
    public onComplete: (downloaded: number, failed: number) => void;
    constructor(urls: string[], onRetrieved: (retrieved: string) => void, parallelCallLimit: number, useCallCount?: boolean, onComplete?:(downloaded: number, failed:number )=>void ) {
        this.urls = urls;
        this.onRetrieved = onRetrieved;
        this.useCallCount = useCallCount;
        this.onComplete = onComplete;
        this.total = this.urls.length;
        if(this.urls)if(this.urls.length>0)this.require();
    }
    public total: number = 0;
    public downloaded: number = 0; 
    public failed: number = 0;
    public parallelCallLimit: number = 5;
    public parallelCallNumber: number = 0;
    public count: number = 0;
    public require = () => {
        if (this.parallelCallNumber < this.parallelCallLimit && this.urls.length > 0) {
            var ids = this.urls.splice(0, Math.min(this.parallelCallLimit - this.parallelCallNumber, this.urls.length));
            this.count += 1;
            this.parallelCallNumber += ids.length;
            var that = this;
            ids.forEach((url: string) => {
                CORS.get(this.useCallCount ? url + '&CallCountRefresher=' + this.count.toString():url)
                    .success(that.downloadCallback)
                    .error(that.downloadError(url));
            });
        }
        if (this.count == (this.downloaded + this.failed)) if (this.onComplete) this.onComplete(this.downloaded, this.failed);
    }
    public downloadCallback = (value: string, status: number) => {
        this.onRetrieved(value);
        this.downloaded += 1;
        this.parallelCallNumber -= 1;
        this.require();
    }
    public downloadError = (url: string) => {
        var that = this;
        return (value: string, status: number) => {
            switch (status) {
                case 200:
                    break;
                case 400:
                    console.log('400: Bad Request:', url);
                    this.failed += 1;
                    break;
                case 404:
                    console.log('404 Not Found: ', url);
                    this.failed += 1;
                    break;
                default:
                    //by default, we will try again;
                    that.urls.push(url);//add the id back to list because of error;
                    console.log('Download Failure:', url, status);
            }
            that.parallelCallNumber -= 1;
            that.require();
        }
    }
}

class NCBIProteinEntry {
    public id: string;
    public definition: string;
    public source: string;
    public name: string;
    public sequence: string;
}

class NCBIParser {
    static ptnDefinition = /^DEFINITION\s+/ig;
    static ptnSource = /^SOURCE\s+/ig;
    static ptnORIGIN = /^ORIGIN\s+/ig;
    static ptnACCESSION = /^ACCESSION\s+/ig;
    static ptnORGANISM = /\n\s{2}ORGANISM\s+/ig

    static parseNCBIProteinEntry(value: string): NCBIProteinEntry {
        var sections = SectionDivider.sectionsAfterEachPattern(value, /(^|[\n\r])\w+/ig);
        sections = sections.map((value: string) => value.replace(/^[\n\r]+/, ''));
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
    }
}



