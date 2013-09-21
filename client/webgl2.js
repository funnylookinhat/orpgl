

THREE.Euler = function ( x, y, z, order ) {

    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._order = order || THREE.Euler.DefaultOrder;

};

THREE.Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

THREE.Euler.DefaultOrder = 'XYZ';

THREE.Euler.prototype = {

    constructor: THREE.Euler,

    _x: 0, _y: 0, _z: 0, _order: THREE.Euler.DefaultOrder,

    _quaternion: undefined,

    _updateQuaternion: function () {

        if ( this._quaternion !== undefined ) {

            this._quaternion.setFromEuler( this, false );

        }

    },

    get x () {

        return this._x;

    },

    set x ( value ) {

        this._x = value;
        this._updateQuaternion();

    },

    get y () {

        return this._y;

    },

    set y ( value ) {

        this._y = value;
        this._updateQuaternion();

    },

    get z () {

        return this._z;

    },

    set z ( value ) {

        this._z = value;
        this._updateQuaternion();

    },

    get order () {

        return this._order;

    },

    set order ( value ) {

        this._order = value;
        this._updateQuaternion();

    },

    set: function ( x, y, z, order ) {

        this._x = x;
        this._y = y;
        this._z = z;
        this._order = order || this._order;

        this._updateQuaternion();

        return this;

    },

    copy: function ( euler ) {

        this._x = euler._x;
        this._y = euler._y;
        this._z = euler._z;
        this._order = euler._order;

        this._updateQuaternion();

        return this;

    },

    setFromRotationMatrix: function ( m, order ) {

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        // clamp, to handle numerical problems

        function clamp( x ) {

            return Math.min( Math.max( x, -1 ), 1 );

        }

        var te = m.elements;
        var m11 = te[0], m12 = te[4], m13 = te[8];
        var m21 = te[1], m22 = te[5], m23 = te[9];
        var m31 = te[2], m32 = te[6], m33 = te[10];

        order = order || this._order;

        if ( order === 'XYZ' ) {

            this._y = Math.asin( clamp( m13 ) );

            if ( Math.abs( m13 ) < 0.99999 ) {

                this._x = Math.atan2( - m23, m33 );
                this._z = Math.atan2( - m12, m11 );

            } else {

                this._x = Math.atan2( m32, m22 );
                this._z = 0;

            }

        } else if ( order === 'YXZ' ) {

            this._x = Math.asin( - clamp( m23 ) );

            if ( Math.abs( m23 ) < 0.99999 ) {

                this._y = Math.atan2( m13, m33 );
                this._z = Math.atan2( m21, m22 );

            } else {

                this._y = Math.atan2( - m31, m11 );
                this._z = 0;

            }

        } else if ( order === 'ZXY' ) {

            this._x = Math.asin( clamp( m32 ) );

            if ( Math.abs( m32 ) < 0.99999 ) {

                this._y = Math.atan2( - m31, m33 );
                this._z = Math.atan2( - m12, m22 );

            } else {

                this._y = 0;
                this._z = Math.atan2( m21, m11 );

            }

        } else if ( order === 'ZYX' ) {

            this._y = Math.asin( - clamp( m31 ) );

            if ( Math.abs( m31 ) < 0.99999 ) {

                this._x = Math.atan2( m32, m33 );
                this._z = Math.atan2( m21, m11 );

            } else {

                this._x = 0;
                this._z = Math.atan2( - m12, m22 );

            }

        } else if ( order === 'YZX' ) {

            this._z = Math.asin( clamp( m21 ) );

            if ( Math.abs( m21 ) < 0.99999 ) {

                this._x = Math.atan2( - m23, m22 );
                this._y = Math.atan2( - m31, m11 );

            } else {

                this._x = 0;
                this._y = Math.atan2( m13, m33 );

            }

        } else if ( order === 'XZY' ) {

            this._z = Math.asin( - clamp( m12 ) );

            if ( Math.abs( m12 ) < 0.99999 ) {

                this._x = Math.atan2( m32, m22 );
                this._y = Math.atan2( m13, m11 );

            } else {

                this._x = Math.atan2( - m23, m33 );
                this._y = 0;

            }

        } else {

            console.warn( 'WARNING: Euler.setFromRotationMatrix() given unsupported order: ' + order )

        }

        this._order = order;

        this._updateQuaternion();

        return this;

    },

    setFromQuaternion: function ( q, order, update ) {

        // q is assumed to be normalized

        // clamp, to handle numerical problems

        function clamp( x ) {

            return Math.min( Math.max( x, -1 ), 1 );

        }

        // http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m

        var sqx = q.x * q.x;
        var sqy = q.y * q.y;
        var sqz = q.z * q.z;
        var sqw = q.w * q.w;

        order = order || this._order;

        if ( order === 'XYZ' ) {

            this._x = Math.atan2( 2 * ( q.x * q.w - q.y * q.z ), ( sqw - sqx - sqy + sqz ) );
            this._y = Math.asin(  clamp( 2 * ( q.x * q.z + q.y * q.w ) ) );
            this._z = Math.atan2( 2 * ( q.z * q.w - q.x * q.y ), ( sqw + sqx - sqy - sqz ) );

        } else if ( order ===  'YXZ' ) {

            this._x = Math.asin(  clamp( 2 * ( q.x * q.w - q.y * q.z ) ) );
            this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.w ), ( sqw - sqx - sqy + sqz ) );
            this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqw - sqx + sqy - sqz ) );

        } else if ( order === 'ZXY' ) {

            this._x = Math.asin(  clamp( 2 * ( q.x * q.w + q.y * q.z ) ) );
            this._y = Math.atan2( 2 * ( q.y * q.w - q.z * q.x ), ( sqw - sqx - sqy + sqz ) );
            this._z = Math.atan2( 2 * ( q.z * q.w - q.x * q.y ), ( sqw - sqx + sqy - sqz ) );

        } else if ( order === 'ZYX' ) {

            this._x = Math.atan2( 2 * ( q.x * q.w + q.z * q.y ), ( sqw - sqx - sqy + sqz ) );
            this._y = Math.asin(  clamp( 2 * ( q.y * q.w - q.x * q.z ) ) );
            this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqw + sqx - sqy - sqz ) );

        } else if ( order === 'YZX' ) {

            this._x = Math.atan2( 2 * ( q.x * q.w - q.z * q.y ), ( sqw - sqx + sqy - sqz ) );
            this._y = Math.atan2( 2 * ( q.y * q.w - q.x * q.z ), ( sqw + sqx - sqy - sqz ) );
            this._z = Math.asin(  clamp( 2 * ( q.x * q.y + q.z * q.w ) ) );

        } else if ( order === 'XZY' ) {

            this._x = Math.atan2( 2 * ( q.x * q.w + q.y * q.z ), ( sqw - sqx + sqy - sqz ) );
            this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.w ), ( sqw + sqx - sqy - sqz ) );
            this._z = Math.asin(  clamp( 2 * ( q.z * q.w - q.x * q.y ) ) );

        } else {

            console.warn( 'WARNING: Euler.setFromQuaternion() given unsupported order: ' + order )

        }

        this._order = order;

        if ( update !== false ) this._updateQuaternion();

        return this;

    },

    reorder: function () {

        // WARNING: this discards revolution information -bhouston

        var q = new THREE.Quaternion();

        return function ( newOrder ) {

            q.setFromEuler( this );
            this.setFromQuaternion( q, newOrder );

        };


    }(),

    fromArray: function ( array ) {

        this._x = array[ 0 ];
        this._y = array[ 1 ];
        this._z = array[ 2 ];
        if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

        this._updateQuaternion();

        return this;

    },

    toArray: function () {

        return [ this._x, this._y, this._z, this._order ];

    },

    equals: function ( euler ) {

        return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

    },

    clone: function () {

        return new THREE.Euler( this._x, this._y, this._z, this._order );

    }

};

