class StructureController {
    static $inject = ['$http', '$scope', '$location', '$interval', '$timeout'];
    public location: ng.ILocationService;
    constructor($http: ng.IHttpService, $scope: ng.IScope, $location: ng.ILocationService, $interval: ng.IIntervalService, $timeout: ng.ITimeoutService) {
        CORS.http = $http;
        CORS.timeout = $timeout;
        RPC.http = $http;
        this.location = $location;

        
    }
    public threeObj: ngThree.ThreeObject;
    public threeReady = (obj: ngThree.ThreeObject) => {
        this.threeObj = obj;
        var url = this.location.absUrl();
        var index = url.lastIndexOf('?');
        //url:structure.html?id=3AGB_A&mode={wire|ball|halfball}&model
        var param: string = '';
        if (index + 1 < url.length) {
            param = url.substr(index + 1);
        }
        console.log('param:', param);
        var ptnID = /id=([1-9a-zA-Z]+)_([A-Z])/ig;
        var ptnMode = /mode=(\w+)/ig;
        var ptnModel = /model/ig;

        var useModel: boolean;
        if (ptnID.IsMatch(param)) {
            let m = ptnID.Match(param);
            this.pdbID = m.groups[1].toUpperCase();
            this.chainName = m.groups[2].toUpperCase();
        }
        if (ptnMode.IsMatch(param)) {
            let m = ptnMode.Match(param);
            this.mode = m.groups[1].toLowerCase();
        }
        useModel = ptnModel.IsMatch(param);

        if (this.pdbID) {
            this.downloadStructure();
        }
        console.log(this.pdbID, this.chainName, this.mode);
    }

    public downloadStructure = () => {
        PDB.downloadPDB(this.pdbID, this.downloadStructureCallback);
    }
    public pdbID: string;
    public chainName: string; 
    public mode: string;
    public pdb: Structure;
    public chain: Chain;

    public downloadStructureCallback = (value: string) => {
        this.pdb = PDBParser.parsePDB(value);
        this.chain = this.pdb.chainDict[this.chainName];
        switch (this.mode.toLowerCase()) {
            case 'wire':
                pdb3d.presentChainBonds(this.threeObj, this.chain);
                break;
            case 'ball':
                var opt: pdb3dOptions = <any>{};
                pdb3d.presentChainAtoms(this.threeObj, this.chain);
                break;
            case 'half':
                var opt: pdb3dOptions = <any>{};
                opt.radiusFactor = 0.5;
                pdb3d.presentChainAtoms(this.threeObj, this.chain, opt);
                break;
            default:
                //wire mode
        }
    }

    public model1 = class test {

    }
}

 
    

var appStructure = new ngstd.AngularModule('structure', ['angucomplete-alt', 'ngMaterial']);

appStructure.trustUrl(/^\s*(data|http|https):/);

appStructure.includeCaptchaDirecive();
appStructure.includeFileUploadDirective();
appStructure.includeImageEditorDirective();
appStructure.includeOpenFileDirective();
appStructure.includeString2DateDirective();
appStructure.includeNum2StrDirective();
appStructure.includeBool2StrDirective();
appStructure.includeContentDirective();
appStructure.includeGalleryDirective();

AceEditor.EnableAceDirective(appStructure);


appStructure.includeTreeDirective();

appStructure.addDirective('three', () => new ngThree.ThreeDirective());
appStructure.addDirective('sequence', () => new SequenceDirective());

appStructure.addDirective('cors', ($http: ng.IHttpService, $compile: ng.ICompileService) => new CORS.CORSTestDirective($http, $compile));

appStructure.addController('structure', StructureController);
