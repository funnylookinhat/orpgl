// emmanuel DOT botros AT gmail DOT com (2011)

// Renderer Class handles communication with the 3d engine
function Renderer() {
	
	this.gameRenderer = null; 				// game renderer (keeps canvas element)
	this.gameScene 	= null;					// game scene	 (keeps all the scene objects)
	this.canvasEl	= null;					// canvas element id
	this.renderWidth = null;				// set to screen size at start (see _setgr)
	this.renderHeight= null;				// see up
	this.lasttime=null;						// keep last rendering time
	this.now=null;							// time handler
	this.mouse=null;						// I/O mouse handler
	this.camera =null;						// main cam
	this.keys =null;						// I/O keyboard handler
	this.pPos = new PosRot(0,0,0,0,0,0);	// keeps the player pos & rot between loops
	this.numMoveables=0;				 	// number of ennemies
	this.moveables =null;				 	// ennemies obj array
	
	// START : GLGE INTERFACE //
	
	this.doc=new GLGE.Document();		// initiate the document handler
	
	// *** _load *** load a xml scene
	this._load = function (doc) {
		this.doc.load(doc);
	}
	
	// *** _initobjects *** add a collection of objects to a js object
	this._initobjects = function (database,collection) {
		for (var prop in collection) {
			database[prop]=this._getmesh(collection[prop]);	
		}
	}
	
	// *** _getray *** check if a collision just happened
	this._getray = function (database,mousepos) {
		
		// get the screen center's position
		var cx=this.renderWidth/2;
		var cy=this.renderHeight/2;

		// if user clicked AND ray timeout is passed
		if 	((!database.evtRay)&&(database.evtPick)) {		
			
			// get collision test result
			var hitObj=this.gameScene.pick3(cx, cy); 
			
			// the ray actually hit something
			if(hitObj['coord']) {	
				
				// rayPosStart: player position 
				// rayPosEnd: collision position
				database.rayPosStart=[database.cubepos.x,database.cubepos.y,database.cubepos.z+1.5]
				database.rayPosEnd=[hitObj['coord'][0],hitObj['coord'][1],hitObj['coord'][2]];

				// Set the initial position and rotation of the bullet
				this._setposx(database.bullet,(database.rayPosStart[0]));
				this._setposy(database.bullet,(database.rayPosStart[1]));
				this._setposz(database.bullet,(database.rayPosStart[2]));	
				this._setrotx(database.bullet,(cuberot.x+(Math.PI/2)));
				this._setroty(database.bullet,(cuberot.y));
				this._setrotz(database.bullet,(cuberot.z));
				
				// Server needs to know a collision just happened
				send('COLLISION:'+database.rayPosEnd);
				
				// hit an ennemy ?
				var hitObjName=hitObj['object']['id']+"_"
				if (hitObjName.substring(0,4)=='Moveable')
					database.pickedObj=hitObj['object'];
				
				// initiate bullet movement
				database.evtRay=true;
				
				// can't fire faster then 10 bullet per sec
				setTimeout("window.DB.evtRay=false;",100);
			}
		}	
		
		// handles the bullet movement
		if (database.evtRay) {	

			// posi : next intermediate position of the bullet
			var posi=[];
			posi[0]	=	database.rayPosStart[0]-(database.rayPosStart[0]-database.rayPosEnd[0]);
			posi[1]	=	database.rayPosStart[1]-(database.rayPosStart[1]-database.rayPosEnd[1]);
			posi[2]	=	database.rayPosStart[2]-(database.rayPosStart[2]-database.rayPosEnd[2]);

			// moves the bullet
			this._setposx(database.bullet,(posi[0]));
			this._setposy(database.bullet,(posi[1]));
			this._setposz(database.bullet,(posi[2]));
			
			// keep new "start" position for next pass
			database.rayPosStart[0]	=	posi[0]
			database.rayPosStart[1]	=	posi[1]
			database.rayPosStart[2]	=	posi[2]
			
			// loop in the enemies' collection
			for(var i = 0; i < this.numMoveables; i++) {									
				
				// calcutate distance btween the bullet and the ennemy
				var dX =  this.moveables[i].x-posi[0];
				var dY =  this.moveables[i].y-posi[1];				
				var dist =  Math.sqrt(dX * dX + dY * dY);

				// if distance < 5 : kill the ennemy
				if (dist<5) {
					this._setposz(this.moveables[i].el,(-1000));			
				}
			}
		}
	}
	
	// main routine
	this._process = function (database){
	
		var camera = this._getcam();
		var mousepos = this._getmousepos();

		mousepos.x = mousepos.x - document.body.offsetLeft;
		mousepos.y = mousepos.y	- document.body.offsetTop;			

		var camerapos = this._getpos(camera);
		var camerarot = this._getrot(camera);
		database.cubepos = this._getpos(database.cube);
		cuberot = this._getrot(database.cube);
		groundObjectpos = this._getpos(database.groundObject);
		
		headrot =  this._getrot(database.head);
		
		this._getray(database,mousepos);
		
		inc = ((mousepos.y - (document.getElementById('canvas').offsetHeight / 2)) / 200)+2;
		inc2 = (mousepos.x - (document.getElementById('canvas').offsetWidth / 2)) / 200;
		
		if (inc <=0.5) inc=0.5;
		var trans=GLGE.mulMat4Vec4(camera.getRotMatrix(),[0,0,-1,1]);
		var mag=Math.pow(Math.pow(trans[0],2)+Math.pow(trans[1],2),0.5);
		trans[0]=trans[0]/mag;
		trans[1]=trans[1]/mag;
		
		if (inc<1) {
			this._setrotx(database.cube,(inc/1000));
			this._setrotx(database.head,(inc/1000));
		}
		
		this._setrotz(database.cube,(-inc2*2+1.57+database.dec));
		this._setrotz(database.head,(-inc2*2+database.dec));
		
		var H2=this.gameScene.getHeight(null);

		//if (H2!=false)
		//	buildNature();
			
		if (database.H==null)database.H=0;
		
		if ((!database.evtJump))
			this._setposz(database.cube,(-H2));	
			
		for(prop in db)	
				$("#tim1").append(prop+" "+ db[prop]+"<br>")	

		if (database.evtJumped) {
			this._setposz(database.cube,(database.cubepos.z-.1));	
			setTimeout("window.DB.evtJumped=false",500);
		}		
			
		if (database.evtJump)
			this._setposz(database.cube,(database.cubepos.z+.1));	
		
		database.H=H2
		
		var mat=database.cube.getRotMatrix();
		var trans=GLGE.mulMat4Vec4(mat,[0,1,-1,1]);
		var mag=Math.pow(Math.pow(trans[0],2)+Math.pow(trans[1],2),0.5);
		if (database.evtJump) {
			trans[0]=trans[0]/mag/8;
			trans[1]=trans[1]/mag/8;
		}
		else {
			trans[0]=trans[0]/mag/18;
			trans[1]=trans[1]/mag/18;
		}
		
		// moving forces along axis
		var incY=0;
		var incX=0;
		
		if(this.keys.isKeyPressed(GLGE.KI_SPACE)) {setTimeout("window.DB.evtJump=true",1);database.evtPreJump=true;moveJump(); }
		if(this.keys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {incY+=parseFloat(trans[1]);incX+=parseFloat(trans[0]);if((!database.evtPreJump)&&(!database.evtJump))movePf();}
		if(this.keys.isKeyPressed(GLGE.KI_UP_ARROW)) {incY-=parseFloat(trans[1]);incX-=parseFloat(trans[0]);if((!database.evtPreJump)&&(!database.evtJump))movePf();} 
		if(this.keys.isKeyPressed(GLGE.KI_RIGHT_ARROW)) {incY+=parseFloat(trans[0]);incX-=parseFloat(trans[1]);if((!database.evtPreJump)&&(!database.evtJump))movePf();}
		if(this.keys.isKeyPressed(GLGE.KI_LEFT_ARROW)) {incY-=parseFloat(trans[0]);incX+=parseFloat(trans[1]);if((!database.evtPreJump)&&(!database.evtJump))movePf();}
		
		this._setposy(database.cube,(database.cubepos.y+incY*0.5*database.H/100));
		this._setposx(database.cube,(database.cubepos.x+incX*0.5*database.H/100));	

		this._setposz(camera,(database.cubepos.z+1.6-cuberot.x*1000+inc));
		database.cubepos = this._getpos(database.cube);
		cuberot = this._getrot(database.cube);
		headpos = this._getpos(database.head);
		headrot = this._getrot(database.head);
		this._setposx(camera,(database.cubepos.x-2*inc*Math.cos((headrot.z) * 57 *Math.PI / 180)));
		this._setposy(camera,(database.cubepos.y-2*inc*Math.sin((headrot.z) * 57* Math.PI / 180)));
		
		this._setposz(database.head,(database.cubepos.z-1.08));
		this._setposx(database.head,(database.cubepos.x));
		this._setposy(database.head,(database.cubepos.y));
		
		database.KRotz=interlopateHeight(database.KRotz,(database.cubepos.z+2+inc/1000),camera,0.001);
			
		if((((this.pPos.x-(headpos.x)>1)||(this.pPos.x-(headpos.x)<-1))||((this.pPos.z-(headpos.z)>1)||(this.pPos.z-(headpos.z)<-1))||((this.pPos.rx-(headrot.x)>1)||(this.pPos.rx-(headrot.x)<-1))||((this.pPos.rz-(headrot.z)>1)||(this.pPos.rz-(headrot.z)<-1))||((this.pPos.ry-(headrot.y)>1)||(this.pPos.ry-(headrot.y)<-1)))) {
			var msg = (headpos.x)+ ";"+ (headpos.y)+";"+(headpos.z)+'|'+(headrot.x)+ ";"+ (headrot.y)+";"+(headrot.z);
			this.pPos.x=(headpos.x);
			this.pPos.y=(headpos.y);
			this.pPos.z=(headpos.z);
			this.pPos.rx=(headrot.x);
			this.pPos.ry=(headrot.y);
			this.pPos.rz=(headrot.z);		
			send(msg);
			database.tick=true;
			setTimeout("window.DB.tick=false",10000);
		}
	}
	
	// set object position in 3d
	
	this._setposx = function (o,x) {
		o.setLocX(x);
	}
	
	this._setposy= function (o,y) {	
		o.setLocY(y);
	}
	
	this._setposz= function (o,z) {
		o.setLocZ(z);
	}
	
	// set object rotation in 3d	
	
	this._setrotx= function (o,x) {
		o.setRotX(x);
	}
	
	this._setroty= function (o,y) {
		o.setRotY(y);
	}
	
	this._setrotz= function (o,z) {
		o.setRotZ(z);
	}

	// push an object in a object collection
	this._addobj = function (o,o2) {
		o.addObject(o2);
	}

	// create a new object
	this._setobj = function (mesh,name,posrot,mat,pick,bag,counter,type,tvar) {
		
		var	obj=(new GLGE.Object).setDrawType(GLGE.DRAW_TRIANGLES);
				
		obj.setMesh(mesh);
		obj.setMaterial(mat);
		obj.setZtransparent(false);
		obj.id=name+counter;
		obj.pickable=pick;
				
		var x=posrot.x;
		var y=posrot.y;
		var z=posrot.z;
		var rx=posrot.rx;
		var ry=posrot.ry;
		var rz=posrot.rz;
		
		if (x!=null)
			this._setposx(obj,x);
		if (y!=null)
			this._setposy(obj,y);
		if (z!=null)
			this._setposz(obj,z);		
		if (rx!=null)
			this._setrotx(obj,rx);
		if (ry!=null)
			this._setroty(obj,ry);
		if (rz!=null)
			this._setrotz(obj,rz);

		this._addobj(bag,obj);
		posSav = this._getpos(obj)
		
		if (type==0)
			tvar.el=obj;
				
		if (type==1)
			tvar.push(obj);		
	}
	
	// sets the game renderer size
	this._setgr = function (el) {
		this.canvasEl=el
		this.gameRenderer = new GLGE.Renderer(document.getElementById(el));
	
		if( typeof( window.innerWidth ) == 'number' ) {
			this.renderWidth = window.innerWidth;
			this.renderHeight = window.innerHeight;
		} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
			this.renderWidth = document.documentElement.clientWidth;
			this.renderHeight = document.documentElement.clientHeight;
		} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
			this.renderWidth = document.body.clientWidth;
			this.renderHeight = document.body.clientHeight;
		}	  
	}
	
	// create the scene	
	this._setsc = function (name) {
		this.gameScene = new GLGE.Scene();
		this.gameScene = this.doc.getElement(name)
		this.gameRenderer.setScene(this.gameScene);
		this.gameRenderer.canvas.width = this.renderWidth;
		this.gameRenderer.canvas.height = this.renderHeight;
	}
	
	// create the main camera
	this._setcam = function () {
		var camera = this.gameScene.camera;
		camera.setAspect(this.renderWidth/this.renderHeight);
		this.camera=camera;
	}
	
	// get mesh from object name
	this._getmesh = function (name) {
		return this.doc.getElement(name);
	}

	// set the ambient fog
	this._setfog = function (near, far) {		
		this.gameScene.setFogType(GLGE.FOG_QUADRATIC);
		this.gameScene.fogNear=near;
		this.gameScene.fogFar=far;
	}	
	
	// create the mouse handler	
	this._getmouse = function () {
		this.mouse =	new GLGE.MouseInput(document.getElementById(this.canvasEl));
	}	

	// get current mouse pos
	this._getmousepos = function () {	
		return this.mouse.getMousePosition();
	}
	
	// get current object pos (x,y,z)
	this._getpos = function (obj) {	
		return obj.getPosition();
	}

	// get current object pos (rx,ry,rz)
	this._getrot = function (obj) {	
		return obj.getRotation();
	}
	
	// return the main camera
	this._getcam = function () {		
		return this.gameScene.camera;	
	}	
	
	// create the keys handler
	this._getkeys = function () {		
		this.keys = new GLGE.KeyInput();
	}	
		
		

	this._render = function () {
		this.now = parseInt(new Date().getTime());
		this.gameRenderer.render();
		this.lasttime = this.now;		
	}
		
	// END : GLGE INTERFACE //
}

