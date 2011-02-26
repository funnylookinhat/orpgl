//emmanuel.botros@gmail.com (2011) - Creative Commons BY 3.0 License Terms//
//------------------------------------------------------------------------//

// Renderer Class handles communication with the 3d engine
function Renderer() {
	this.gameRenderer = null; 				// game renderer
	this.gameScene 	= null;					// game scene
	this.canvasEl	= null;					// canvas element name
	this.renderWidth = null;				// screen w size
	this.renderHeight= null;				// screen h size
	this.lasttime=null;						// last rendering time
	this.now=null;							// current time
	this.mouse=null;						// I/O mouse handler
	this.camera =null;						// main camera handler
	this.keys =null;						// I/O keyboard handler
	this.pPos = new PosRot(0,0,0,0,0,0);	// player pos & rot between loops
	this.numEnnemies=0;				 		// number of ennemies
	this.ennemyArray =null;				 	// ennemies obj array
	this.doc=new GLGE.Document();			// initiate the document handler
}

// START : GLGE INTERFACE //
// *** load *** load a xml scene
Renderer.prototype.load = function (doc) {
	this.doc.load(doc);
}

// *** initobjects *** add a collection of objects to a js object
Renderer.prototype.initobjects = function (database,collection) {
	for (var prop in collection) {
		database[prop]=this.getmesh(collection[prop]);	
	}
}

// *** getheight *** get vertical distance to the ground for given position
Renderer.prototype.getheight = function(pos,shift){
	if(this.camera.matrix && this.camera.pMatrix){
		var H=0;
		if (shift!=null)
			H=shift;
		var origin=[pos.x,pos.y,H];
		var ret=this.gameScene.ray(origin,[0,0,1]);		

		if (ret['object']['id']=='Plane')
			return ret['distance'];
			
		return false;
	}
	else 
		return false;
}

// *** pick *** handle mouse picking
Renderer.prototype.pick = function(x,y){
	if(!this.camera){
		GLGE.error("No camera set for picking");
		return false;
	}else if(this.camera.matrix && this.camera.pMatrix){
		var height=this.gameRenderer.getViewportHeight();
		var width=this.gameRenderer.getViewportWidth();
		var offsetx=this.gameRenderer.getViewportOffsetX();
		var offsety=this.gameRenderer.getViewportHeight()-this.gameRenderer.canvas.height+this.gameRenderer.getViewportOffsetY();
		var xcoord =  ((x-offsetx)/width-0.5)*2;
		var ycoord = -((y+offsety)/height-0.5)*2;
		var invViewProj=GLGE.mulMat4(GLGE.inverseMat4(this.camera.matrix),GLGE.inverseMat4(this.camera.pMatrix));
		var origin =GLGE.mulMat4Vec4(invViewProj,[xcoord,ycoord,-1,1]);
		origin=[origin[0]/origin[3],origin[1]/origin[3],origin[2]/origin[3]];
		var coord =GLGE.mulMat4Vec4(invViewProj,[xcoord,ycoord,1,1]);
		coord=[-(coord[0]/coord[3]-origin[0]),-(coord[1]/coord[3]-origin[1]),-(coord[2]/coord[3]-origin[2])];
		coord=GLGE.toUnitVec3(coord);
		var ret = this.gameScene.ray(origin,coord);
		return ret;
	}else{
		return false;
	}
}