var yawObject,nh;

THREE.PointerLockControls = function ( camera ) {
console.log("YES");

    var scope = this;

    camera.rotation.set( 0, 0, 0 );

    var pitchObject = new THREE.Object3D();
    pitchObject.add( camera );

    yawObject = new THREE.Object3D();
    yawObject.position.y = 0;
    yawObject.add( pitchObject );

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;

    var isOnObject = false;
    var canJump = false;

    var velocity = new THREE.Vector3();

    var PI_2 = Math.PI / 2;

    var onMouseMove = function ( event ) {

        if ( scope.enabled === false ) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

    };

    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true; break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if ( canJump === true ) velocity.y += 10;
                canJump = false;
                break;

        }

    };

    var onKeyUp = function ( event ) {

        switch( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // a
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    this.enabled = true;

    this.getObject = function () {

        return yawObject;

    };

    this.isOnObject = function ( boolean ) {

        isOnObject = boolean;
        canJump = boolean;

    };

    this.getDirection = function() {

        // assumes the camera itself is not rotated

        var direction = new THREE.Vector3( 0, 0, -1 );
        var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

        return function( v ) {

            rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

            v.copy( direction ).applyEuler( rotation );

            return v;

        }

    }();

    this.update = function ( delta ) {

        if ( scope.enabled === false ) return;

        delta = 1;

        velocity.x += ( - velocity.x ) * 0.08 * delta;
        velocity.z += ( - velocity.z ) * 0.08 * delta;

        //velocity.y -= 0.025 * delta;

        if ( moveForward ) velocity.z -= 0.012 * delta;
        if ( moveBackward ) velocity.z += 0.012 * delta;

        if ( moveLeft ) velocity.x -= 0.012 * delta;
        if ( moveRight ) velocity.x += 0.012 * delta;

        yawObject.translateX( velocity.x );
        yawObject.translateZ( velocity.z );
        nh =getH(yawObject.position.x ,yawObject.position.z)+.5;
        if (yawObject.position.y < nh && (yawObject.position.y - nh) < -.01)
        yawObject.translateY( .1 )
        if (yawObject.position.y > nh && (yawObject.position.y - nh) > .01)
        yawObject.translateY( -.1 ); 
     console.log((nh - yawObject.position.y));

        checkPos(yawObject);

    };
};

 var Bird = function () {

    var scope = this;

    THREE.Geometry.call( this );

    v(   0.5,   0.0,   0.0 );
    v( - 0.5, - 0.2,   0.1 );
    v( - 0.5,   0.0,   0.0 );
    v( - 0.5, - 0.2, - 0.1 );

    v(   0.0,   0.2, - 0.6 );
    v(   0.0,   0.2,   0.6 );
    v(   0.2,   0.0,   0.0 );
    v( - 0.3,   0.0,   0.0 );

    f3( 0, 2, 1 );
    // f3( 0, 3, 2 );

    f3( 4, 7, 6 );
    f3( 5, 6, 7 );

    this.computeCentroids();
    this.computeFaceNormals();

    function v( x, y, z ) {

        scope.vertices.push( new THREE.Vector3( x, y, z ) );

    }

    function f3( a, b, c ) {

        scope.faces.push( new THREE.Face3( a, b, c ) );

    }

}

Bird.prototype = new THREE.Geometry();
Bird.prototype.constructor = Bird;

var Boid = function() {

                var vector = new THREE.Vector3(),
                _acceleration, _width = 500, _height = 500, _depth = 200, _goal, _neighborhoodRadius = 100,
                _maxSpeed = 4, _maxSteerForce = 0.1, _avoidWalls = false;

                this.position = new THREE.Vector3();
                this.velocity = new THREE.Vector3();
                _acceleration = new THREE.Vector3();

                this.setGoal = function ( target ) {

                    _goal = target;

                }

                this.setAvoidWalls = function ( value ) {

                    _avoidWalls = value;

                }

                this.setWorldSize = function ( width, height, depth ) {

                    _width = width;
                    _height = height;
                    _depth = depth;

                }

                this.run = function ( boids ) {

                    if ( _avoidWalls ) {

                        vector.set( - _width, this.position.y, this.position.z );
                        vector = this.avoid( vector );
                        vector.multiplyScalar( 5 );
                        _acceleration.addSelf( vector );

                        vector.set( _width, this.position.y, this.position.z );
                        vector = this.avoid( vector );
                        vector.multiplyScalar( 5 );
                        _acceleration.addSelf( vector );

                        vector.set( this.position.x, - _height, this.position.z );
                        vector = this.avoid( vector );
                        vector.multiplyScalar( 5 );
                        _acceleration.addSelf( vector );

                        vector.set( this.position.x, _height, this.position.z );
                        vector = this.avoid( vector );
                        vector.multiplyScalar( 5 );
                        _acceleration.addSelf( vector );

                        vector.set( this.position.x, this.position.y, - _depth );
                        vector = this.avoid( vector );
                        vector.multiplyScalar( 5 );
                        _acceleration.addSelf( vector );

                        vector.set( this.position.x, this.position.y, _depth );
                        vector = this.avoid( vector );
                        vector.multiplyScalar( 5 );
                        _acceleration.addSelf( vector );

                    }/* else {

                        this.checkBounds();

                    }
                    */

                    if ( Math.random() > 0.5 ) {

                        this.flock( boids );

                    }

                    this.move();

                }

                this.flock = function ( boids ) {

                    if ( _goal ) {

                        _acceleration.addSelf( this.reach( _goal, 0.005 ) );

                    }

                    _acceleration.addSelf( this.alignment( boids ) );
                    _acceleration.addSelf( this.cohesion( boids ) );
                    _acceleration.addSelf( this.separation( boids ) );

                }

                this.move = function () {

                    this.velocity.addSelf( _acceleration );

                    var l = this.velocity.length();

                    if ( l > _maxSpeed ) {

                        this.velocity.divideScalar( l / _maxSpeed );

                    }

                    this.position.addSelf( this.velocity );
                    _acceleration.set( 0, 0, 0 );

                }

                this.checkBounds = function () {

                    if ( this.position.x >   _width ) this.position.x = - _width;
                    if ( this.position.x < - _width ) this.position.x =   _width;
                    if ( this.position.y >   _height ) this.position.y = - _height;
                    if ( this.position.y < - _height ) this.position.y =  _height;
                    if ( this.position.z >  _depth ) this.position.z = - _depth;
                    if ( this.position.z < - _depth ) this.position.z =  _depth;

                }

                //

                this.avoid = function ( target ) {

                    var steer = new THREE.Vector3();

                    steer.copy( this.position );
                    steer.subVectors( this.position, target );

                    steer.multiplyScalar( 1 / this.position.distanceToSquared( target ) );

                    return steer;

                }

                this.repulse = function ( target ) {

                    var distance = this.position.distanceTo( target );

                    if ( distance < 150 ) {

                        var steer = new THREE.Vector3();

                        steer.subVectors( this.position, target );
                        steer.multiplyScalar( 0.5 / distance );

                        _acceleration.addSelf( steer );

                    }

                }

                this.reach = function ( target, amount ) {

                    var steer = new THREE.Vector3();

                    steer.subVectors( target, this.position );
                    steer.multiplyScalar( amount );

                    return steer;

                }

                this.alignment = function ( boids ) {

                    var boid, velSum = new THREE.Vector3(),
                    count = 0;

                    for ( var i = 0, il = boids.length; i < il; i++ ) {

                        if ( Math.random() > 0.6 ) continue;

                        boid = boids[ i ];

                        distance = boid.position.distanceTo( this.position );

                        if ( distance > 0 && distance <= _neighborhoodRadius ) {

                            velSum.add( this.position,boid.velocity );
                            count++;

                        }

                    }

                    if ( count > 0 ) {

                        velSum.divideScalar( count );

                        var l = velSum.length();

                        if ( l > _maxSteerForce ) {

                            velSum.divideScalar( l / _maxSteerForce );

                        }

                    }

                    return velSum;

                }

                this.cohesion = function ( boids ) {

                    var boid, distance,
                    posSum = new THREE.Vector3(),
                    steer = new THREE.Vector3(),
                    count = 0;

                    for ( var i = 0, il = boids.length; i < il; i ++ ) {

                        if ( Math.random() > 0.6 ) continue;

                        boid = boids[ i ];
                        distance = boid.position.distanceTo( this.position );

                        if ( distance > 0 && distance <= _neighborhoodRadius ) {

                            posSum.addSelf( boid.position );
                            count++;

                        }

                    }

                    if ( count > 0 ) {

                        posSum.divideScalar( count );

                    }

                    steer.subVectors( posSum, this.position );

                    var l = steer.length();

                    if ( l > _maxSteerForce ) {

                        steer.divideScalar( l / _maxSteerForce );

                    }

                    return steer;

                }

                this.separation = function ( boids ) {

                    var boid, distance,
                    posSum = new THREE.Vector3(),
                    repulse = new THREE.Vector3();

                    for ( var i = 0, il = boids.length; i < il; i ++ ) {

                        if ( Math.random() > 0.6 ) continue;

                        boid = boids[ i ];
                        distance = boid.position.distanceTo( this.position );

                        if ( distance > 0 && distance <= _neighborhoodRadius ) {

                            repulse.subVectors( this.position, boid.position );
                            repulse.normalize();
                            repulse.divideScalar( distance );
                            posSum.addSelf( repulse );

                        }

                    }

                    return posSum;

                }

            }
                   var ImprovedNoise = function () {

            var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
                 23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
                 174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
                 133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
                 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
                 202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
                 248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
                 178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
                 14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
                 93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

            for (var i=0; i < 256 ; i++) {

                p[256+i] = p[i];

            }

            function fade(t) {

                return t * t * t * (t * (t * 6 - 15) + 10);

            }

            function lerp(t, a, b) {

                return a + t * (b - a);

            }

            function grad(hash, x, y, z) {

                var h = hash & 15;
                var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
                return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);

            }

            return {

                noise: function (x, y, z) {

                    var floorX = ~~x, floorY = ~~y, floorZ = ~~z;

                    var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

                    x -= floorX;
                    y -= floorY;
                    z -= floorZ;

                    var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;

                    var u = fade(x), v = fade(y), w = fade(z);

                    var A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

                    return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), 
                                    grad(p[BA], xMinus1, y, z)),
                                lerp(u, grad(p[AB], x, yMinus1, z),
                                    grad(p[BB], xMinus1, yMinus1, z))),
                            lerp(v, lerp(u, grad(p[AA+1], x, y, zMinus1),
                                    grad(p[BA+1], xMinus1, y, z-1)),
                                lerp(u, grad(p[AB+1], x, yMinus1, zMinus1),
                                    grad(p[BB+1], xMinus1, yMinus1, zMinus1))));

                }
            }
        }

        var moveForward,moveLeft,moveBackward,moveRight,moveUp,moveDown = false;

        var onKeyDown = function ( event ) {

            //event.preventDefault();
            switch ( event.keyCode ) {

                case 38: /*up*/
                case 87: /*W*/ moveForward = true; break;

                case 37: /*left*/
                case 65: /*A*/ moveLeft = true; break;

                case 40: /*down*/
                case 83: /*S*/ moveBackward = true; break;

                case 39: /*right*/
                case 68: /*D*/ moveRight = true; break;

                case 82: /*R*/ this.moveUp = true; break;
                case 70: /*F*/ this.moveDown = true; break;

                case 81: /*Q*/ freeze = !this.freeze; break;

            }

        };

        var onKeyUp = function ( event ) {

            switch( event.keyCode ) {

                case 38: /*up*/
                case 87: /*W*/ moveForward = false; break;

                case 37: /*left*/
                case 65: /*A*/ moveLeft = false; break;

                case 40: /*down*/
                case 83: /*S*/ moveBackward = false; break;

                case 39: /*right*/
                case 68: /*D*/ moveRight = false; break;

                case 82: /*R*/ moveUp = false; break;
                case 70: /*F*/ moveDown = false; break;

            }

        };
        
        var attributesS6 = {
            displacement: {
                type: 'f', // a float
                value: [] // an empty array
            }
        };
        var attributesS7 = {
            displacement2: {
                type: 'f', // a float
                value: [] // an empty array
            }
        };
        var attributesS8 = {
            displacement3: {
                type: 'f', // a float
                value: [] // an empty array
            }
        };
        var attributesS9 = {
            displacement4: {
                type: 'f', // a float
                value: [] // an empty array
            }
        };
        var attributesS10 = {
            displacement5: {
                type: 'f', // a float
                value: [] // an empty array
            }
        };
        var attributesS11 = {
            displacement6: {
                type: 'f', // a float
                value: [] // an empty array
            }
        };
            
        // now populate the array of attributes
        var valuesS6 = attributesS6.displacement.value;
        // now populate the array of attributes
        var valuesS7 = attributesS7.displacement2.value;
        
        // now populate the array of attributes
        var valuesS8 = attributesS8.displacement3.value;
        
        // now populate the array of attributes
        var valuesS9 = attributesS9.displacement4.value;
        
        // now populate the array of attributes
        var valuesS10 = attributesS10.displacement5.value;
        
        // now populate the array of attributes
        var valuesS11 = attributesS11.displacement6.value;
        
        for(var v = 0; v < 128; v++) {
            valuesS6.push(Math.random() * 30);
        }
        for(var v = 0; v < 128; v++) {
            valuesS7.push(Math.random() * 30);
        }
        for(var v = 0; v < 128; v++) {
            valuesS8.push(Math.random() * 30);
        }
        for(var v = 0; v < 128; v++) {
            valuesS9.push(Math.random() * 30);
        }
        for(var v = 0; v < 128; v++) {
            valuesS10.push(Math.random() * 30);
        }
        for(var v = 0; v < 128; v++) {
            valuesS11.push(Math.random() * 30);
        }
        
        var uniformsS6 = {
            amplitude: {
                type: 'f', // a float
                value: 0
            }
        };
        var uniformsS7 = {
            amplitude2: {
                type: 'f', // a float
                value: 0
            }
        };
        var uniformsS8 = {
            amplitude3: {
                type: 'f', // a float
                value: 0
            }
        };
        var uniformsS9 = {
            amplitude4: {
                type: 'f', // a float
                value: 0
            }
        };
        var uniformsS10 = {
            amplitude5: {
                type: 'f', // a float
                value: 0
            }
        };
        var uniformsS11 = {
            amplitude6: {
                type: 'f', // a float
                value: 0
            }
        };
        
        var heights = {};

        function getH(x,y){
            x=Math.floor(x);
            y=Math.floor(y);
            if (heights[x] != undefined)
                if (heights[x][y] != undefined)
                    return heights[x][y];
            return 0;
        }
        var container;
        var ground;
        var camera, scene, renderer, objects;
        var particleLight, pointLight,birds, bird;

            var boid, boids;


        var clock = new THREE.Clock();
        var morphs = [];

        var sprite1,uniforms=null;
        var sprite2=null;
        var sprite3=null;
        var sprite4=null;
        var sprite5=null;
        var sprite6=null;
        var myPos = { 'x':0,'y':1,'z':0};
        var sphere = null;
        var android = null;
    

        var camera, scene, renderer;
        var geometry, material, mesh;
        var controls,time = Date.now();

        var objects = [];

        var ray;

        var blocker = document.getElementById( 'blocker' );
        var instructions = document.getElementById( 'instructions' );


        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

        if ( havePointerLock ) {

            var element = document.body;

            var pointerlockchange = function ( event ) {

                    controls.enabled = true;

            }

            var pointerlockerror = function ( event ) {
            }

            // Hook pointer lock state change events
            document.addEventListener( 'pointerlockchange', pointerlockchange, false );
            document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
            document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

            document.addEventListener( 'pointerlockerror', pointerlockerror, false );
            document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
            document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );


            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.webkitRequestPointerLock();

        } else {
            alert('Your browser doesn\'t seem to support Pointer Lock API');
        }