// DB Class handles objects instances and in-game variables
function DB() {
	
	this.evtJump		= false; 		
	this.evtJumped	= false; 		
	this.evtPreJump	= false; 		
	this.evtAnim		= false;			
	this.evtPAnim	= false;			
	this.evtPAnimWalk= false;	
    this.evtPick= false; 	
	this.evtRay= false; 		
	this.dec			= 0;
	this.pickedObj	= null;
	this.ret			= null;
	this.rayPosStart		= null
	this.rayPosEnd		= null;
	this.testt		= [];
	this.H			= null;
	this.evtClusterCrea 	= false; 
	this.evtClusterPos	= false;
	
	this.tree		= null;
	this.bush		= null;
	this.robot		= null;
	this.branches	= null;
	this.ObjBag		= null;
	this.head		= null;
	this.player		= null;
	this.cube		= null;
	this.Forest		= null;
	this.Grass		= null;
	this.Branches	= null;
	
	this.materialBush	= null;
	this.materialGrass	= null;
	this.materialRobot	= null;
	this.materialBlack	= null;
	this.materialFlower	= null;
	
	this.cubepos	= null;
	this.objCount	= 0;
	this.tick		= false;
	this.KRotz		= 0;
	this.moveableEnd	= 100;
	
	this.AnimFramesArray = [0,120,125,135];
	
	window.DB=this;
	
};