// *** getray *** check collision state after a mouse click
Renderer.prototype.getray = function (database,mousepos) {
	
	// get the screen center's position
	var aimX=this.renderWidth/2;
	var aimY=this.renderHeight/2;

	// if user clicked AND ray timeout is passed
	if 	((!database.eRay)&&(database.ePick)) {		
		
		// get collision test result
		var hitObj=this.pick(aimX, aimY); 
		
		// the ray actually hit something
		if(hitObj['coord']) {	
			
			// rayPosStart: player position 
			// rayPosEnd: collision position
			database.rayPosStart=[database.playerPos.x,database.playerPos.y,database.playerPos.z+1.5]
			database.rayPosEnd=[hitObj['coord'][0],hitObj['coord'][1],hitObj['coord'][2]];

			// Set the initial position and rotation of the bullet
			this.setposx(database.bullet,(database.rayPosStart[0]));
			this.setposy(database.bullet,(database.rayPosStart[1]));
			this.setposz(database.bullet,(database.rayPosStart[2]));	
			this.setrotx(database.bullet,(cuberot.x+(Math.PI/2)));
			this.setroty(database.bullet,(cuberot.y));
			this.setrotz(database.bullet,(cuberot.z));
			
			// Server needs to know a collision just happened
			send('COLLISION:'+database.rayPosEnd);
			
			// hit an ennemy ?
			var hitObjName=hitObj['object']['id']+"_"
			if (hitObjName.substring(0,4)=='Moveable')
				database.pickedObj=hitObj['object'];
			
			// initiate bullet movement
			database.eRay=true;
			
			// can't fire faster then 10 bullet per sec
			setTimeout("window.DB.eRay=false;",100);
		}
	}	
	
	// handles the bullet movement
	if (database.eRay) {	

		// posi : next intermediate position of the bullet
		var posi=[];
		posi[0]	=	database.rayPosStart[0]-(database.rayPosStart[0]-database.rayPosEnd[0])/10;
		posi[1]	=	database.rayPosStart[1]-(database.rayPosStart[1]-database.rayPosEnd[1])/10;
		posi[2]	=	database.rayPosStart[2]-(database.rayPosStart[2]-database.rayPosEnd[2])/10;

		// moves the bullet along its path
		this.setposx(database.bullet,(posi[0]));
		this.setposy(database.bullet,(posi[1]));
		this.setposz(database.bullet,(posi[2]));
		
		// keep new "start" position for next pass
		database.rayPosStart[0]	=	posi[0]
		database.rayPosStart[1]	=	posi[1]
		database.rayPosStart[2]	=	posi[2]
		
		// loop in the enemies' collection
		for(var i = 0; i < this.numEnnemies; i++) {									
			
			// calcutate distance btween the bullet and the ennemy
			var dX =  this.ennemyArray[i].x-posi[0];
			var dY =  this.ennemyArray[i].y-posi[1];				
			var dist =  Math.sqrt(dX * dX + dY * dY);

			// if distance < 5 : kill the ennemy
			if (dist<5) {
				this.setposz(this.ennemyArray[i].el,(-1000));			
			}
		}
	}
}

// *** lookat *** Rotate object to face given position
Renderer.prototype.lookat = function (o,pos) {
	o.Lookat(pos)
}

// *** setheightfrustrum *** set object height restricted by given frustrum variables (keep,shift,value)
Renderer.prototype.setheightfrustrum = function(keep,value,obj,shift) {
	
	var keeped=keep;
	
	if (keep==0)
		keep=value;		

	var dd=keep;
		
	if (value>keep+shift) 
		dd=keep+shift;
	if (value<keep-shift) 
		dd=keep-shift;

	this.lookat(obj,[db.playerPos.x,db.playerPos.y,dd]);
	
	keep=value;
	
	if (value>keeped+shift) 
		keep=value+shift;
	if (value<keeped-shift) 
		keep=value-shift;
		
	return keep;
}	 

