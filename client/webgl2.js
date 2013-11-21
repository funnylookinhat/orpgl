   

    'use strict';
    
    Physijs.scripts.worker = 'physijs_worker.js';
    Physijs.scripts.ammo = 'ammo.js';
  
    var frustum, clock, initScene, render, _boxes = [], spawnBox,
        renderer, render_stats, physics_stats, scene, ground_material, ground, light, camera,customUniforms2;
////    
var composer, dpr, effectFXAA, renderScene;
var t = 0;
  
var don=false;
var movementSpeed = 0.3;
var frame=0;
var lastposs=new Array();

  function loadTriangleMeshToVBO( triangleMesh, mat) {

    var triangles = triangleMesh.geometry.faces.length;

    var geometry = new THREE.BufferGeometry();
    geometry.attributes = {
      index: {
        itemSize: 1,
        array: new Int16Array( triangles * 3 ),
        numItems: triangles * 3
      },
      position: {
        itemSize: 3,
        array: new Float32Array( triangles * 3 * 3 ),
        numItems: triangles * 3 * 3
      },
      normal: {
        itemSize: 3,
        array: new Float32Array( triangles * 3 * 3 ),
        numItems: triangles * 3 * 3
      },
      color: {
        itemSize: 3,
        array: new Float32Array( triangles * 3 * 3 ),
        numItems: triangles * 3 * 3
      }
    }

    var chunkSize = 2000;

    var indices = geometry.attributes.index.array;

    for ( var i = 0; i < indices.length; i ++ ) {
      indices[ i ] = i % ( 3 * chunkSize );
    }
                
    var positions = geometry.attributes.position.array;
    var normals = geometry.attributes.normal.array;
    var colors = geometry.attributes.color.array;

    var color = new THREE.Color();

    var faces = triangleMesh.geometry.faces;
    var verts = triangleMesh.geometry.vertices;

    for ( var i = 0; i < triangles; i++ ) {

      var ai = faces[ i ].a
      var bi = faces[ i ].b
      var ci = faces[ i ].c

      positions[ i * 9 ]     = verts[ ai ].x;
      positions[ i * 9 + 1 ] = verts[ ai ].y;
      positions[ i * 9 + 2 ] = verts[ ai ].z;

      positions[ i * 9 + 3 ] = verts[ bi ].x;
      positions[ i * 9 + 4 ] = verts[ bi ].y;
      positions[ i * 9 + 5 ] = verts[ bi ].z;

      positions[ i * 9 + 6 ] = verts[ ci ].x;
      positions[ i * 9 + 7 ] = verts[ ci ].y;
      positions[ i * 9 + 8 ] = verts[ ci ].z;

      //

      var vn = triangleMesh.geometry.faces[ i ].vertexNormals

      normals[ i * 9 ]     = vn[ 0 ].x;
      normals[ i * 9 + 1 ] = vn[ 0 ].y;
      normals[ i * 9 + 2 ] = vn[ 0 ].z;

      normals[ i * 9 + 3 ] = vn[ 1 ].x;
      normals[ i * 9 + 4 ] = vn[ 1 ].y;
      normals[ i * 9 + 5 ] = vn[ 1 ].z;

      normals[ i * 9 + 6 ] = vn[ 2 ].x;
      normals[ i * 9 + 7 ] = vn[ 2 ].y;
      normals[ i * 9 + 8 ] = vn[ 2 ].z;

      //

      var ca = verts[ai].y + verts[bi].y + verts[ci].y / 3
      var cb = 2.0 / ca;

      if ( ca > 42 ) {
        color.setRGB( 0.5, 0.6, 0.02 );
      } else if ( ca > 7.3 ) {
        color.setRGB( 0.1, 0.5 + cb, 0.1 );
      } else if ( ca > 6.3 ) {
        color.setRGB( 0.3, 0.3, 0.5 );
      } else if ( ca > 5.3 ) {
        color.setRGB( 0.5, 0.5, 0.0 );
      } else {
        color.setRGB( 0.0, 0.2, 0.5 );
      }

      colors[ i * 9 ]     = color.r;
      colors[ i * 9 + 1 ] = color.g;
      colors[ i * 9 + 2 ] = color.b;

      colors[ i * 9 + 3 ] = color.r;
      colors[ i * 9 + 4 ] = color.g;
      colors[ i * 9 + 5 ] = color.b;

      colors[ i * 9 + 6 ] = color.r;
      colors[ i * 9 + 7 ] = color.g;
      colors[ i * 9 + 8 ] = color.b;

    }

    //

    geometry.offsets = [];

    var offsets = triangles / chunkSize;

    for ( var i = 0; i < offsets; i ++ ) {

      var offset = {
        start: i * chunkSize * 3,
        index: i * chunkSize * 3,
        count: Math.min( triangles - ( i * chunkSize ), chunkSize ) * 3
      };

      geometry.offsets.push( offset );

    }
                
    geometry.computeBoundingSphere();

    //

    var material = mat /*new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa, ambient: 0xaaaaaa, specular: 0xffffff, shininess: 250,
        side: THREE.FrontSide, vertexColors: THREE.VertexColors
    } );*/

    var mesh = new THREE.Mesh( geometry, material );

    //

    return mesh;

  }

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