var grassMesh, grassGeometry, grassMaterial;
            var grassCount = 50000;

            function generateRandomGrassLeaf( material ) {
                var geometry = new THREE.Geometry(),
                    dir = (Math.random() > 0.5) ? 1.0 : -1.0,
                    offset = Math.random() * 0.5 + 0.2,
                    factor = Math.random() * 2 + 1;
                geometry.vertices.push( new THREE.Vector3(   0, 0, dir * factor * Math.pow( offset, 5 ) ) );
                geometry.vertices.push( new THREE.Vector3(   1, 0, dir * factor * Math.pow( offset, 5 ) ) );
                geometry.vertices.push( new THREE.Vector3( 0.1, 1, dir * factor * Math.pow( offset, 4 ) ) );
                geometry.vertices.push( new THREE.Vector3( 0.8, 2, dir * factor * Math.pow( offset, 3 ) ) );
                geometry.vertices.push( new THREE.Vector3( 0.3, 3, dir * factor * Math.pow( offset, 2 ) ) );
                geometry.vertices.push( new THREE.Vector3( 0.5, 4, dir * factor * Math.pow( offset, 1 ) ) );
                geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
                geometry.faces.push( new THREE.Face3( 1, 3, 2 ) );
                geometry.faces.push( new THREE.Face3( 2, 3, 4 ) );
                geometry.faces.push( new THREE.Face3( 3, 5, 4 ) );
                function generateGrassColor() {
                    return new THREE.Color().setRGB( Math.random() * 0.1 + 0.1, Math.random() * 0.5 + offset - 0.3, Math.random() * 0.2 + 0.1 );
                }
                geometry.faces[0].vertexColors[0] = generateGrassColor();
                geometry.faces[0].vertexColors[1] = generateGrassColor();
                geometry.faces[0].vertexColors[2] = generateGrassColor();
                geometry.faces[1].vertexColors[0] = geometry.faces[0].vertexColors[1];
                geometry.faces[1].vertexColors[1] = generateGrassColor();
                geometry.faces[1].vertexColors[2] = geometry.faces[0].vertexColors[2];
                geometry.faces[2].vertexColors[0] = geometry.faces[1].vertexColors[2];
                geometry.faces[2].vertexColors[1] = geometry.faces[1].vertexColors[1];
                geometry.faces[2].vertexColors[2] = generateGrassColor();
                geometry.faces[3].vertexColors[0] = geometry.faces[2].vertexColors[1]
                geometry.faces[3].vertexColors[1] = generateGrassColor();
                geometry.faces[3].vertexColors[2] = geometry.faces[2].vertexColors[2];
                
                var mesh = new THREE.Mesh( geometry, material );
                mesh.scale.set(0.3, Math.random() * 0.3 + 0.3, 0.3);
                mesh.position.x = Math.round(Math.random() * 240-120);
                mesh.position.z = Math.round(Math.random() * 240-120);
                var i=0;
                var h = 0;
                h = getH(mesh.position.x ,mesh.position.z)-0.5;
                if (h<10&&h>-3) {
                
                   mesh.scale.set(0.1, Math.random() * 0.1 + 0.1, 0.1);                
                }
                else if (h<-5) {

                }
                else {h=-1000}
                mesh.position.y = h;
                mesh.rotation.y = Math.random();
                return mesh;
            }
        init();
        animate();
        composer.render(0.05);

