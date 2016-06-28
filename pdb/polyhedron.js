var PolyhedronBuilder = (function () {
    function PolyhedronBuilder(center, radius) {
        var _this = this;
        this.Surfaces = [];
        this.TrySubtract = function (vPoint, vRadius) {
            var sur = DirectionalSurface3D.TryGetDirectionalSurface(_this.Center, _this.Radius, vPoint, vRadius);
            if (sur)
                _this.Surfaces.push(sur);
        };
        this.IsEmpty = function (list) {
            var Vertices = [];
            _this.Surfaces.eachCombination(3, function (com) {
                var p = Vertex.TryGetVertex(com[0], com[1], com[2]);
                if (p) {
                    var dis = p.subtract(_this.Center);
                    if (list)
                        list.push(p);
                    if (dis.x <= _this.Radius + 0.0001 && dis.y <= _this.Radius + 0.0001 && dis.z <= _this.Radius + 0.0001 && dis.length >= _this.Radius - 0.0001) {
                        if (_this.Surfaces.every(function (surf) { return surf.IsPositive(p); }))
                            Vertices.push(p);
                    }
                }
            });
            return Vertices.length == 0;
        };
        this.Center = center;
        this.Radius = radius;
        this.Surfaces.push(set(new DirectionalSurface3D(), function (ds) {
            ds.X = 1.0;
            ds.Y = 0.0;
            ds.Z = 0.0;
            ds.Origin = new Vector3D(center.x + radius, 0.0, 0.0);
            ds.Direction = new Vector3D(-1.0, 0.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 1.0;
            ds.Y = 0.0;
            ds.Z = 0.0;
            ds.Origin = new Vector3D(center.x - radius, 0.0, 0.0);
            ds.Direction = new Vector3D(1.0, 0.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 1.0;
            ds.Z = 0.0;
            ds.Origin = new Vector3D(0.0, center.x + radius, 0.0);
            ds.Direction = new Vector3D(0.0, -1.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 1.0;
            ds.Z = 0.0;
            ds.Origin = new Vector3D(0.0, center.x - radius, 0.0);
            ds.Direction = new Vector3D(0.0, 1.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 0.0;
            ds.Z = 1.0;
            ds.Origin = new Vector3D(0.0, 0.0, center.x + radius);
            ds.Direction = new Vector3D(0.0, 0.0, -1.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 0.0;
            ds.Z = 1.0;
            ds.Origin = new Vector3D(0.0, 0.0, center.x - radius);
            ds.Direction = new Vector3D(0.0, 0.0, 1.0);
        }));
    }
    return PolyhedronBuilder;
}());
function set(obj, func) {
    func(obj);
    return obj;
}
var DirectionalSurface3D = (function () {
    function DirectionalSurface3D() {
    }
    /**
     * Determine if the point is a convex vectex.
     * @param TestPoint
     */
    DirectionalSurface3D.prototype.IsPositive = function (TestPoint) {
        return this.Direction.x * (TestPoint.x - this.Origin.x) + this.Direction.y * (TestPoint.y - this.Origin.y) + this.Direction.z * (TestPoint.z - this.Origin.z) >= 0.0;
    };
    DirectionalSurface3D.TryGetDirectionalSurface = function (HostCenter, HostRadius, SubtractCenter, SubtractRadius) {
        var dis = HostCenter.subtract(SubtractCenter);
        if (dis.length > HostRadius + SubtractRadius)
            return null;
        var X = 2.0 * dis.x;
        var Y = 2.0 * dis.y;
        var Z = 2.0 * dis.z;
        var C = HostCenter.lengthSquared - SubtractCenter.lengthSquared + SubtractRadius * SubtractRadius - HostRadius * HostRadius;
        var D = X * dis.x + Y * dis.y + Z * dis.z;
        var DK = X * HostCenter.x + Y * HostCenter.y + Z * HostCenter.z - C;
        var K = DK / D;
        var ds3D = new DirectionalSurface3D();
        ds3D.X = X;
        ds3D.Y = Y;
        ds3D.Z = Z;
        ds3D.Origin = new Vector3D(HostCenter.x - dis.x * K, HostCenter.y - dis.y * K, HostCenter.z - dis.z * K);
        ds3D.Direction = dis;
        //var verifyL = ds3D.X * ds3D.Origin.x + ds3D.Y * ds3D.Origin.y + ds3D.Z * ds3D.Origin.z;
        //var verifyC = ds3D.C;
        return ds3D;
    };
    return DirectionalSurface3D;
}());
var Vertex = (function () {
    function Vertex() {
    }
    /**
     * Solve the surface equation to obtain the point
     * @param fe1
     * @param fe2
     * @param fe3
     */
    Vertex.TryGetVertex = function (fe1, fe2, fe3) {
        var D = Vertex.Determinant(fe1.X, fe1.Y, fe1.Z, fe2.X, fe2.Y, fe2.Z, fe3.X, fe3.Y, fe3.Z);
        var DX = Vertex.Determinant(fe1.C, fe1.Y, fe1.Z, fe2.C, fe2.Y, fe2.Z, fe3.C, fe3.Y, fe3.Z);
        var DY = Vertex.Determinant(fe1.X, fe1.C, fe1.Z, fe2.X, fe2.C, fe2.Z, fe3.X, fe3.C, fe3.Z);
        var DZ = Vertex.Determinant(fe1.X, fe1.Y, fe1.C, fe2.X, fe2.Y, fe2.C, fe3.X, fe3.Y, fe3.C);
        if (D == 0.0) {
            return null;
        }
        else {
            return new Vector3D(DX / D, DY / D, DZ / D);
        }
    };
    Vertex.Determinant = function (a1, b1, c1, a2, b2, c2, a3, b3, c3) {
        return a1 * b2 * c3 + b1 * c2 * a3 + c1 * a2 * b3 - c1 * b2 * a3 - b1 * a2 * c3 - a1 * c2 * b3;
    };
    return Vertex;
}());
Array.prototype.eachCombination = function (size, action) {
    var that = eval('this');
    var length = that.length;
    if (size > length)
        return;
    var iterator = (function () {
        function iterator(from, level, indices) {
            if (level > size) {
                action(indices.map(function (index) { return that[index]; }));
            }
            else {
                for (var i = from; i < length - size + level; i++) {
                    indices[level] = i;
                    var next = indices.filter(function (value) { return true; });
                    new iterator(i + 1, level + 1, next);
                }
            }
        }
        return iterator;
    }());
    new iterator(0, 1, []);
};
//# sourceMappingURL=polyhedron.js.map