var yawObject,pitchObject,nh;
var direct;

THREE.PointerLockControls = function ( camera ) {
//console.log("YES");

    var scope = this;
    camera.rotation.set( 0, 0, 0 );

    pitchObject = new THREE.Object3D();
    pitchObject.add( camera );

    yawObject = new THREE.Object3D();
    yawObject.position.y = 0;
    yawObject.add( pitchObject );

    var moveUpward = false;
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

        yawObject.rotation.y -= movementX * 0.004;
        pitchObject.rotation.x -= movementY * 0.004;

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

                moveUpward = true;
var vector = new THREE.Vector3( 0, 0, -1 );

direct =vector.applyQuaternion( yawObject.quaternion );

        var direction = new THREE.Vector3( 0, 0, -1 );
        var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

        rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

direct =  direction.applyEuler( rotation );

direct = direct.multiplyScalar( 5 );
//spawnBox()
                velocity.y = 10;
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

            case 32:

                moveUpward = false;
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

        delta = 2;

        velocity.x += ( - velocity.x ) * 0.08 * delta;
        velocity.z += ( - velocity.z ) * 0.08 * delta;

        //velocity.y -= 0.025 * delta;

        if ( moveForward ) velocity.z -= 0.012 * delta;
        if ( moveBackward ) velocity.z += 0.012 * delta;

        if ( moveUpward ) velocity.y = 3 * delta;

        if ( moveLeft ) velocity.x -= 0.012 * delta;
        if ( moveRight ) velocity.x += 0.012 * delta;

        yawObject.translateX( velocity.x );
        yawObject.translateZ( velocity.z );
        nh =getH(yawObject.position.x/divisor ,-yawObject.position.z/divisor)+0.5;
        if (yawObject.position.y < nh && (yawObject.position.y - nh) < -.01)
        yawObject.translateY( .2 + velocity.y )
        velocity.y = 0;
        if (yawObject.position.y > nh && (yawObject.position.y - nh) > .01)
        yawObject.translateY( -.2 ); 

     //console.log((nh - yawObject.position.y));

        checkPos(yawObject);

    };
};

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
        var amplitude= 1;
     var previousRender;
     var displacement;

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


 function loadtrees(loader,branchfactor,levels,leafsprite,iduni,idxstart,idxend,amplitude,previousRender,attributes,displacement,seed,segments,vMultiplier,twigScale,initalBranchLength,lengthFalloffFactor,lengthFalloffPower,clumpMax,clumpMin){
    
    var url = 'http://localhost:8080/tree?leaves=0&levels='+levels+'&branchfactor='+branchfactor
    //TRUNK
    if (seed != undefined) {
        url+='&seed='+seed+'&segments='+segments+'&vMultiplier='+vMultiplier+'&twigScale='+twigScale
        //+'&initalBranchLength='+initalBranchLength+'&lengthFalloffFactor='+lengthFalloffFactor+'&lengthFalloffPower='+lengthFalloffPower+'&clumpMax='+clumpMax+'&clumpMin='+clumpMin
    }
    loader.load( url, function ( geometry, materials ) {
        var material = materials[ 0 ];
        material.color.setHex( 0xffffff );
        material.ambient.setHex( 0xffffff );
        var faceMaterial = new THREE.MeshBasicMaterial({ map:THREE.ImageUtils.loadTexture( 'texture.jpg')});

        for ( var i = idxstart; i < idxend; i ++ ) {
            var x = naturePos[0][i]*2;
            var z = naturePos[1][i]*2;
if (getH(x/divisor,-z/divisor) < -5 ) continue;
            faceMaterial.map.wrapS = faceMaterial.map.wrapT = THREE.RepeatWrapping;
            faceMaterial.map.repeat.set( 1, 1 );

            var morph = new THREE.Mesh( geometry, faceMaterial );
            var s = THREE.Math.randFloat( 0.00075, 0.001 );
            morph.scale.set( s, s, s );
            morph.name="tree"
            morph.position.set( x, getH(x/divisor,-z/divisor)-0.5, z );
            morph.rotation.y = THREE.Math.randFloat( -0.25, 0.25 );

            scene.add( morph );
            morphs.push( morph );
            _trees.push( morph );

        }

    });
    // BRANCHES
    url = 'http://localhost:8080/tree?leaves=1&levels='+levels+'&branchfactor='+branchfactor
    if (seed != undefined) {
        url+='&seed='+seed+'&segments='+segments+'&vMultiplier='+vMultiplier+'&twigScale='+twigScale
        //+'&initalBranchLength='+initalBranchLength+'&lengthFalloffFactor='+lengthFalloffFactor+'&lengthFalloffPower='+lengthFalloffPower+'&clumpMax='+clumpMax+'&clumpMin='+clumpMin
    }
    loader.load( url, function ( geometry, materials ) {
        var material = materials[ 0 ];
        material.color.setHex( 0xffffff );
        material.ambient.setHex( 0xffffff );
        material.alphaTest = 0.5;

        var faceMaterial = new THREE.MeshFaceMaterial( materials );

        for ( var i = idxstart; i < idxend; i ++ ) {

            var x = naturePos[0][i]*2;
            var z = naturePos[1][i]*2;
if (getH(x/divisor,-z/divisor) < -5 ) continue;

            var faceMaterial = new THREE.MeshBasicMaterial({ map: leafsprite, transparent: true, depthWrite: false, depthTest: true});
            faceMaterial.map.wrapS = faceMaterial.map.wrapT = THREE.RepeatWrapping;
            faceMaterial.map.repeat.set( 0.7,0.7 );

            var morph2 = new THREE.Mesh( geometry, faceMaterial );
            var s = THREE.Math.randFloat( 0.00075, 0.001 );
            morph2.scale.set( s, s, s );
            morph2.name="tree"
            
            morph2.position.set( x, getH(x/divisor,-z/divisor)-0.5, z );
            morph2.rotation.y = THREE.Math.randFloat( -0.25, 0.25 );
            scene.add( morph2 );
            morphs.push( morph2 );
            _trees.push( morph2 );
        }
    } );
}      


