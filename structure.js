var StructureController = (function () {
    function StructureController($http, $scope, $location, $interval, $timeout) {
        var _this = this;
        this.threeReady = function (obj) {
            _this.threeObj = obj;
            var url = _this.location.absUrl();
            var index = url.lastIndexOf('?');
            //url:structure.html?id=3AGB_A&mode={wire|ball|halfball}&model
            var param = '';
            if (index + 1 < url.length) {
                param = url.substr(index + 1);
            }
            console.log('param:', param);
            var ptnID = /id=([1-9a-zA-Z]+)_([A-Z])/ig;
            var ptnMode = /mode=(\w+)/ig;
            var ptnModel = /model/ig;
            var useModel;
            if (ptnID.IsMatch(param)) {
                var m = ptnID.Match(param);
                _this.pdbID = m.groups[1].toUpperCase();
                _this.chainName = m.groups[2].toUpperCase();
            }
            if (ptnMode.IsMatch(param)) {
                var m = ptnMode.Match(param);
                _this.mode = m.groups[1].toLowerCase();
            }
            useModel = ptnModel.IsMatch(param);
            if (_this.pdbID) {
                _this.downloadStructure();
            }
            console.log(_this.pdbID, _this.chainName, _this.mode);
        };
        this.downloadStructure = function () {
            PDB.downloadPDB(_this.pdbID, _this.downloadStructureCallback);
        };
        this.downloadStructureCallback = function (value) {
            _this.pdb = PDBParser.parsePDB(value);
            _this.chain = _this.pdb.chainDict[_this.chainName];
            switch (_this.mode.toLowerCase()) {
                case 'wire':
                    pdb3d.presentChainBonds(_this.threeObj, _this.chain);
                    break;
                case 'ball':
                    var opt = {};
                    pdb3d.presentChainAtoms(_this.threeObj, _this.chain);
                    break;
                case 'half':
                    var opt = {};
                    opt.radiusFactor = 0.5;
                    pdb3d.presentChainAtoms(_this.threeObj, _this.chain, opt);
                    break;
                default:
            }
        };
        this.model1 = (function () {
            function test() {
            }
            return test;
        }());
        CORS.http = $http;
        CORS.timeout = $timeout;
        RPC.http = $http;
        this.location = $location;
    }
    StructureController.$inject = ['$http', '$scope', '$location', '$interval', '$timeout'];
    return StructureController;
}());
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
appStructure.addDirective('three', function () { return new ngThree.ThreeDirective(); });
appStructure.addDirective('sequence', function () { return new SequenceDirective(); });
appStructure.addDirective('cors', function ($http, $compile) { return new CORS.CORSTestDirective($http, $compile); });
appStructure.addController('structure', StructureController);
//# sourceMappingURL=structure.js.map