// Moveable Class Represent a positionable object in the 3d space 
function Moveable(x, y,mat) {
	this.x = x;
	this.y = y;
	this.el=null;
	this.accelX=0;
	this.accelY=0;
	this.xVelocity = 1;
	this.yVelocity = -1;	
}

// Cluster Class contains a cluster of clone objects 
function Cluster() {
	
	this.clusterObj=null;
	this.objContainer=null;
	this.count=0;
	this.load= cload;
	this.Elems=null;
	this.cElems=[];
	this.idx=-1;
	
	function cload(obj,cont,mat,idx) {
	
		this.idx=idx;
		this.Elems=Nature[idx];
		this.count=this.Elems.length;		
		this.clusterObj=obj;
		this.objContainer=cont;
		
		for (var i=0;i<this.count;i++) {
	
		renderer._setobj( this.clusterObj.getMesh(),"Cube_",(new PosRot(this.Elems[i][0],this.Elems[i][1],null,null,this.Elems[i][2],this.Elems[i][3])),mat,false,this.objContainer,db.objCount++,1,this.cElems);
			
		}
		
		db.evtClusterCrea=true;
	}
}

function PosRot(x,y,z,rx,ry,rz) {
	this.x=x
	this.y=y
	this.z=z
	this.rx=rx
	this.ry=ry
	this.rz=rz
}