function loadNature() {     
    var loader = new THREE.JSONLoader();
    loadtrees(loader,10,5,sprite1,1,0,199,"amplitude","previousRender",attributesS6,"displacement",10,10,10,1  );
    loadtrees(loader,3.4,5,sprite2,1,200,399,"amplitude","previousRender",attributesS6,"displacement",10,10,3,1);
    loadtrees(loader,20,15,sprite3,1,400,500,"amplitude","previousRender",attributesS6,"displacement",30,3,5,1);
}

function onWindowResize( event ) {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate() {
 
    Sea.render();

    render();
}

function replacer(key, value) {
    if (typeof value === 'number' && !isFinite(value)) {
        return String(value);
    }
    return value;
}
var oldval=0;
function checkPos(camera){
    var willsend=false;
            myPos.rx=Math.floor(camera.rotation.x);
            myPos.ry=Math.floor(camera.rotation.y);
            myPos.rz=Math.floor(camera.rotation.z);

              var posdiv = document.getElementById("posDiv");
        posdiv.style.right=xp+'px';
        posdiv.style.top=yp+'px';
var angle = 0;
var st = window.getComputedStyle(posdiv, null);
var tr = st.getPropertyValue("-webkit-transform") ||
         st.getPropertyValue("-moz-transform") ||
         st.getPropertyValue("-ms-transform") ||
         st.getPropertyValue("-o-transform") ||
         st.getPropertyValue("transform") ||
         "FAIL";
if (tr != "none" && tr != "matrix(1, 0, 0, 1, 0, 0)") {
var values = tr.split('(')[1].split(')')[0].split(',');
var a = values[0];
var b = values[1];
var c = values[2];
var d = values[3];

var scale = Math.sqrt(a*a + b*b);
var sin = b/scale;

angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
}

        var transformProperty = Modernizr.prefixed('transform');
        posdiv.style[transformProperty] = 'rotate('+(-myPos.ry * 57)+'deg)';

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
    if (willsend == true) {
        send(JSON.stringify(myPos,replacer));
        var xp=(52)-myPos.x/worldWidth*128;        
        var yp=-(-myPos.z/worldDepth*128-(56));
        var posdiv = document.getElementById("posDiv");
        posdiv.style.right=xp+'px';
        posdiv.style.top=yp+'px';
   }

        var xf=(52)-wa[0]/worldWidth*128;        
        var yf=-(-wa[1]/worldDepth*128-(56));
        document.getElementById("winPosDiv").style.right=xf+'px';
        document.getElementById("winPosDiv").style.top=yf+'px';

       if (wa[0] < myPos.x
        && wa[1] < myPos.z
        && wa[2] > myPos.x
        && wa[3] > myPos.z
     ) {
        alert('you won !');
       } else {
          // console.log(wa);
          // console.log('->');
          // console.log(myPos);
              }
   

}

var box;
spawnBox = (function() {
    var box_geometry = new THREE.SphereGeometry( 0.24, 8, 8 ),
        handleCollision = function( collided_with, linearVelocity, angularVelocity ) {
            switch ( ++this.collisions ) {
                
                case 1:
                    this.material.color.setHex(0xcc8855);
                    break;
                
                case 2:
                    this.material.color.setHex(0xbb9955);
                    break;
                
                case 3:
                    this.material.color.setHex(0xaaaa55);
                    break;
                
                case 4:
                    this.material.color.setHex(0x99bb55);
                    break;
                
                case 5:
                    this.material.color.setHex(0x88cc55);
                    break;
                
                case 6:
                    this.material.color.setHex(0x77dd55);
                    break;
            }
        },
        createBox = function() {
            var material;
            
            material = Physijs.createMaterial(
                new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'texture.jpg' ) }),
                .6, // medium friction
                .3 // low restitution
            );
            material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
            material.map.repeat.set( .5, .5 );
            
            //material = new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/rocks.jpg' ) });
            
            box = new Physijs.BoxMesh(
                box_geometry,
                material
            );
            box.collisions = 0;
            
            box.position.set(
                yawObject.position.x,
                yawObject.position.y+1,
                yawObject.position.z
            );
            
            box.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            box.castShadow = true;
            box.addEventListener( 'collision', handleCollision );
//                box.addEventListener( 'ready', spawnBox );
            scene.add( box );
            if (direct != null){
                box.applyCentralImpulse(direct);
            }
            

        };
    
    return function() {
        setTimeout( createBox, 1000 );
    };
})();

