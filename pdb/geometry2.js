var PolyhedronBuilder2 = (function () {
    function PolyhedronBuilder2(center, atomRadius, waterRadius, options) {
        var _this = this;
        this.Surfaces = [];
        this.TrySubtract = function (subtractAtomPosition, subtractAtomRadius) {
            var sur = DirectionalSurface3D2.TryGetDirectionalSurface(_this.AtomRadius, subtractAtomPosition.subtract(_this.Center), subtractAtomRadius, _this.WaterRadius, _this.options);
            if (sur)
                _this.Surfaces.push(sur);
        };
        this.IsEmpty = function (isDebugging) {
            //var Vertices: Vector3D[] = [];
            //var count = 0;
            var point = _this.Surfaces.someCombinationCheck2(3, function (item1, item2) { return Edge.isOutOfBox(item1, item2, _this.boxUnit); }, function (com) {
                var p = Vertex.TryGetVertex(com[0], com[1], com[2]);
                if (p) {
                    if ((Math.abs(p.x) <= (_this.boxUnit)) && (Math.abs(p.y) <= (_this.boxUnit)) && (Math.abs(p.z) <= (_this.boxUnit)) && (p.length >= _this.boxUnit)) {
                        if (_this.Surfaces.every(function (surf) {
                            if (com.indexOf(surf) > -1)
                                return true;
                            return surf.IsPositive(p);
                        }))
                            return p;
                    }
                }
                return false;
            });
            //theoreticall we should be able to make a 'water molecule' at the position of the point;
            //here we check if that's correct:
            if (point)
                _this.FoundPoint = point;
            //if (isDebugging && point) {
            //    console.log('point: ', point);
            //    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>Point to Center > Radius: ', point.length > this.Radius, point.length, this.Radius);
            //    this.Surfaces.every((surface) => {
            //        if (!surface.AtomCenter) return true;
            //        var dis = point.subtract(surface.AtomCenter);
            //        var result = dis.length >= surface.AtomRadius;
            //        //console.log('Point to Atom > Radius: ', result, dis.length, surface.AtomRadius, surface.AtomCenter);
            //        //console.log(dis);
            //        return result;
            //    });
            //}
            return !point;
            //return count == 0;
        };
        this.Center = center;
        this.AtomRadius = atomRadius;
        this.WaterRadius = waterRadius;
        this.boxUnit = atomRadius * options.centerAtomFactor + waterRadius;
        var boxUnit = this.boxUnit;
        this.options = options;
        this.Surfaces.push(set(new DirectionalSurface3D2(), function (ds) {
            ds.X = 1.0;
            ds.Y = 0.0;
            ds.Z = 0.0;
            ds.C = boxUnit;
            ds.Origin = ds.multiplyAsVector3D(boxUnit);
            ds.Direction = ds.multiplyAsVector3D(-1);
        }), set(new DirectionalSurface3D2(), function (ds) {
            ds.X = -1.0;
            ds.Y = 0.0;
            ds.Z = 0.0;
            ds.C = boxUnit;
            ds.Origin = ds.multiplyAsVector3D(boxUnit);
            ds.Direction = ds.multiplyAsVector3D(-1);
        }), set(new DirectionalSurface3D2(), function (ds) {
            ds.X = 0.0;
            ds.Y = 1.0;
            ds.Z = 0.0;
            ds.C = boxUnit;
            ds.Origin = ds.multiplyAsVector3D(boxUnit);
            ds.Direction = ds.multiplyAsVector3D(-1);
        }), set(new DirectionalSurface3D2(), function (ds) {
            ds.X = 0.0;
            ds.Y = -1.0;
            ds.Z = 0.0;
            ds.C = boxUnit;
            ds.Origin = ds.multiplyAsVector3D(boxUnit);
            ds.Direction = ds.multiplyAsVector3D(-1);
        }), set(new DirectionalSurface3D2(), function (ds) {
            ds.X = 0.0;
            ds.Y = 0.0;
            ds.Z = 1.0;
            ds.C = boxUnit;
            ds.Origin = ds.multiplyAsVector3D(boxUnit);
            ds.Direction = ds.multiplyAsVector3D(-1);
        }), set(new DirectionalSurface3D2(), function (ds) {
            ds.X = 0.0;
            ds.Y = 0.0;
            ds.Z = -1.0;
            ds.C = boxUnit;
            ds.Origin = ds.multiplyAsVector3D(boxUnit);
            ds.Direction = ds.multiplyAsVector3D(-1);
        }));
    }
    PolyhedronBuilder2.prototype.toString = function () {
        var lines = [];
        lines.push('PolyhedronBuilder Start:\r\n');
        lines.push('Center,' + this.Center.toString() + '\r\n');
        lines.push('Radius,' + this.AtomRadius + '\r\n');
        this.Surfaces.forEach(function (surface) { return lines.push(surface.toString() + '\r\n'); });
        lines.push('End PolyhedronBuilder\r\n');
        return lines.join('');
    };
    PolyhedronBuilder2.Zero = new Vector3D();
    return PolyhedronBuilder2;
}());
var DirectionalSurface3D2 = (function () {
    function DirectionalSurface3D2() {
        var _this = this;
        /*
         * This calculates the direct of the shared edge
         */
        this.orthogonalWith = function (that) {
            var both = new Vector3D(_this.Y * that.Z - _this.Z * that.Y, _this.Z * that.X - _this.X * that.Z, _this.X * that.Y - _this.Y * that.X);
            var bLength = both.length;
            if (bLength == 0)
                throw 'host and target vectors are in the same direction.';
            both.divide(bLength);
            return both;
        };
    }
    /**
     * Determine if the point is a convex vectex.
     * @param TestPoint
     */
    DirectionalSurface3D2.prototype.IsPositive = function (TestPoint) {
        var left = this.Direction.x * TestPoint.x + this.Direction.y * TestPoint.y + this.Direction.z * TestPoint.z;
        var right = this.Direction.x * this.Origin.x + this.Direction.y * this.Origin.y + this.Direction.z * this.Origin.z;
        var result = left >= right;
        //console.log('IsPositive:', result, left, right, this);
        return result;
        //return this.Direction.x * TestPoint.x + this.Direction.y * TestPoint.y + this.Direction.z * TestPoint.z >=
        //    this.Direction.x * this.Origin.x + this.Direction.y * this.Origin.y + this.Direction.z * this.Origin.z;
        //return this.Direction.x * (TestPoint.x - this.Origin.x) + this.Direction.y * (TestPoint.y - this.Origin.y) + this.Direction.z * (TestPoint.z - this.Origin.z) >= 0.0;
    };
    DirectionalSurface3D2.TryGetDirectionalSurface = function (CenterAtomRadius, DisplacementToCenterAtom, SubtractAtomRadius, WaterRadius, options) {
        //console.log('TryGetDirectionalSurface', SubtractCenter, SubtractRadius);
        //we assume the origin is zero;
        //from (x^2 + y^2 + z^2 == r^2 and (x-px)^2 + (y-py)^2 + (z-pz)^2 ==R^2) 
        //we can get 2*px*x + 2*py*y + 2*pz*z == px^2 + py^2 + pz^2 + r^2 - R^2
        //therefore 
        var CenterRadius = CenterAtomRadius * options.subtractAtomFactor + WaterRadius;
        var SubtractRadius = SubtractAtomRadius * options.subtractAtomFactor + WaterRadius;
        var pXYZsquare = DisplacementToCenterAtom.lengthSquared;
        if (pXYZsquare == 0)
            throw 'overlapping atom';
        //var dis = SubtractCenter.multiplyBy(-1);;
        if (DisplacementToCenterAtom.length > CenterRadius + SubtractRadius)
            return null;
        var ds3D = new DirectionalSurface3D2();
        ds3D.X = 2.0 * DisplacementToCenterAtom.x;
        ds3D.Y = 2.0 * DisplacementToCenterAtom.y;
        ds3D.Z = 2.0 * DisplacementToCenterAtom.z;
        ds3D.C = pXYZsquare + CenterRadius * CenterRadius - SubtractRadius * SubtractRadius;
        ds3D.AtomCenter = DisplacementToCenterAtom;
        ds3D.AtomRadius = SubtractAtomRadius;
        // then the center of the surface (crossed by the line from Zero to the Subtract point has a common factor:
        // (px^2 + py^2 + pz^2 + r^2 - R^2)/(2 * (px^2 + py^2 + pz^2))
        var CrossPointFactor = ds3D.C / 2 / pXYZsquare;
        ds3D.Factor = CrossPointFactor;
        // {px, py, pz} * CrossPointFactor is the CrossPoint
        ds3D.Origin = DisplacementToCenterAtom.multiplyBy(CrossPointFactor);
        //Make the direction facing to the Origin (Zero);
        ds3D.Direction = DisplacementToCenterAtom.multiplyBy(-1);
        return ds3D;
    };
    DirectionalSurface3D2.prototype.isInSurface = function (point) {
        return Math.abs(point.x * this.X + point.y * this.Y + point.z * this.Z - this.C) < 1e-10;
    };
    DirectionalSurface3D2.prototype.toString = function () {
        return this.X + ',' + this.Y + ',' + this.Z + ',' + this.C + ',' + this.Origin.toString() + ',' + this.Direction.toString();
    };
    DirectionalSurface3D2.prototype.multiplyAsVector3D = function (multiplier) {
        return new Vector3D(this.X * multiplier, this.Y * multiplier, this.Z * multiplier);
    };
    return DirectionalSurface3D2;
}());
//# sourceMappingURL=geometry2.js.map