////////////////////////////////////////////////////////////////////////
var db=new DB();
var renderer=new Renderer(); 
////////////////////////////////////////////////////////////////////////

renderer.doc.onLoad = function() {	
	
	renderer._setgr('canvas');
	renderer._setsc("Scene");
	renderer._setfog(20,2000);	
	renderer._setcam();
	renderer._getmouse();
	renderer._getkeys();
	
	setDomEvents(renderer);
		
	var initObjs = {'ObjBag' : 'graph',
					'materialBlack' : 'black',
					'materialGrass' : 'Material',
					'robot' : 'Sphere',
					'head' : 'head',
					'player' : 'plane2',
					'bullet' : 'Cube',
					'cube' : 'plane',
					'tree' : 'plant_pmat8.001',
					'bush' : 'Bush 1',
					'branches' : 'Bush 2',
					'materialBush' : 'Bush Green.001',
					'materialRobot' : 'Material.003',
					'materialFlower' : 'Flower Green',
					'groundObject':'groundObject'};
	
	renderer._initobjects(db,initObjs);

	
	renderer._setposz(db.groundObject,150);

	
	setTimeout('moveP();moveP2();',1000); 
	//init ennemies
	renderer.moveables = [];
	renderer.numMoveables = 10;
	for(var i = 0; i < renderer.numMoveables; i++) {
		renderer.moveables.push(new Moveable(random(db.moveableEnd), random(db.moveableEnd),db.materialGrass));
		renderer._setobj( db.robot,"Moveable_",(new PosRot(null,renderer.moveables[i].y,renderer.moveables[i].z,-250,null,null)),db.materialRobot,true,db.ObjBag,db.objCount++,0,renderer.moveables[i]);
	}
	
	function movemoveables() {
		db.cubepos=db.cube.getPosition()
		for(var i = 0; i < renderer.numMoveables; i++) {					
		var distanceX = 0;
		var distanceY = 0; 
		var nPosX = 0;
		var nPosY = 0; 
		var distX = renderer.moveables[i].x - db.cubepos.x;
		var distY = renderer.moveables[i].y - db.cubepos.y;
		var distance =  Math.sqrt(distX * distX + distY * distY);
		
		if (distance>50) {
			
			if (( renderer.moveables[i].x>db.cubepos.x))
				distanceX = -1/distance*distance/500;
			else
				distanceX = 1/distance*distance/500;
			if (( renderer.moveables[i].y>db.cubepos.y))
				distanceY = -1/distance*distance/500;
			else
				distanceY = 1/distance*distance/500;

			}
	
			if (distanceY>0)renderer.moveables[i].accelY+=1;
			else renderer.moveables[i].accelY-=1;
			if (distanceX>0)renderer.moveables[i].accelX+=1;
			else renderer.moveables[i].accelX-=1;
			
			nPosX=renderer.moveables[i].x+distanceX+renderer.moveables[i].accelX/1000
			nPosY=renderer.moveables[i].y+distanceY+renderer.moveables[i].accelY/1000
			
			renderer._setposx(renderer.moveables[i].el,nPosX);
			renderer._setposy(renderer.moveables[i].el,nPosY);
			renderer.moveables[i].x=nPosX
			renderer.moveables[i].y=nPosY
		}
	}		
	
	canvas.onmousewheel = function( e ){
		delta=e.wheelDelta/40;
		if(delta!=0){
			camera.setFovY(parseFloat(camera.getFovY())-delta);
		}
	}
	
	function buildNature() {

		if (!db.evtClusterCrea){
			//db.Forest=new Cluster;
			//db.Forest.load(db.tree,db.ObjBag,db.materialGrass,0);	
			db.Grass=new Cluster;
			db.Grass.load(db.bush,db.ObjBag,db.materialFlower,1);	
			db.Branches=new Cluster;
			db.Branches.load(db.branches,db.ObjBag,db.materialBush,2);	
			db.evtClusterCrea=true;	
		}
		
		if((db.evtClusterCrea)&&(!db.evtClusterPos)) { 
		
			for (var i=0;i<db.Grass.count;i++) {
				cup=db.cube.getPosition();
				cp =db.Grass.cElems[i].getPosition();
				renderer._setposx(db.cube,cp.x);
				renderer._setposy(db.cube,cp.y);
				H3=renderer.gameScene.getHeight(null);
				renderer._setposz(db.Grass.cElems[i],-H3+1);
				renderer._setposx(db.cube,cup.x);
				renderer._setposy(db.cube,cup.y);
			}
			for (var i=0;i<db.Branches.count;i++) {
				cup=db.cube.getPosition();
				cp =db.Branches.cElems[i].getPosition();
				renderer._setposx(db.cube,cp.x);
				renderer._setposy(db.cube,cp.y);
				H3=renderer.gameScene.getHeight(null);
				renderer._setposz(db.Branches.cElems[i],-H3+1);
				renderer._setposx(db.cube,cup.x);
				renderer._setposy(db.cube,cup.y);
			}
		}
	}

	function multi() {
		
		for (var i=0;i<ns.length;i++) {
		   if (CONFIG.nick!=ns[i]) {
				if (myJSONUserPosArray[ns[i]])	{

					var straw=myJSONUserPosArray[ns[i]]+"";
					var stmid=straw.split('|');
					var st=stmid[0].split(';');
					var strot=stmid[1].split(';');
					
					if (myJSONUserPosArray2[ns[i]]) {
						
						var straw2=myJSONUserPosArray2[ns[i]]+"";
						var stmid2=straw2.split('|');
						var st2=stmid2[0].split(';');
						var strot2=stmid2[1].split(';');
						
						var ndistX=((st2[0]*1)-(st[0]*1))/2;
						var ndistY=((st2[1]*1)-(st[1]*1))/2;
						var ndistZ=((st2[2]*1)-(st[2]*1))/2;
						
						if (ndistX>1) ndistX=1;
						if (ndistY>1) ndistY=1;
						if (ndistZ>1) ndistZ=1;
						if (ndistX<-1) ndistX=-1;
						if (ndistY<-1) ndistY=-1;
						if (ndistZ<-1) ndistZ=-1;
						
						var nlocX=((st2[0]*1) - ndistX);
						var nlocY=((st2[1]*1) - ndistY);
						var nlocZ=((st2[2]*1) - ndistZ);
						
						renderer._setposx(db.player,(nlocX));
						renderer._setposy(db.player,(nlocY));
						renderer._setposz(db.player,(nlocZ+1));	
						renderer._setrotz(db.player,((strot[2])-4.8));
						if (moveplayer)	{		
							movePf2();
							moveplayer=false;
						}
						
						myJSONUserPosArray2[ns[i]]= nlocX+";"+ nlocY+";"+ nlocZ+"||"+strot2[0]+";"+strot2[1]+";"+strot2[2]						

					}
				}
			}     
		}
	}

	function loop() {
		renderer._process(window.DB);
		multi();
		movemoveables();
		renderer._render();		
	}
	
	setInterval(loop,1);
	var inc=.2;
};