var time;    
var sunround = true;

render = function() {
    requestAnimationFrame( render );


    var delta = clock.getDelta();


                    var time = clock.getElapsedTime();

for ( var i = 0, il = grassGeometry2.vertices.length / 2 - 1; i <= il; i ++ ) {
                    for ( var j = 0, jl = grassWidth, f = (il - i) / il; j < jl; j++ ) {
                        grassGeometry2.vertices[ jl * i + j ].z = f * Math.sin(time) / 2
                    }
                }

                grassGeometry2.verticesNeedUpdate = true;
                


    Sea.material.uniforms.time.value += delta;

    furUniforms.time.value += delta*100;
    controls.update( Date.now() - time );
    frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
var objs = new Array();
var final_objs = objs.concat(_leaves,_trees);
var count=0;


  var point1 = yawObject.position;


for (var i=0; i<final_objs.length; i++) {
    final_objs[i].visible = frustum.intersectsObject( final_objs[i] );

if (final_objs[i].visible) {
    var point2 = final_objs[i].position;
    var distance = point1.distanceTo( point2 );
    if (distance <250)
    final_objs[i].visible = true;
    else
    final_objs[i].visible = false;
}
}



var objs = new Array();
 var final_objs = objs.concat(_grass);
var count=0;
for (var i=0; i<final_objs.length; i++) {
    var point2 = final_objs[i].position;
    var distance = point1.distanceTo( point2 );
    if (distance <150)
    final_objs[i].visible = true;
    else
    final_objs[i].visible = false;
}
   

var v = Math.cos( clock.elapsedTime /300)%1;
var e = v;
skyUniforms.bottomColor.value.r = e;
skyUniforms.bottomColor.value.g = e;
skyUniforms.bottomColor.value.b = e;
scene.fog.color.setRGB(e/2,e/2,e/2);
for (var prop in myJSONUserPosArray2) {
            var tt = JSON.parse(myJSONUserPosArray2[prop])
        if ((    lastposs[prop]!=myJSONUserPosArray2[prop]) && (prop !=CONFIG.nick)) {
            console.log(prop+' !='+CONFIG.nick+'&& '+lastposs[prop]+'!='+myJSONUserPosArray2[prop]);
            var xc,yc,zc=0;
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

            var xp=(52)-xc/worldWidth*128;        
            var yp=-(zc/worldDepth*128-(56));

            document.getElementById("pos2Div").style.display='';
            document.getElementById("pos2Div").style.right=xp+'px';
            document.getElementById("pos2Div").style.top=yp+'px';

        }
       lastposs[prop]=myJSONUserPosArray2[prop]

    }
//    Sun.position.x = (Math.cos( clock.elapsedTime /50) * 390)+5;
    Sunlight.position.x = (Math.cos( (clock.elapsedTime +200 )/200) * 390);
    lensFlare.position.x = (Math.cos(  (clock.elapsedTime +200 ) /200) * 390);
//    Sun.position.y = (Math.sin( clock.elapsedTime /50) * 390)+5;
    Sunlight.position.y = (Math.sin(  (clock.elapsedTime +200 )/200) * 390);
    lensFlare.position.y = (Math.sin(  (clock.elapsedTime +200 )/200) * 390);
rendererStats.update(renderer);
    renderer.render( scene, camera );

    time = Date.now();
};

   function colorToHex(color) {
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);
    
    var rgb = blue | (green << 8) | (red << 16);
    return digits[1] + 'Ox' + rgb.toString(16);
}