function loadtrees(loader,branchfactor,levels,leafsprite,iduni,idxstart,idxend,amplitude,previousRender,attributes,displacement,seed,segments,vMultiplier,twigScale,initalBranchLength,lengthFalloffFactor,lengthFalloffPower,clumpMax,clumpMin){

    url = 'http://localhost:8080/tree?leaves=0&levels='+levels+'&branchfactor='+branchfactor
    if (seed != undefined) {
        url+='&seed='+seed+'&segments='+segments+'&vMultiplier='+vMultiplier+'&twigScale='+twigScale
    }
    //+'&initalBranchLength='+initalBranchLength+'&lengthFalloffFactor='+lengthFalloffFactor+'&lengthFalloffPower='+lengthFalloffPower+'&clumpMax='+clumpMax+'&clumpMin='+clumpMin

    c = loader.load( url, function ( geometry, materials ) {
        var material = materials[ 0 ];
        material.color.setHex( 0xffffff );
        material.ambient.setHex( 0xffffff );
        var faceMaterial = new THREE.MeshFaceMaterial( materials );

        for ( var i = idxstart; i < idxend; i ++ ) {
            var x = naturePos[0][i];
            var z = naturePos[1][i];

            morph = new THREE.Mesh( geometry, faceMaterial );
            var s = THREE.Math.randFloat( 0.00075, 0.001 );
            morph.scale.set( s, s, s );
            morph.name="tree"
            morph.position.set( x, getH(x,z)-0.5, z );
            morph.rotation.y = THREE.Math.randFloat( -0.25, 0.25 );

            scene.add( morph );
            morphs.push( morph );

        }

    });
    url = 'http://localhost:8080/tree?leaves=1&levels='+levels+'&branchfactor='+branchfactor
    if (seed != undefined)
    url+='&seed='+seed+'&segments='+segments+'&vMultiplier='+vMultiplier+'&twigScale='+twigScale
    //+'&initalBranchLength='+initalBranchLength+'&lengthFalloffFactor='+lengthFalloffFactor+'&lengthFalloffPower='+lengthFalloffPower+'&clumpMax='+clumpMax+'&clumpMin='+clumpMin
    loader.load( url, function ( geometry, materials ) {
        var material = materials[ 0 ];
        material.color.setHex( 0xffffff );
        material.ambient.setHex( 0xffffff );
        material.alp
        haTest = 0.5;

var materialr = new THREE.MeshLambertMaterial({
        map: sprite1,opacity: 0.9, transparent: true , depthWrite: false, depthTest: true
      });
        var faceMaterial = new THREE.MeshFaceMaterial( materials );

        for ( var i = idxstart; i < idxend; i ++ ) {

            var x = naturePos[0][i];
            var z = naturePos[1][i];

            Shaders = {
                LitAttributeAnimated: {
                    'vertex': ["varying vec2 glTexCoord;",
            "uniform float "+amplitude+";",
                               "attribute float "+displacement+";", 
                               "varying vec3 vNormal;",
                        "void main() {",
                         "  glTexCoord = uv;",
                                "vNormal = normal;",
                                "vec3 newPosition = position + normal * vec3( "+amplitude+" );",
                          "  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );",
                        "}"



                        ].join("\n"),
                               
                    'fragment': [           "varying vec2 glTexCoord;",

                       "uniform sampler2D "+leafsprite+";",
                       "uniform sampler2D "+previousRender+";",

                       "void main() {",

                       "    vec3 color = texture2D( "+leafsprite+", glTexCoord ).rgb;",
                    "    gl_FragColor.rgb = color;",   
                    "if (gl_FragColor.g < 0.1)",
                    "    discard;",
                               "}"].join("\n")
                }
            };

            var shaderMaterial = new THREE.ShaderMaterial({
                attributes:     attributes,
                        uniforms: camera.uniforms[iduni],
                vertexShader:   Shaders.LitAttributeAnimated.vertex,
                fragmentShader: Shaders.LitAttributeAnimated.fragment,
                fog:true
            });
            

            morph2 = new THREE.Mesh( geometry, materialr );

            var s = THREE.Math.randFloat( 0.00075, 0.001 );
            morph2.scale.set( s, s, s );
            morph2.name="tree"
            
            morph2.position.set( x, getH(x,z)-0.5, z );
            morph2.rotation.y = THREE.Math.randFloat( -0.25, 0.25 );
            scene.add( morph2 );
            morphs.push( morph2 );

        }

    } );
}