GLGE.Scene.prototype.pick2=function(height){
	if(!db.cube)
		return false;
	if(this.camera.matrix && this.camera.pMatrix){	
		var cubePos=db.cube.getPosition();
		var origin=[cubePos.x,cubePos.y,cubePos.z+height];
		return this.ray(origin,[0,0,1]);
	}else{
		return false;
	}
}
GLGE.Scene.prototype.getHeight=function(h){
	if(!db.cube)
		return false;
	if(this.camera.matrix && this.camera.pMatrix){	
		db.cubepos=renderer._getpos(db.cube);
		var H=0;
		if (h!=null) H=h;
		var origin=[db.cubepos.x,db.cubepos.y,H];
		var ret=this.ray(origin,[0,0,1]);		

$("#tim1").html("d "+ ret['distance']+' '+ ret['id'])
		
		if (ret['object']['id']=='Plane')
			return ret['distance'];

		return false;
			
	}
	else {
	
		return false;
	}
}
GLGE.Scene.prototype.pick3=function(x,y){
	if(!this.camera){
		GLGE.error("No camera set for picking");
		return false;
	}else if(this.camera.matrix && this.camera.pMatrix){
		var height=this.renderer.getViewportHeight();
		var width=this.renderer.getViewportWidth();
		var offsetx=this.renderer.getViewportOffsetX();
		var offsety=this.renderer.getViewportHeight()-this.renderer.canvas.height+this.renderer.getViewportOffsetY();
		var xcoord =  ((x-offsetx)/width-0.5)*2;
		var ycoord = -((y+offsety)/height-0.5)*2;
		var invViewProj=GLGE.mulMat4(GLGE.inverseMat4(this.camera.matrix),GLGE.inverseMat4(this.camera.pMatrix));
		var origin =GLGE.mulMat4Vec4(invViewProj,[xcoord,ycoord,-1,1]);
		origin=[origin[0]/origin[3],origin[1]/origin[3],origin[2]/origin[3]];
		var coord =GLGE.mulMat4Vec4(invViewProj,[xcoord,ycoord,1,1]);
		coord=[-(coord[0]/coord[3]-origin[0]),-(coord[1]/coord[3]-origin[1]),-(coord[2]/coord[3]-origin[2])];
		coord=GLGE.toUnitVec3(coord);
		var ret = this.ray(origin,coord);
		return ret;
	}else{
		return false;
	}
}