function setUniforms() {
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
}

var _leaves  = new Array();
var _trees  = new Array();
var _grass  = new Array();
var skyUniforms;
var Sea,Sun,Sunlight,lensFlare ;
var android;
var  grassMeshes = [], grassMaterial;
var grassHeight = 5, grassWidth = 2;
var grassCount = 25000;


var grassGeometry2;


    var divisor = 2;
        var waterWidth = 1024, waterDepth = 1024;
    var worldWidth = 512, worldDepth = 512;
    var furUniforms;
    var rendererStats;
initScene = function() {
 rendererStats   = new THREEx.RendererStats();

var FizzyText = function() {
  this.message = 'dat.gui';
//  this.speed = 0.8;
//  this.displayOutline = false;
};

  var text = new FizzyText();
  var gui = new dat.GUI();
  gui.add(text, 'message');
//  gui.add(text, 'speed', -5, 5);
//  gui.add(text, 'displayOutline');

gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '0px';
gui.domElement.style.right = '130px';

document.body.appendChild( gui.domElement );

    clock = new THREE.Clock();
    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    /*renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;       
    */
    //renderer.setClearColor(new THREE.Color(0xB4E4F4));
    var container = document.createElement( 'div' );
    document.body.appendChild( container );
    container.appendChild( renderer.domElement );

    // SCENE
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 1 );
        }
    );
    
    // CAMERA
    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        800
    );
    camera.position.set( 60, 50, 60 );
    camera.lookAt( scene.position );
    scene.add( camera );
    frustum = new THREE.Frustum();

    // LIGHT
    //light = new THREE.HemisphereLight( 0x404040, 0x909090, 3 ); 
    //new THREE.AmbientLight( 0x404040 );//THREE.DirectionalLight( 0xFFFFFF );
    /*light.position.set( 20, 40, -15 );
    light.target.position.copy( scene.position );
    light.castShadow = true;
    light.shadowCameraLeft = -60;
    light.shadowCameraTop = -60;
    light.shadowCameraRight = 60;
    light.shadowCameraBottom = 60;
    light.shadowCameraNear = 20;
    light.shadowCameraFar = 200;
    light.shadowBias = -.0001
    light.shadowMapWidth = light.shadowMapHeight = 2048;
    light.shadowDarkness = .7;
    */
    //scene.add( light );
        //scene.fog = new THREE.FogExp2( 0xB4E4F4, 0.0025 );