function funcdt() {     
    var loader = new THREE.JSONLoader();
    loadtrees(loader,3.4,5,'sprite1',1,0,199,"amplitude","previousRender",attributesS6,"displacement"   );
        loadtrees(loader,3.4,5,'sprite1',1,200,399,"amplitude","previousRender",attributesS6,"displacement",10,10,3,1);
    loadtrees(loader,6,20,'sprite2',2,400,500,"amplitude2","previousRender2",attributesS7,"displacement2");
}
var composer, dpr, effectFXAA, renderScene;
function init() {

    sprite1 = THREE.ImageUtils.loadTexture( "branch1.png", null );
    sprite2 = THREE.ImageUtils.loadTexture( "branch2.png", null );
    sprite3 = THREE.ImageUtils.loadTexture( "branch3.png", null );
    sprite4 = THREE.ImageUtils.loadTexture( "branch4.png", null );
    sprite5 = THREE.ImageUtils.loadTexture( "branch5.png", null );
    sprite6 = THREE.ImageUtils.loadTexture( "branch6.png", null );
   
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 2000 );

    camera.position.set( myPos.x,myPos.y,myPos.z);
     scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xB4E4F4, 0.0025 );
    
camera.uniforms=new Array();
    camera.uniforms[1]=  {
              sprite1: { type: "t", value: sprite1 },
                previousRender: { type: "t", value: null },
                amplitude: {
                    type: 'f', // a float
                    value: 0
                },
                    
    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    offset:      { type: "f", value: 33 },
    exponent:    { type: "f", value: 0.6 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },fogDensity:      { type: "f", value: 100 }
            };
    camera.uniforms[2]=  {
                sprite2: { type: "t", value: sprite2 },
                previousRender2: { type: "t", value: null },
                amplitude2: {
                    type: 'f', // a float
                    value: 0
                },
                    
    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    offset:      { type: "f", value: 33 },
    exponent:    { type: "f", value: 0.6 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },fogDensity:      { type: "f", value: 100 }
            }; camera.uniforms[3]=  {
                sprite3: { type: "t", value: sprite3 },
                previousRender3: { type: "t", value: null },
                amplitude3: {
                    type: 'f', // a float
                    value: 0
                },
                    
    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    offset:      { type: "f", value: 33 },
    exponent:    { type: "f", value: 0.6 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },fogDensity:      { type: "f", value: 100 }
            }; camera.uniforms[4]=  {
                sprite4: { type: "t", value: sprite4 },
                previousRender4: { type: "t", value: null },
                amplitude4: {
                    type: 'f', // a float
                    value: 0
                },
                    
    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    offset:      { type: "f", value: 33 },
    exponent:    { type: "f", value: 0.6 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },fogDensity:      { type: "f", value: 100 }
            }; camera.uniforms[5]=  {
                sprite5: { type: "t", value: sprite5 },
                previousRender5: { type: "t", value: null },
                amplitude5: {
                    type: 'f', // a float
                    value: 0
                },
                    
    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    offset:      { type: "f", value: 33 },
    exponent:    { type: "f", value: 0.6 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },fogDensity:      { type: "f", value: 100 }
            }; camera.uniforms[6]=  {
                sprite6: { type: "t", value: sprite6 },
                previousRender6: { type: "t", value: null },
                amplitude6: {
                    type: 'f', // a float
                    value: 0
                },
                    
    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    offset:      { type: "f", value: 33 },
    exponent:    { type: "f", value: 0.6 },
    fogColor:    { type: "c", value: scene.fog.color },
    fogNear:     { type: "f", value: scene.fog.near },
    fogFar:      { type: "f", value: scene.fog.far },fogDensity:      { type: "f", value: 100 }
            };
   

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );



dpr = 1;
if (window.devicePixelRatio !== undefined) {
  dpr = window.devicePixelRatio;
}

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(new THREE.Color(0xB4E4F4));
var renderModel = new THREE.RenderPass( scene, camera );
                var effectBloom = new THREE.BloomPass( 1 );
//                var effectBloom = new THREE.BloomPass( 1, 25, 16, 128 );

                effectBloom.clear = true;
                var effectCopy = new THREE.ShaderPass( THREE.CopyShader );

                effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );

                var width = window.innerWidth || 2;
                var height = window.innerHeight || 2;

                effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );

                effectCopy.renderToScreen = true;

                composer = new THREE.EffectComposer( renderer );

                composer.addPass( renderModel );
                composer.addPass( effectFXAA );
                //composer.addPass( effectBloom );
                composer.addPass( effectCopy );
/*renderScene = new THREE.RenderPass(scene, camera);
effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
effectFXAA.uniforms['resolution'].value.set(1 / (window.innerWidth * dpr), 1 / (window.innerHeight * dpr));
effectFXAA.renderToScreen = true;

composer = new THREE.EffectComposer(renderer);
composer.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
composer.addPass(renderScene);
composer.addPass(effectFXAA);
*/
/*

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

    birds = [];
    boids = [];

    for ( var i = 0; i < 1; i ++ ) {

        boid = boids[ i ] = new Boid();
        boid.position.x = Math.random() * 400 - 200;
        boid.position.y = 0;
        boid.position.z = Math.random() * 400 - 200;
        boid.velocity.x = Math.random() * 2 - 1;
        boid.velocity.y = Math.random() * 2 - 1;
        boid.velocity.z = Math.random() * 2 - 1;
        boid.setAvoidWalls( true );
        boid.setWorldSize( 30, 30, 30 );

        bird = birds[ i ] = new THREE.Mesh( new Bird(), new THREE.MeshBasicMaterial( { color:Math.random() * 0xffffff } ) );
        bird.phase = Math.floor( Math.random() * 62.83 );
        bird.position = boids[ i ].position;
        bird.doubleSided = true;
        // bird.scale.x = bird.scale.y = bird.scale.z = 10;
        scene.add( bird );


    }*/