var moveP = function() {
	if ((db.evtJump)||(db.evtPreJump)) 
		return;
		
	if ((c2.actions)&&(!db.evtAnim)){ 
		if (db.testt.length==0) {
			for(n in c2.actions) 
				db.testt.push(c2.actions[n]);
		}	 
		for(n in c2.actions) { 
			c2.actions[n].setStartFrame(db.AnimFramesArray[0]+1);
			c2.actions[n].setFrames(db.AnimFramesArray[1]); 
			c2.setAction(c2.actions[n],0,true);
			break;
		}
		for(n in c3.actions) { 
			c3.actions[n].setStartFrame(db.AnimFramesArray[0]+1);
			c3.actions[n].setFrames(db.AnimFramesArray[1]); 
			c3.setAction(c3.actions[n],0,true);
			break;
		}
	}
}	
var moveP2 = function() {
		
	if ((c3.actions)&&(!db.evtPAnim)){ 
		for(n in c3.actions) { 
			c3.actions[n].setStartFrame(db.AnimFramesArray[0]+1);
			c3.actions[n].setFrames(db.AnimFramesArray[1]); 
			c3.setAction(c3.actions[n],0,true);
			break;
		}
	}
}	
var movePf = function() {
	
	if ((db.evtJump)||(db.evtPreJump)) 
		return;
		
	if ((c2.actions)&&(!db.evtAnim)){  
		db.evtPAnimWalk=true; 
		for(n in c2.actions) { 
			c2.actions[n].setStartFrame(db.AnimFramesArray[2]);
			c2.actions[n].setFrames(db.AnimFramesArray[3]); 
			db.evtAnim=true; 
			c2.setAction(c2.actions[n],0,true);
			play_multi_sound('multiaudio1');
			break;			
		} 
		setTimeout('db.evtAnim=false;db.evtPAnimWalk=false;if(!db.evtJump)moveP();',800);
	}
}
var movePf2 = function() {
	if ((c3.actions)&&(!db.evtPAnim)){  
		
		for(n in c3.actions) { 
			c3.actions[n].setStartFrame(db.AnimFramesArray[2]);
			c3.actions[n].setFrames(150); 			
			db.evtPAnim=true; 
			c3.setAction(c3.actions[n],0,false);
			break;
		} 
		
		setTimeout('db.evtPAnim=false;moveP2();',1000);
	}
}
var moveJump = function() {
	
	if ((c2.actions)&&((!db.evtAnim)||(db.evtPAnimWalk))){  
		db.evtPAnimWalk= false; 
		for(n in c2.actions) { 
			c2.actions[n].setStartFrame(db.AnimFramesArray[2]);
			c2.actions[n].setFrames(db.AnimFramesArray[3]); 
			db.evtAnim=true; 
			c2.setAction(c2.actions[n],0,false);
			break;
		} 
		setTimeout('db.evtAnim=false;db.evtJump=false;db.evtPreJump=false;db.evtJumped=true;moveP();',1000);
	}	
}

var random = function(maxNum) {
	return Math.ceil(Math.random() * maxNum);
}

var interlopateHeight = function(keep,value,obj,shift) {
	
	var keeped=keep;
	
	if (keep==0)
		keep=value;		

	var dd=keep;
		
	if (value>keep+shift) 
		dd=keep+shift;
	if (value<keep-shift) 
		dd=keep-shift;

	obj.Lookat([db.cubepos.x,db.cubepos.y,dd]);
	
	keep=value;
	
	if (value>keeped+shift) 
		keep=value+shift;
	if (value<keeped-shift) 
		keep=value-shift;
		
	return keep;
}	 

var setDomEvents = function(iRenderer) {
	$('#canvas').mousedown( function(e) { window.DB.evtPick = true; } );
	$('#canvas').mouseup( function(e) { window.DB.evtPick = false; } );
	$('#mcur').show().css({"left":(iRenderer.renderWidth/2-20)+"px","top":(iRenderer.renderHeight/2-20)+"px"});
}

renderer._load("example/meshes/nature.xml");