// *** process *** main loop
Renderer.prototype.process = function (database){

	var camera = this.getcam();
	var mousepos = this.getmousepos();

	mousepos.x = mousepos.x - document.body.offsetLeft;
	mousepos.y = mousepos.y	- document.body.offsetTop;			

	var camerapos = this.getpos(camera);
	var camerarot = this.getrot(camera);
	
	database.playerPos = this.getpos(database.cube);
	
	cuberot = this.getrot(database.cube);
	groundObjectpos = this.getpos(database.groundObject);
	
	headrot =  this.getrot(database.head);
	
	this.getray(database,mousepos);
	
	inc = ((mousepos.y - (document.getElementById('canvas').offsetHeight / 2)) / 200)+2;
	inc2 = (mousepos.x - (document.getElementById('canvas').offsetWidth / 2)) / 200;
	
	if (inc <=0.5) inc=0.5;
	var trans=GLGE.mulMat4Vec4(camera.getRotMatrix(),[0,0,-1,1]);
	var mag=Math.pow(Math.pow(trans[0],2)+Math.pow(trans[1],2),0.5);
	trans[0]=trans[0]/mag;
	trans[1]=trans[1]/mag;
	
	if (inc<1) {
		this.setrotx(database.cube,(inc/1000));
		this.setrotx(database.head,(inc/1000));
	}
	
	this.setrotz(database.cube,(-inc2*2+1.57));
	this.setrotz(database.head,(-inc2*2));
	
	var H2=this.getheight(db.playerPos,null);

	if (H2!=false)
		renderer.buildnature(db);
		
	if (database.playerHeight==null)database.playerHeight=0;
	
	if ((!database.eJump))
		this.setposz(database.cube,(-H2));	

	$("#tim1").html("");
	for(prop in db)	
			$("#tim1").append(prop+" "+ db[prop]+"<br>");

	if (database.eJumped) {
		this.setposz(database.cube,(database.playerPos.z-.1));	
		setTimeout("window.DB.eJumped=false",500);
	}		
		
	if (database.eJump)
		this.setposz(database.cube,(database.playerPos.z+.1));	
	
	database.playerHeight=H2
	
	var mat=database.cube.getRotMatrix();
	var trans=GLGE.mulMat4Vec4(mat,[0,1,-1,1]);
	var mag=Math.pow(Math.pow(trans[0],2)+Math.pow(trans[1],2),0.5);
	if (database.eJump) {
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
	
	if(this.keys.isKeyPressed(GLGE.KI_SPACE)) {setTimeout("window.DB.eJump=true",1);database.ePreJump=true;moveJump(); }
	if(this.keys.isKeyPressed(GLGE.KI_DOWN_ARROW)) {incY+=parseFloat(trans[1]);incX+=parseFloat(trans[0]);if((!database.ePreJump)&&(!database.eJump))movePf();}
	if(this.keys.isKeyPressed(GLGE.KI_UP_ARROW)) {incY-=parseFloat(trans[1]);incX-=parseFloat(trans[0]);if((!database.ePreJump)&&(!database.eJump))movePf();} 
	if(this.keys.isKeyPressed(GLGE.KI_RIGHT_ARROW)) {incY+=parseFloat(trans[0]);incX-=parseFloat(trans[1]);if((!database.ePreJump)&&(!database.eJump))movePf();}
	if(this.keys.isKeyPressed(GLGE.KI_LEFT_ARROW)) {incY-=parseFloat(trans[0]);incX+=parseFloat(trans[1]);if((!database.ePreJump)&&(!database.eJump))movePf();}
	
	this.setposy(database.cube,(database.playerPos.y+incY*0.5*database.playerHeight/100));
	this.setposx(database.cube,(database.playerPos.x+incX*0.5*database.playerHeight/100));	

	this.setposz(camera,(database.playerPos.z+1.6-cuberot.x*1000+inc));

	cuberot = this.getrot(database.cube);
	headpos = this.getpos(database.head);
	headrot = this.getrot(database.head);
	this.setposx(camera,(database.playerPos.x-2*inc*Math.cos((headrot.z) * 57 *Math.PI / 180)));
	this.setposy(camera,(database.playerPos.y-2*inc*Math.sin((headrot.z) * 57* Math.PI / 180)));
	
	this.setposz(database.head,(database.playerPos.z-1.08));
	this.setposx(database.head,(database.playerPos.x));
	this.setposy(database.head,(database.playerPos.y));
	
	database.playerTempHeight=this.setheightfrustrum(database.playerTempHeight,(database.playerPos.z+2+inc/1000),camera,0.001);
		
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
Renderer.prototype.setposx = function (o,x) {
	o.setLocX(x);
}

Renderer.prototype.setposy= function (o,y) {	
	o.setLocY(y);
}

Renderer.prototype.setposz= function (o,z) {
	o.setLocZ(z);
}

// set object rotation in 3d	
Renderer.prototype.setrotx= function (o,x) {
	o.setRotX(x);
}

Renderer.prototype.setroty= function (o,y) {
	o.setRotY(y);
}

Renderer.prototype.setrotz= function (o,z) {
	o.setRotZ(z);
}

// push an object in a object collection
Renderer.prototype.addobj = function (o,o2) {
	o.addObject(o2);
}

// create a new object
Renderer.prototype.setobj = function (mesh,name,posrot,mat,pick,bag,counter,type,tvar) {
	
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
		this.setposx(obj,x);
	if (y!=null)
		this.setposy(obj,y);
	if (z!=null)
		this.setposz(obj,z);		
	if (rx!=null)
		this.setrotx(obj,rx);
	if (ry!=null)
		this.setroty(obj,ry);
	if (rz!=null)
		this.setrotz(obj,rz);

	this.addobj(bag,obj);
	posSav = this.getpos(obj)
	
	if (type==0)
		tvar.el=obj;
			
	if (type==1)
		tvar.push(obj);		
}

// sets the game renderer size
Renderer.prototype.setgr = function (el) {
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
Renderer.prototype.setsc = function (name) {
	this.gameScene = new GLGE.Scene();
	this.gameScene = this.doc.getElement(name)
	this.gameRenderer.setScene(this.gameScene);
	this.gameRenderer.canvas.width = this.renderWidth;
	this.gameRenderer.canvas.height = this.renderHeight;
}

// create the main camera
Renderer.prototype.setcam = function () {
	var camera = this.gameScene.camera;
	camera.setAspect(this.renderWidth/this.renderHeight);
	this.camera=camera;
}

// get mesh from object name
Renderer.prototype.getmesh = function (name) {
	return this.doc.getElement(name);
}

// set the ambient fog
Renderer.prototype.setfog = function (near, far) {		
	this.gameScene.setFogType(GLGE.FOG_QUADRATIC);
	this.gameScene.fogNear=near;
	this.gameScene.fogFar=far;
}	

// create the mouse handler	
Renderer.prototype.getmouse = function () {
	this.mouse =	new GLGE.MouseInput(document.getElementById(this.canvasEl));
}	

// get current mouse pos
Renderer.prototype.getmousepos = function () {
	return this.mouse.getMousePosition();
}

// get current object pos (x,y,z)
Renderer.prototype.getpos = function (obj) {	
	return obj.getPosition();
}

// get current object pos (rx,ry,rz)
Renderer.prototype.getrot = function (obj) {	
	return obj.getRotation();
}

// return the main camera
Renderer.prototype.getcam = function () {		
	return this.gameScene.camera;	
};

// create the keys handler
Renderer.prototype.getkeyboard = function () {		
	this.keys = new GLGE.KeyInput();
};

Renderer.prototype.render = function () {
	this.now = parseInt(new Date().getTime());
	this.gameRenderer.render();
	this.lasttime = this.now;		
}
// set a collection of objects to the ground
Renderer.prototype.setobjectsground = function (database,coll) {
	for (var i=0;i<coll.count;i++) {
		cup=database.cube.getPosition();
		cp =coll.cElems[i].getPosition();
		this.setposx(database.cube,cp.x);
		this.setposy(database.cube,cp.y);
		database.playerPos = this.getpos(database.cube);
		H3=this.getheight(database.playerPos,null);
		this.setposz(coll.cElems[i],-H3+1);
		this.setposx(database.cube,cup.x);
		this.setposy(database.cube,cup.y);
		database.playerPos = this.getpos(database.cube);
	}
}

Renderer.prototype.buildnature = function (database) {
		if (!database.eClusterCrea){
			database.Forest=new Cluster(this,database);
			database.Forest.load(database.tree,database.ObjBag,database.materialGrass,0);	
			database.Grass=new Cluster(this,database);
			database.Grass.load(database.bush,database.ObjBag,database.materialFlower,1);	
			database.Branches=new Cluster(this,database);
			database.Branches.load(database.branches,database.ObjBag,database.materialBush,2);	
			database.eClusterCrea=true;	
		}
		
		if((database.eClusterCrea)&&(!database.eClusterPos)) { 
			this.setobjectsground(database,database.Grass);
			this.setobjectsground(database,database.Branches);
			this.setobjectsground(database,database.Forest);
			database.eClusterPos=true;
		}
}
// END : GLGE INTERFACE //

// DB Class handles objects instances and in-game variables
function DB() {
	
	this.eJump		= false; 		
	this.eJumped		= false; 		
	this.ePreJump		= false; 		
	this.eAnim		= false;			
	this.ePAnim		= false;			
	this.ePAnimWalk	= false;	
    this.ePick		= false; 	
	this.eRay			= false; 	
	this.eClusterCrea = false; 
	this.eClusterPos	= false;	
	
	this.pickedObj		= null;
	this.rayPosStart	= null
	this.rayPosEnd		= null;
	this.playerHeight	= null;
	this.tempHeight		= null;
	this.playerPos	= null;
	this.objectsCounter	= 0;
	this.tick		= false;
	
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
function Cluster(_rd,_db) {
	this.clusterObj=null;
	this.objContainer=null;
	this.count=0;
	this.Elems=null;
	this.cElems=[];
	this.idx=-1;
	this.rd=_rd;
	this.dtb=_db;
}

Cluster.prototype.load = function (obj,cont,mat,idx) {
		this.idx=idx;
		this.Elems=Nature[idx];
		this.count=this.Elems.length;		
		this.clusterObj=obj;
		this.objContainer=cont;
		
		for (var i=0;i<this.count;i++) {
			// rd is a Renderer Instance
			this.rd.setobj( this.clusterObj.getMesh(),"Cube_",(new PosRot(this.Elems[i][0],this.Elems[i][1],null,null,this.Elems[i][2],this.Elems[i][3])),mat,false,this.objContainer,db.objectsCounter++,1,this.cElems);
		}
		
		this.dtb.eClusterCrea=true;
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
					
	renderer.setgr('canvas');
	renderer.setsc("Scene");
	renderer.setfog(20,2000);	
	renderer.setcam();
	renderer.getmouse();
	renderer.getkeyboard();
	renderer.initobjects(db,initObjs);
	renderer.setposz(db.groundObject,150);
	setDomEvents(renderer);
	
	setTimeout('moveP();moveP2();',1000); 
	
	//init ennemies
	renderer.ennemyArray = [];
	renderer.numEnnemies = 10;
	for(var i = 0; i < renderer.numEnnemies; i++) {
		renderer.ennemyArray.push(new Moveable(random(100), random(100),db.materialGrass));
		renderer.setobj( db.robot,"Moveable_",(new PosRot(null,renderer.ennemyArray[i].y,renderer.ennemyArray[i].z,-250,null,null)),db.materialRobot,true,db.ObjBag,db.objectsCounter++,0,renderer.ennemyArray[i]);
	}
	
	function moveEnnemies() {
		for(var i = 0; i < renderer.numEnnemies; i++) {					
		var distanceX = 0;
		var distanceY = 0; 
		var nPosX = 0;
		var nPosY = 0; 
		var distX = renderer.ennemyArray[i].x - db.playerPos.x;
		var distY = renderer.ennemyArray[i].y - db.playerPos.y;
		var distance =  Math.sqrt(distX * distX + distY * distY);
		
		if (distance>50) {
			
			if (( renderer.ennemyArray[i].x>db.playerPos.x))
				distanceX = -1/distance*distance/500;
			else
				distanceX = 1/distance*distance/500;
			if (( renderer.ennemyArray[i].y>db.playerPos.y))
				distanceY = -1/distance*distance/500;
			else
				distanceY = 1/distance*distance/500;

			}
	
			if (distanceY>0)renderer.ennemyArray[i].accelY+=1;
			else renderer.ennemyArray[i].accelY-=1;
			if (distanceX>0)renderer.ennemyArray[i].accelX+=1;
			else renderer.ennemyArray[i].accelX-=1;
			
			nPosX=renderer.ennemyArray[i].x+distanceX+renderer.ennemyArray[i].accelX/1000
			nPosY=renderer.ennemyArray[i].y+distanceY+renderer.ennemyArray[i].accelY/1000
			
			renderer.setposx(renderer.ennemyArray[i].el,nPosX);
			renderer.setposy(renderer.ennemyArray[i].el,nPosY);
			renderer.ennemyArray[i].x=nPosX
			renderer.ennemyArray[i].y=nPosY
		}
	}		
	
	canvas.onmousewheel = function( e ){
		delta=e.wheelDelta/40;
		if(delta!=0){
			renderer.camera.setFovY(parseFloat(renderer.camera.getFovY())-delta);
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
						
						renderer.setposx(db.player,(nlocX));
						renderer.setposy(db.player,(nlocY));
						renderer.setposz(db.player,(nlocZ+1));	
						renderer.setrotz(db.player,((strot[2])-4.8));
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
		renderer.process(window.DB);
		multi();
		moveEnnemies();
		renderer.render();		
	}
	
	setInterval(loop,1);
	var inc=.2;
};

var moveP = function() {
	if ((db.eJump)||(db.ePreJump)) 
		return;
		
	if ((c2.actions)&&(!db.eAnim)){ 
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
		
	if ((c3.actions)&&(!db.ePAnim)){ 
		for(n in c3.actions) { 
			c3.actions[n].setStartFrame(db.AnimFramesArray[0]+1);
			c3.actions[n].setFrames(db.AnimFramesArray[1]); 
			c3.setAction(c3.actions[n],0,true);
			break;
		}
	}
}	
var movePf = function() {
	
	if ((db.eJump)||(db.ePreJump)) 
		return;
		
	if ((c2.actions)&&(!db.eAnim)){  
		db.ePAnimWalk=true; 
		for(n in c2.actions) { 
			c2.actions[n].setStartFrame(db.AnimFramesArray[2]);
			c2.actions[n].setFrames(db.AnimFramesArray[3]); 
			db.eAnim=true; 
			c2.setAction(c2.actions[n],0,true);
			play_multi_sound('multiaudio1');
			break;			
		} 
		setTimeout('db.eAnim=false;db.ePAnimWalk=false;if(!db.eJump)moveP();',800);
	}
}
var movePf2 = function() {
	if ((c3.actions)&&(!db.ePAnim)){  
		
		for(n in c3.actions) { 
			c3.actions[n].setStartFrame(db.AnimFramesArray[2]);
			c3.actions[n].setFrames(150); 			
			db.ePAnim=true; 
			c3.setAction(c3.actions[n],0,false);
			break;
		} 
		
		setTimeout('db.ePAnim=false;moveP2();',1000);
	}
}
var moveJump = function() {
	
	if ((c2.actions)&&((!db.eAnim)||(db.ePAnimWalk))){  
		db.ePAnimWalk= false; 
		for(n in c2.actions) { 
			c2.actions[n].setStartFrame(db.AnimFramesArray[2]);
			c2.actions[n].setFrames(db.AnimFramesArray[3]); 
			db.eAnim=true; 
			c2.setAction(c2.actions[n],0,false);
			break;
		} 
		setTimeout('db.eAnim=false;db.eJump=false;db.ePreJump=false;db.eJumped=true;moveP();',1000);
	}	
}

var random = function(maxNum) {
	return Math.ceil(Math.random() * maxNum);
}

var setDomEvents = function(iRenderer) {
	$('#canvas').mousedown( function(e) { window.DB.ePick = true; } );
	$('#canvas').mouseup( function(e) { window.DB.ePick = false; } );
	$('#mcur').show().css({"left":(iRenderer.renderWidth/2-20)+"px","top":(iRenderer.renderHeight/2-20)+"px"});
}

renderer.load("example/meshes/nature.xml");
