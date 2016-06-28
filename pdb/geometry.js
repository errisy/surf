var Bounds3D = (function () {
    function Bounds3D() {
        var _this = this;
        this.Includes = function (point) {
            if (typeof point.x == 'number' && !isNaN(point.x)) {
                if (typeof _this.xMin == 'number' && !isNaN(_this.xMin)) {
                    _this.xMin = _this.xMin < point.x ? _this.xMin : point.x;
                }
                else {
                    _this.xMin = point.x;
                }
                if (typeof _this.xMax == 'number' && !isNaN(_this.xMax)) {
                    _this.xMax = _this.xMax > point.x ? _this.xMax : point.x;
                }
                else {
                    _this.xMax = point.x;
                }
            }
            if (typeof point.y == 'number' && !isNaN(point.y)) {
                if (typeof _this.yMin == 'number' && !isNaN(_this.yMin)) {
                    _this.yMin = _this.yMin < point.y ? _this.yMin : point.y;
                }
                else {
                    _this.yMin = point.y;
                }
                if (typeof _this.yMax == 'number' && !isNaN(_this.yMax)) {
                    _this.yMax = _this.yMax > point.y ? _this.yMax : point.y;
                }
                else {
                    _this.yMax = point.y;
                }
            }
            if (typeof point.z == 'number' && !isNaN(point.z)) {
                if (typeof _this.zMin == 'number' && !isNaN(_this.zMin)) {
                    _this.zMin = _this.zMin < point.z ? _this.zMin : point.z;
                }
                else {
                    _this.zMin = point.z;
                }
                if (typeof _this.zMax == 'number' && !isNaN(_this.zMax)) {
                    _this.zMax = _this.zMax > point.z ? _this.zMax : point.z;
                }
                else {
                    _this.zMax = point.z;
                }
            }
        };
        this.Expand = function (vXMin, vXMax, vYMin, vYMax, vZMin, vZMax) {
            _this.xMin += vXMin;
            _this.xMax += vXMax;
            _this.yMin += vYMin;
            _this.yMax += vYMax;
            _this.zMin += vZMin;
            _this.zMax += vZMax;
        };
        this.Contains = function (position) {
            if (!(_this.xMin && _this.xMax && _this.yMin && _this.yMin && _this.zMin && _this.zMax))
                return false;
            return _this.xMin <= position.x && _this.xMax >= position.x && _this.yMin <= position.y && _this.yMax >= position.y && _this.zMin <= position.z && _this.zMax >= position.z;
        };
    }
    Bounds3D.prototype.toString = function () {
        return 'Bounds3D{xMin: ' + this.xMin + ', xMax: ' + this.xMax + ', yMin: ' + this.yMin + ', yMax: ' + this.yMax + ', zMin: ' + this.zMin + ', zMax: ' + this.zMax + '}';
    };
    return Bounds3D;
}());
var Vector3D = (function () {
    function Vector3D(x, y, z) {
        var _this = this;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.divide = function (divider) {
            _this.x /= divider;
            _this.y /= divider;
            _this.z /= divider;
        };
        this.divideBy = function (divider) {
            return new Vector3D(_this.x / divider, _this.y / divider, _this.z / divider);
        };
        this.multiplyBy = function (multiplier) {
            return new Vector3D(_this.x * multiplier, _this.y * multiplier, _this.z * multiplier);
        };
        this.add = function (value) {
            return new Vector3D(_this.x + value.x, _this.y + value.y, _this.z + value.z);
        };
        this.subtract = function (value) {
            return new Vector3D(_this.x - value.x, _this.y - value.y, _this.z - value.z);
        };
        this.orthogonalWith = function (that) {
            //if (this.x == 0 && this.y == 0 && this.z == 0) throw 'host vector is 0';
            //var tLength = target.length;
            //if (tLength == 0) throw 'target vector is 0';
            //var K = -(this.x * target.x + this.y * target.y + this.z * target.z) / this.lengthSquared;
            //var orth = target.add(this.multiplyBy(K));
            //var both = new Vector3D(this.y * orth.z - orth.y * this.z, this.z * orth.x - orth.z * this.x, this.x * orth.y - orth.x * this.y);
            //var bLength = both.length;
            //if (bLength == 0) throw 'host and target vectors are in the same direction.';
            // this.x this.y this.z
            // that.x that.y that.z
            var both = new Vector3D(_this.y * that.z - _this.z * that.y, _this.z * that.x - _this.x * that.z, _this.x * that.y - _this.y * that.x);
            var bLength = both.length;
            if (bLength == 0)
                throw 'host and target vectors are in the same direction.';
            both.divide(bLength);
            return both;
        };
        this.equals = function (value) {
            return _this.x == value.x && _this.y == value.y && _this.z == value.z;
        };
        if (typeof x == 'number' && !isNaN(x))
            this.x = x;
        if (typeof y == 'number' && !isNaN(y))
            this.y = y;
        if (typeof z == 'number' && !isNaN(z))
            this.z = z;
    }
    Object.defineProperty(Vector3D.prototype, "clone", {
        get: function () {
            return new Vector3D(this.x, this.y, this.z);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector3D.prototype, "length", {
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector3D.prototype, "lengthSquared", {
        get: function () {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        },
        enumerable: true,
        configurable: true
    });
    Vector3D.sum = function () {
        var vectors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            vectors[_i - 0] = arguments[_i];
        }
        var result = new Vector3D();
        for (var i = 0; i < arguments.length; i++) {
            var item = arguments[i];
            result.x += item.x;
            result.y += item.y;
            result.z += item.z;
        }
        return result;
    };
    Vector3D.prototype.toString = function () {
        return this.x + ',' + this.y + ',' + this.z;
    };
    return Vector3D;
}());
var PolyhedronBuilder = (function () {
    function PolyhedronBuilder(center, radius) {
        var _this = this;
        this.Surfaces = [];
        this.TrySubtract = function (vPoint, vRadius) {
            var sur = DirectionalSurface3D.TryGetDirectionalSurface(_this.Center, _this.Radius, vPoint, vRadius);
            if (sur)
                _this.Surfaces.push(sur);
        };
        this.IsEmpty = function (isDebugging) {
            var Vertices = [];
            var count = 0;
            //var debugLines: string[] = [];
            _this.Surfaces.eachCombination(3, function (com) {
                var p = Vertex.TryGetVertex(com[0], com[1], com[2]);
                //console.log('vertex:');
                //console.log(p);
                if (p) {
                    //if (isDebugging && count < 1000) {
                    //    debugLines.push(p.toString() + '\r\n');
                    //    count += 1;
                    //}
                    var dis = p.subtract(_this.Center);
                    if (isDebugging && (count == 3185 || count == 3201))
                        console.log(count + ',' + dis.toString() + ',' + dis.length.toString() + ',' + _this.Radius);
                    if ((Math.abs(dis.x) <= _this.Radius + 0.0001) && (Math.abs(dis.y) <= _this.Radius + 0.0001) && (Math.abs(dis.z) <= _this.Radius + 0.0001) && (dis.length >= _this.Radius - 0.0001)) {
                        if (_this.Surfaces.every(function (surf) { return surf.IsPositive(p); })) {
                            Vertices.push(p);
                        }
                    }
                }
                count += 1;
            });
            return Vertices.length == 0;
        };
        this.Center = center;
        this.Radius = radius;
        this.Surfaces.push(set(new DirectionalSurface3D(), function (ds) {
            ds.X = 1.0;
            ds.Y = 0.0;
            ds.Z = 0.0;
            ds.C = center.x + radius;
            ds.Origin = new Vector3D(center.x + radius, 0.0, 0.0);
            ds.Direction = new Vector3D(-1.0, 0.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 1.0;
            ds.Y = 0.0;
            ds.Z = 0.0;
            ds.C = center.x - radius;
            ds.Origin = new Vector3D(center.x - radius, 0.0, 0.0);
            ds.Direction = new Vector3D(1.0, 0.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 1.0;
            ds.Z = 0.0;
            ds.C = center.y + radius;
            ds.Origin = new Vector3D(0.0, center.y + radius, 0.0);
            ds.Direction = new Vector3D(0.0, -1.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 1.0;
            ds.Z = 0.0;
            ds.C = center.y - radius;
            ds.Origin = new Vector3D(0.0, center.y - radius, 0.0);
            ds.Direction = new Vector3D(0.0, 1.0, 0.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 0.0;
            ds.Z = 1.0;
            ds.C = center.z + radius;
            ds.Origin = new Vector3D(0.0, 0.0, center.z + radius);
            ds.Direction = new Vector3D(0.0, 0.0, -1.0);
        }), set(new DirectionalSurface3D(), function (ds) {
            ds.X = 0.0;
            ds.Y = 0.0;
            ds.Z = 1.0;
            ds.C = center.z - radius;
            ds.Origin = new Vector3D(0.0, 0.0, center.z - radius);
            ds.Direction = new Vector3D(0.0, 0.0, 1.0);
        }));
    }
    PolyhedronBuilder.prototype.toString = function () {
        var lines = [];
        lines.push('PolyhedronBuilder Start:\r\n');
        lines.push('Center,' + this.Center.toString() + '\r\n');
        lines.push('Radius,' + this.Radius + '\r\n');
        this.Surfaces.forEach(function (surface) { return lines.push(surface.toString() + '\r\n'); });
        lines.push('End PolyhedronBuilder\r\n');
        return lines.join('');
    };
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
        return this.Direction.x * TestPoint.x + this.Direction.y * TestPoint.y + this.Direction.z * TestPoint.z >=
            this.Direction.x * this.Origin.x + this.Direction.y * this.Origin.y + this.Direction.z * this.Origin.z;
        //return this.Direction.x * (TestPoint.x - this.Origin.x) + this.Direction.y * (TestPoint.y - this.Origin.y) + this.Direction.z * (TestPoint.z - this.Origin.z) >= 0.0;
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
        ds3D.C = C;
        //console.log('ds3D.C: ' + ds3D.C.toString());
        ds3D.Origin = new Vector3D(HostCenter.x - dis.x * K, HostCenter.y - dis.y * K, HostCenter.z - dis.z * K);
        ds3D.Direction = dis;
        //var verifyL = ds3D.X * ds3D.Origin.x + ds3D.Y * ds3D.Origin.y + ds3D.Z * ds3D.Origin.z;
        //var verifyC = ds3D.C;
        return ds3D;
    };
    DirectionalSurface3D.prototype.isInSurface = function (point) {
        return Math.abs(point.x * this.X + point.y * this.Y + point.z * this.Z - this.C) < 1e-10;
    };
    DirectionalSurface3D.prototype.toString = function () {
        return this.X + ',' + this.Y + ',' + this.Z + ',' + this.C + ',' + this.Origin.toString() + ',' + this.Direction.toString();
    };
    return DirectionalSurface3D;
}());
var Edge = (function () {
    function Edge() {
    }
    Edge.isOutOfBox = function (fe1, fe2, radius) {
        //var direction = fe1.orthogonalWith(fe2);
        var sqrBase = fe2.Y * fe1.Z - fe1.Y * fe2.Z;
        var sqr2 = sqrBase * sqrBase;
        var rp1 = fe1.Y * fe1.Y + fe1.Z * fe1.Z;
        var rp2 = fe1.Y * fe2.Y + fe1.Z * fe2.Z;
        var rp3 = fe2.Y * fe2.Y + fe2.Z * fe2.Z;
        var canGetLine = -sqr2 *
            (fe2.C * fe2.C * (fe1.X * fe1.X + rp1) -
                2 * fe1.C * fe2.C * (fe1.X * fe2.X + rp2) +
                fe1.C * fe1.C * (fe2.X * fe2.X + rp3) -
                3 * radius * radius * (fe2.X * fe2.X * rp1 + sqr2 - 2 * fe1.X * fe2.X * rp2 + fe1.X * fe1.X * rp3));
        return canGetLine < -0.0001;
    };
    return Edge;
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
        //console.log(fe1, fe2, fe3);
        var D = Vertex.Determinant(fe1.X, fe1.Y, fe1.Z, fe2.X, fe2.Y, fe2.Z, fe3.X, fe3.Y, fe3.Z);
        var DX = Vertex.Determinant(fe1.C, fe1.Y, fe1.Z, fe2.C, fe2.Y, fe2.Z, fe3.C, fe3.Y, fe3.Z);
        var DY = Vertex.Determinant(fe1.X, fe1.C, fe1.Z, fe2.X, fe2.C, fe2.Z, fe3.X, fe3.C, fe3.Z);
        var DZ = Vertex.Determinant(fe1.X, fe1.Y, fe1.C, fe2.X, fe2.Y, fe2.C, fe3.X, fe3.Y, fe3.C);
        //console.log(D, DX, DY, DZ);
        if (D == 0.0) {
            return null;
        }
        else {
            var point = new Vector3D(DX / D, DY / D, DZ / D);
            //if (!fe1.isInSurface(point)) console.log(point.toString() + ' not in ' + fe1.toString());
            //if (!fe2.isInSurface(point)) console.log(point.toString() + ' not in ' + fe2.toString());
            //if (!fe3.isInSurface(point)) console.log(point.toString() + ' not in ' + fe3.toString());
            return point;
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
Array.prototype.eachCombinationCheck2 = function (size, check2, action) {
    var that = eval('this');
    var length = that.length;
    if (size > length)
        return;
    var iterator = (function () {
        function iterator(from, level, indices) {
            if (level == 3) {
                //console.log(indices);
                if (check2(that[indices[0]], that[indices[1]]))
                    return;
            }
            if (level > size) {
                action(indices.map(function (index) { return that[index]; }));
            }
            else {
                for (var i = from; i < length - size + level; i++) {
                    indices[level - 1] = i;
                    var next = indices.filter(function (value) { return true; });
                    new iterator(i + 1, level + 1, next);
                }
            }
        }
        return iterator;
    }());
    new iterator(0, 1, []);
};
Array.prototype.someCombinationCheck2 = function (size, check2, action) {
    var that = eval('this');
    var length = that.length;
    if (size > length)
        return false;
    var result = false;
    var iterator = (function () {
        function iterator(from, level, indices) {
            if (level == 3) {
                //console.log(indices);
                if (check2(that[indices[0]], that[indices[1]]))
                    return;
            }
            if (level > size) {
                result = action(indices.map(function (index) { return that[index]; }));
                if (result)
                    return;
            }
            else {
                for (var i = from; i < length - size + level; i++) {
                    indices[level - 1] = i;
                    var next = indices.filter(function (value) { return true; });
                    new iterator(i + 1, level + 1, next);
                    if (result)
                        return;
                }
            }
        }
        return iterator;
    }());
    new iterator(0, 1, []);
    //console.log('result:', result);
    return result;
};
//# sourceMappingURL=geometry.js.map