// set up the sphere vars
    var radius = 5,
    segments = 16,
    rings = 16;
    var sungeo =new THREE.SphereGeometry(
    radius,
    segments,
    rings);

    sungeo.x=0;
    sungeo.y=0;
    sungeo.z=0;
    // create the sphere's material
    var sphereMaterial =
    new THREE.MeshLambertMaterial(
    {
      color: 0xCC0000
    });

    sphere = new THREE.Mesh(

    sungeo,

    sphereMaterial);

    // add the sphere to the scene
    //scene.add(sphere);
    var jsonLoader = new THREE.JSONLoader();
    jsonLoader.load( "android.js", addModelToScene );


    function addModelToScene( geometry, materials ) 
    {
        // for preparing animation
        for (var i = 0; i < materials.length; i++)
            materials[i].morphTargets = true;
            
        var material = new THREE.MeshFaceMaterial( materials );
        android = new THREE.Mesh( geometry, material );
        android.scale.set(.1,.1,.1);
        android.position.y = getH(0 ,0);
        scene.add( android );
    }
    var waterWidth = 1024, waterDepth = 1024;
    var worldWidth = 256, worldDepth = 256,
    data = groundGeometry;


    var geometry = new THREE.PlaneGeometry( 256, 256, worldWidth - 1, worldDepth - 1 );
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

        geometry.vertices[ i ].x =geometry.vertices[ i ].x;
        geometry.vertices[ i ].z =geometry.vertices[ i ].z;
        geometry.vertices[ i ].y = data[ i ]/5-10;
        
        if (heights[Math.floor(geometry.vertices[ i ].x)] == undefined)
        heights[""+Math.floor(geometry.vertices[ i ].x)] = {};
        heights[""+Math.floor(geometry.vertices[ i ].x)][""+Math.floor(geometry.vertices[ i ].z)]=geometry.vertices[ i ].y;
    
    }