scene.fog = new THREE.Fog( 0xffffff, 1, 300 );
                scene.fog.color.setHSL( 0.6, 0, 1 );
                // LIGHTS

                var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
                hemiLight.color.setHSL( 0.6, 1, 0.6 );
                hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
                hemiLight.position.set( 0, 500, 0 );
                scene.add( hemiLight );

                //

                var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
                dirLight.color.setHSL( 0.1, 1, 0.95 );
                dirLight.position.set( -1, 1.75, 1 );
                dirLight.position.multiplyScalar( 50 );
                scene.add( dirLight );

                dirLight.castShadow = true;

                dirLight.shadowMapWidth = 2048;
                dirLight.shadowMapHeight = 2048;

                var d = 50;

                dirLight.shadowCameraLeft = -d;
                dirLight.shadowCameraRight = d;
                dirLight.shadowCameraTop = d;
                dirLight.shadowCameraBottom = -d;

                dirLight.shadowCameraFar = 3500;
                dirLight.shadowBias = -0.0001;
                dirLight.shadowDarkness = 0.35;
                //dirLight.shadowCameraVisible = true;

var vertexShader = document.getElementById( 'skyVertexShader' ).textContent;
                var fragmentShader = document.getElementById( 'skyFragmentShader' ).textContent;
                skyUniforms = {
                    topColor:    { type: "c", value: new THREE.Color( 0x0077ff ) },
                    bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
                    offset:      { type: "f", value: 33 },
                    exponent:    { type: "f", value: 0.6 }
                }
                skyUniforms.topColor.value.copy( hemiLight.color );

                scene.fog.color.copy( skyUniforms.bottomColor.value );

                var skyGeo = new THREE.SphereGeometry( 400, 32, 15 );
                var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: skyUniforms, side: THREE.BackSide } );

                var sky = new THREE.Mesh( skyGeo, skyMat );
                scene.add( sky );
///LENS FLARE / SUN

/*
view-source:http://threejs.org/examples/webgl_lensflares.html
*/
//    var Sun_geometry = new THREE.SphereGeometry( 5, 8, 8 );
/*    var Sun_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'texture.jpg' ) , transparent:true}),
        .8, // high friction
        .3 // low restitution
    );

    Sun_material.opacity = 0.6;
    Sun = new THREE.Mesh(Sun_geometry,Sun_material);
 */   var textureFlare0 = THREE.ImageUtils.loadTexture( "lensflare0.png" );
   // var textureFlare2 = THREE.ImageUtils.loadTexture( "lensflare1.png" );
   // var textureFlare3 = THREE.ImageUtils.loadTexture( "lensflare2.png" );
    addLight( 0.55, 0.9, 0.5, 0, 290, 0 );
  //  Sun.position.set( 195,50,0 );
  //  scene.add( Sun );

    function addLight( h, s, l, x, y, z ) {

        Sunlight = new THREE.PointLight( 0xffffff, 1.5, 4500 );
        Sunlight.color.setHSL( h, s, l );
        Sunlight.position.set( x, y, z );
        scene.add( Sunlight );

        var flareColor = new THREE.Color( 0xffffff );
        flareColor.setHSL( h, s, l + 0.5 );

        lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );
/*
        lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
        lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
        lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

        lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
        lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
        lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
        lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );
*/
        lensFlare.customUpdateCallback = lensFlareUpdateCallback;
        lensFlare.position = Sunlight.position;

        scene.add( lensFlare );

    }
             function lensFlareUpdateCallback( object ) {

                var f, fl = object.lensFlares.length;
                var flare;
                var vecX = -object.positionScreen.x * 2;
                var vecY = -object.positionScreen.y * 2;


                for( f = 0; f < fl; f++ ) {

                       flare = object.lensFlares[ f ];

                       flare.x = object.positionScreen.x + vecX * flare.distance;
                       flare.y = object.positionScreen.y + vecY * flare.distance;

                       flare.rotation = 0;

                }

               // object.lensFlares[ 2 ].y += 0.025;
               // object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );

            }
    // MISC
    sprite1 = THREE.ImageUtils.loadTexture( "branch1.png", null );
    sprite2 = THREE.ImageUtils.loadTexture( "branch2.png", null );
    sprite3 = THREE.ImageUtils.loadTexture( "branch3.png", null );

    camera.position.set( myPos.x,myPos.y,myPos.z);
    
    setUniforms();

    //CONTROLS
    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

    var data = groundGeometry;

    // GROUND
    ground_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'texture.jpg' ) }),
        .8, // high friction
        .3 // low restitution
    );
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    ground_material.map.repeat.set( 1, 1 );
ground_material.color.setHSL( 0.095, 1, 0.75 );

    var NoiseGen = new SimplexNoise;

    var ground_geometry = new THREE.PlaneGeometry( worldWidth, worldDepth, worldWidth/divisor - 1, worldDepth/divisor - 1 );
    for ( var i = 0, l = ground_geometry.vertices.length; i < l; i ++ ) {
        ground_geometry.vertices[ i ].z = data[ i ]/3-10;//NoiseGen.noise( ground_geometry.vertices[ i ].x / 20, ground_geometry.vertices[ i ].y / 20 ) * 10;
    }
    ground_geometry.computeFaceNormals();
    ground_geometry.computeVertexNormals();

    ground = new Physijs.HeightfieldMesh(
        ground_geometry,
        ground_material,
        0 , worldWidth - 1, worldDepth - 1 
    );
    /*ground.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
    ground.receiveShadow = true;
    */
    var terrain_ground = loadTriangleMeshToVBO( ground , ground_material);

    terrain_ground.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
    terrain_ground.receiveShadow = true;

    scene.add( terrain_ground );
    
    var cube_geometry = new THREE.CubeGeometry( 3, 3, 3 );
        var cube_mesh = new THREE.Mesh( cube_geometry );
    cube_mesh.position.y = 3;
        cube_mesh.position.x = 7;
    var smooth = cube_geometry;
    smooth.mergeVertices();
    smooth.computeCentroids();
                smooth.computeFaceNormals();
                smooth.computeVertexNormals();
var modifier = new THREE.SubdivisionModifier(2);
modifier.modify( smooth );
var mesh = new THREE.Mesh( smooth, new THREE.MeshPhongMaterial( { color: 0x222222 } ) );
scene.add( mesh );
    
    ground.receiveShadow = true;

    // POPULATE HEIGHTS ARRAY
    for ( var i = 0, l = ground.geometry.vertices.length; i < l; i ++ ) {
        if (heights[Math.floor(ground.geometry.vertices[ i ].x/divisor)] == undefined)
        heights[""+Math.floor(ground.geometry.vertices[ i ].x/divisor)] = {};
        heights[""+Math.floor(ground.geometry.vertices[ i ].x/divisor)][""+Math.floor(ground.geometry.vertices[ i ].y/divisor)]=ground.geometry.vertices[ i ].z;
  
    }

    // WINNING AREA
