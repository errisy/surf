var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ngThree;
(function (ngThree) {
    var ThreeDirective = (function (_super) {
        __extends(ThreeDirective, _super);
        function ThreeDirective() {
            _super.call(this);
            this.restrict = ngstd.DirectiveRestrict.A;
            this.scope.three = ngstd.BindingRestrict.OptionalBoth;
            this.scope.ready = ngstd.BindingRestrict.OptionalBoth;
            this.link = function (scope, element, attr) {
                var thr = new ThreeObject();
                scope.three = thr;
                thr.scene = new THREE.Scene();
                thr.camera = new THREE.PerspectiveCamera(75, element.width() / element.height(), 0.1, 1000);
                thr.raycaster = new THREE.Raycaster();
                thr.renderer = new THREE.WebGLRenderer({ antialias: true });
                thr.renderer.setPixelRatio(window.devicePixelRatio);
                thr.renderer.setSize(element.width(), element.height());
                element.append(thr.renderer.domElement);
                thr.orbit = new THREE.OrbitControls(thr.camera, thr.renderer.domElement);
                thr.orbit.autoRotate = true;
                thr.orbit.autoRotateSpeed = 20;
                thr.orbit.enabled = true;
                thr.orbit.enableRotate = true;
                thr.orbit.enableZoom = true;
                var ambientLight = new THREE.AmbientLight(0x000000);
                thr.lights.push(ambientLight);
                var lights = [];
                lights[0] = new THREE.PointLight(0xffffff, 1, 0);
                lights[1] = new THREE.PointLight(0xffffff, 1, 0);
                lights[2] = new THREE.PointLight(0xffffff, 1, 0);
                lights[0].position.set(0, 200, 0);
                lights[1].position.set(100, 200, 100);
                lights[2].position.set(-100, -200, -100);
                thr.lights.push(lights[0]);
                thr.lights.push(lights[1]);
                thr.lights.push(lights[2]);
                thr.scene.add(ambientLight);
                thr.scene.add(lights[0]);
                thr.scene.add(lights[1]);
                thr.scene.add(lights[2]);
                var mousedown = function (event) {
                    //event.preventDefault();
                    var mouse2 = new THREE.Vector2(((event.offsetX) / thr.renderer.domElement.clientWidth) * 2 - 1, -((event.offsetY) / thr.renderer.domElement.clientHeight) * 2 + 1);
                    //console.log(event, thr.renderer.domElement.clientWidth, thr.renderer.domElement.clientHeight, mouse2);
                    thr.raycaster.setFromCamera(mouse2, thr.camera);
                    var intersects = thr.raycaster.intersectObjects(thr.scene.children);
                    //console.log(intersects);
                    if (intersects.length > 0 && thr.onObjectsClicked)
                        thr.onObjectsClicked(intersects);
                    if (intersects.length > 0 && thr.onObjectsClicked)
                        thr.onObjectsClicked(intersects);
                    if (intersects.length > 0)
                        intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
                    intersects = undefined;
                };
                var touchstart = function (event) {
                    //event.preventDefault();
                    var mouseEvent = {};
                    mouseEvent.clientX = event.touches[0].clientX;
                    mouseEvent.clientY = event.touches[0].clientY;
                    mousedown(mouseEvent);
                };
                thr.renderer.domElement.addEventListener('mousedown', mousedown);
                thr.renderer.domElement.addEventListener('touchstart', touchstart);
                element.css('overflow', 'hidden');
                window.addEventListener('resize', function (ev) {
                    thr.updateSize(element.width(), element.height());
                });
                scope.$watch(function () { return element.width(); }, function (nValue, oValue) {
                    thr.updateSize(element.width(), element.height());
                });
                scope.$watch(function () { return element.height(); }, function (nValue, oValue) {
                    thr.updateSize(element.width(), element.height());
                });
                thr.camera.position.z = 30;
                thr.draw();
                if (scope.ready)
                    scope.ready(thr);
            };
        }
        return ThreeDirective;
    }(ngstd.AngularDirective));
    ngThree.ThreeDirective = ThreeDirective;
    var ThreeObject = (function () {
        function ThreeObject() {
            var _this = this;
            this.lights = [];
            this.updateSize = function (width, height) {
                _this.camera.aspect = width / height;
                _this.camera.updateProjectionMatrix();
                _this.renderer.setSize(width, height);
            };
            this.draw = function () {
                window.requestAnimationFrame(_this.draw);
                _this.renderer.render(_this.scene, _this.camera);
            };
        }
        ThreeObject.prototype.clearObjects = function () {
            var _this = this;
            var toRemove = this.scene.children.filter(function (value) { return _this.lights.indexOf(value) < 0; });
            //this.scene.children.clear();
            toRemove.forEach(function (value) {
                //value.material.dispose();
                if (value['material'])
                    (value['material']).dispose();
                if (value['geometry'])
                    (value['geometry']).dispose();
                _this.scene.remove(value);
            });
            toRemove = undefined;
        };
        ThreeObject.prototype.create = function () {
        };
        ThreeObject.prototype.addObject = function (obj3D) {
        };
        return ThreeObject;
    }());
    ngThree.ThreeObject = ThreeObject;
})(ngThree || (ngThree = {}));
//# sourceMappingURL=ngThree.js.map