grassMaterial = new THREE.MeshBasicMaterial( { shading: THREE.FlatShading, vertexColors: THREE.VertexColors, side: THREE.DoubleSide } );
                grassGeometry = new THREE.Geometry();
                for ( var i = 0, l = grassCount; i < l; i++ ) {
                    THREE.GeometryUtils.merge(grassGeometry, generateRandomGrassLeaf( grassMaterial ) );
                }
                grassMesh = new THREE.Mesh( grassGeometry, grassMaterial );
                scene.add(grassMesh);
    var floorTexture = new THREE.ImageUtils.loadTexture( 'texture.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
    floorTexture.repeat.set( 5, 5 );

    ground = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial(
                                                                    {
                                                                    "map": floorTexture
                                                                    }));
    scene.add( ground );
    setTimeout(funcdt, 1000);

    scene.add( new THREE.AmbientLight( 0xffffff ) );
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

}


function generateTexture( data, width, height ) {

    var canvas, canvasScaled, context, image, imageData,
    level, diff, vector3, sun, shade;

    vector3 = new THREE.Vector3( 0, 0, 0 );

    sun = new THREE.Vector3( 1, 1, 1 );
    sun.normalize();

    canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext( '2d' );
    context.fillStyle = '#000';
    context.fillRect( 0, 0, width, height );

    image = context.getImageData( 0, 0, canvas.width, canvas.height );
    imageData = image.data;

    for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = 2;
        vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.normalize();

        shade = vector3.dot( sun );

        imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
    }
}

function onWindowResize( event ) {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}


    var t = 0;
    function animate() {

        requestAnimationFrame( animate );

        if ( t > 30 ) t = 0;

        var delta = clock.getDelta();
for ( var i = 0, il = grassGeometry.vertices.length / 2 - 1; i <= il; i ++ ) {
                    for ( var j = 0, jl = 2, f = (il - i) / il; j < jl; j++ ) {
                        //grassGeometry.vertices[ jl * i + j ].z = f * Math.sin(time) / 200
                    }
                }

                grassGeometry.verticesNeedUpdate = true;
        if (don==false && morphs.length>0) dod();
        

        controls.update( Date.now() - time );
        //time = Date.now() - time ;
        render();
        
    }
    function dod(){

    //    RAYCASTS (to the ground)
    /*
        for (var i = 0 ; i<scene.children.length;i++){
    if(scene.children[i].name=="tree") {
          var raycaster = new THREE.Raycaster(scene.children[i].position,new THREE.Vector3( 0, -100000, 0 ));
            var intersects = raycaster.intersectObjects(scene.children);
    //        console.log(intersects[0].distance)
            if (intersects.length>0)
            scene.children[i].position.y= -intersects[0].distance;
    }
        }
    */

            don=true;
    }
    var don=false;
    var movementSpeed = 0.3;
    var frame=0;
    function replacer(key, value) {
        if (typeof value === 'number' && !isFinite(value)) {
            return String(value);
        }
        return value;
    }

function checkPos(camera){
    var willsend=false;
    if ((Math.floor(camera.position.x)<myPos.x) || (Math.floor(camera.position.x)>myPos.x)){
        myPos.x=Math.floor(camera.position.x);
        willsend=true;
    }
        if ((Math.floor(camera.position.y)<myPos.y) || (Math.floor(camera.position.y)>myPos.y)){
            myPos.y=Math.floor(camera.position.y);
            willsend=true;
    }
        if ((Math.floor(camera.position.z)<myPos.z) || (Math.floor(camera.position.z)>myPos.z)){
            myPos.z=Math.floor(camera.position.z);
            willsend=true;
    }
    if (willsend == true)
        send(JSON.stringify(myPos,replacer));
}

var lastpos=null;

function render() {
    var xc,yc,zc=0;
    for (var prop in myJSONUserPosArray2) {
            var tt = JSON.parse(myJSONUserPosArray2[prop])
        if ((    lastpos!=myJSONUserPosArray2[prop]) && (prop !=CONFIG.nick)) {
            for (var prop2 in tt) {
            if (prop2='x')
                xc=tt[prop2];
            if (prop2='y')
                yc=tt[prop2];
            if (prop2='z')
                zc=tt[prop2];
            }
            android.position.x=xc;
            android.position.y=yc;
            android.position.z=zc;
        }
        lastpos=myJSONUserPosArray2[prop]

    }
/*
    for ( var i = 0, il = birds.length; i < il; i++ ) {

        boid = boids[ i ];
        boid.run( boids );

        bird = birds[ i ];

        color = bird.material.color;
        color.r = color.g = color.b = ( 500 - bird.position.z ) / 1000;

        bird.rotation.y = Math.atan2( - boid.velocity.z, boid.velocity.x );
        bird.rotation.z = Math.asin( boid.velocity.y / boid.velocity.length() );

        bird.phase = ( bird.phase + ( Math.max( 0, bird.rotation.z ) + 0.1 )  ) % 62.83;
        bird.geometry.vertices[ 5 ].x = bird.geometry.vertices[ 4 ].x = Math.sin( bird.phase ) * 5;

    }
*/
    camera.uniforms[1].amplitude.value = 3*Math.sin(frame)+Math.cos(frame);
    camera.uniforms[2].amplitude2.value = 3*Math.sin(frame)+Math.cos(frame);
    camera.uniforms[3].amplitude3.value = 3*Math.sin(frame)+Math.cos(frame);
    camera.uniforms[4].amplitude4.value = 3*Math.sin(frame)+Math.cos(frame);
    camera.uniforms[5].amplitude5.value = 3*Math.sin(frame)+Math.cos(frame);
    camera.uniforms[6].amplitude6.value = 3*Math.sin(frame)+Math.cos(frame);
    frame += 0.04;
/*    var antialias = gl.getContextAttributes().antialias;

var size = gl.getParameter(gl.SAMPLES);
alert(size);
*/
                renderer.clear();
                composer.render();

//    renderer.render( scene, camera );

}