furUniforms = {
                    
                    texture1: { type: "t", value: THREE.ImageUtils.loadTexture( "grass_billboard.png" ) },
                    time: { type: "f", value: 1.0 },
                    resolution: { type: "v2", value: new THREE.Vector2() },
                    uvScale: { type: "v2", value: new THREE.Vector2( 4.0, 2.0 ) },
                    wind: { type: "v2", value: new THREE.Vector2( 10, 10 ) },
                    layer: { type: "f", value: 0.0 }
                    
                };
                
                furUniforms.texture1.value.wrapS = furUniforms.texture1.value.wrapT = THREE.RepeatWrapping;
                

                var furMaterial = new THREE.ShaderMaterial( {

                    uniforms: furUniforms,
                    vertexShader: document.getElementById( 'furVertexShader' ).textContent,
                    fragmentShader: document.getElementById( 'furShader' ).textContent,
                    
                } );
                
                var furMesh = new THREE.Mesh( new THREE.SphereGeometry( 5, 32, 15 ), grassMaterial );

                furMesh.position.x = wa[0]+2.5;
                furMesh.position.z = wa[1]+2.5;
                furMesh.position.y = getH(furMesh.position.x/divisor ,furMesh.position.z/divisor)+5;              
                scene.add( furMesh );

    //NATURE
    loadNature();

    var jsonLoader = new THREE.JSONLoader();
    jsonLoader.load( "android.js", addModelToScene );


    function addModelToScene( geometry, materials )
    {
       
        android = new THREE.Mesh( geometry, grassMaterial );
        android.scale.set(.1,.1,.1);
        android.position.y = getH(0 ,0);
        scene.add( android );
    }

    var noiseTexture = new THREE.ImageUtils.loadTexture( 'cloud.png' );
    noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
        

Sea = new THREE.FlatMirror(renderer, camera, {
        clipBias: 3, 
        textureWidth: 800, textureHeight: 600, 
        color:0x333366, 
        baseTexture: THREE.ImageUtils.loadTexture("water.png"),
        baseSpeed: 0.01,
        noiseTexture: noiseTexture,
        noiseScale: 0.02,
        alpha:  0.8,
        time:   0.0,
    });
    
    var SeaMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200, 100, 100), 
        Sea.material 
    );
    Sea.material.side = THREE.DoubleSide;
    SeaMesh.add(Sea);

    SeaMesh.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
    SeaMesh.position.set(0,-5,0);
    scene.add(SeaMesh);  


 grassGeometry2 = new THREE.PlaneGeometry( 2, 2, grassWidth - 1, grassHeight - 1 );
                grassGeometry2.dynamic = true;
                grassGeometry2.vertices[ 3 ].z = 1;
var grassMap = THREE.ImageUtils.loadTexture( 'grass_billboard.png' );

                var grassMaterial = new THREE.MeshBasicMaterial( { map: grassMap, alphaTest: 0.8, side: THREE.DoubleSide } );

              

for ( var i = 0, l = grassCount; i < l; i++ ) {
                    grassMeshes[i] = new THREE.Mesh( grassGeometry2, grassMaterial );

                    grassMeshes[i].position.x = Math.random() * worldWidth - worldWidth/2;
                    grassMeshes[i].position.z = Math.random() * worldDepth - worldDepth/2;
                    var h = getH(grassMeshes[i].position.x/divisor ,-grassMeshes[i].position.z/divisor)+0.5;
                    if (h<-5) {
                        grassMeshes[i] =null;
                        continue;
                    }
                    grassMeshes[i].position.y = h;

                    grassMeshes[i].rotation.y = Math.random() * Math.PI;
                    scene.add( grassMeshes[i] );    
                    _grass.push( grassMeshes[i] );
                }



    renderer.setClearColor( scene.fog.color, 1 );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.physicallyBasedShading = true;

    renderer.shadowMapEnabled = true;
    renderer.shadowMapCullFace = THREE.CullFaceBack;
    scene.simulate();
    animate();
    };

initScene();
//composer.render(0.05);
