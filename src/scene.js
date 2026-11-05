import * as THREE from 'three';
import { CROP_BY_ID, ITEM_BY_ID, cropStatus, progress, itemReady } from './game.js';

const COLORS = { grass: 0x93ae70, grass2: 0x9bb57c, dirt: 0x765542, side: 0x8b7652, cream: 0xf3edda, green: 0x517750 };
const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1), sphere: new THREE.IcosahedronGeometry(1, 1), cone: new THREE.ConeGeometry(1, 1, 6), cylinder: new THREE.CylinderGeometry(1, 1, 1, 8), leaf: new THREE.SphereGeometry(1, 5, 3),
};
const materials = new Map();
function material(color) { if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .95, flatShading: true })); return materials.get(color); }
function mesh(kind, color, x, y, z, sx, sy, sz, parent) {
  const obj = new THREE.Mesh(geometries[kind], material(color)); obj.position.set(x,y,z); obj.scale.set(sx,sy,sz); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
}
function tree(parent,x,z,fruit=false) {
  mesh('cylinder',0x866444,x,.6,z,.11,1.2,.11,parent);
  const crown = new THREE.Group(); crown.position.set(x,1.25,z); parent.add(crown);
  mesh('sphere',0x638c57,0,.14,0,.63,.68,.62,crown);
  mesh('sphere',0x7a9d64,-.25,.46,.06,.43,.47,.44,crown);
  mesh('sphere',0x8caa6b,.27,.3,.15,.41,.42,.43,crown);
  if (fruit) for (let i=0;i<6;i++) { const a=i*2.399; mesh('sphere',0xc65b48,Math.sin(a)*.51,.1+(i%3)*.18,Math.cos(a)*.51,.075,.08,.075,crown); }
}
function fence(parent,x,z,rot=0) {
  const g = new THREE.Group(); g.position.set(x,.06,z); g.rotation.y=rot; parent.add(g);
  mesh('box',COLORS.cream,-.42,.3,0,.085,.65,.085,g); mesh('box',COLORS.cream,.42,.3,0,.085,.65,.085,g);
  mesh('box',COLORS.cream,0,.22,0,.9,.075,.06,g); mesh('box',COLORS.cream,0,.46,0,.9,.075,.06,g);
}
function chicken(parent,ready) {
  mesh('sphere',0xf4eddc,0,.28,0,.25,.24,.31,parent); mesh('sphere',0xfaf4e7,.17,.5,.1,.14,.17,.15,parent);
  mesh('cone',0xd3a14c,.3,.48,.13,.07,.13,.07,parent).rotation.z=-Math.PI/2;
  mesh('sphere',0xbd5748,.17,.67,.1,.08,.09,.055,parent);
  mesh('sphere',0x2d342b,.23,.53,.21,.025,.025,.025,parent);
  mesh('cylinder',0xc9a151,-.05,.1,0,.025,.2,.025,parent); mesh('cylinder',0xc9a151,.09,.1,0,.025,.2,.025,parent);
  if(ready) { mesh('sphere',0xf5e7bd,-.28,.09,.2,.08,.1,.07,parent); mesh('sphere',0xf5e7bd,-.18,.09,.3,.08,.1,.07,parent); }
}
function barn(parent) {
  const g=new THREE.Group(); g.position.set(-2.5,.05,-8.05); parent.add(g);
  mesh('box',0xb76b53,0,.65,0,2.2,1.3,1.7,g);
  const roof=mesh('cylinder',0x475f59,0,1.45,0,1.64,.36,1.64,g); roof.geometry = new THREE.CylinderGeometry(0,1,1,4); roof.rotation.y=Math.PI/4; roof.scale.set(1.65,.9,1.4);
  mesh('box',0xf3e8ce,0,.47,.868,.77,.93,.035,g); mesh('box',0x725746,0,.46,.892,.62,.82,.02,g);
  mesh('box',0xf3e8ce,0,.46,.91,.03,.82,.025,g); const cross=mesh('box',0xf3e8ce,0,.44,.91,.035,1.01,.025,g); cross.rotation.z=.64;
  mesh('box',0xf3e8ce,-.78,.79,.868,.3,.35,.03,g); mesh('box',0x64867e,-.78,.79,.89,.22,.27,.02,g);
  mesh('box',0xf3e8ce,.78,.79,.868,.3,.35,.03,g); mesh('box',0x64867e,.78,.79,.89,.22,.27,.02,g);
  mesh('cylinder',0xd7c8a5,2,.75,-.2,.48,1.5,.48,g); mesh('cone',0x687769,2,1.65,-.2,.55,.42,.55,g);
}
function sprout(parent,crop,status,p) {
  const wilt=status==='withered'; const ready=status==='ready'; const leaf=wilt?0x88724e:0x648b45;
  const growth=wilt?1:(.25+p*.75);
  for(let i=0;i<4;i++) {
    const x=(i%2-.5)*.43,z=(Math.floor(i/2)-.5)*.43;
    const g=new THREE.Group(); g.position.set(x,.05,z); g.scale.setScalar(growth); parent.add(g);
    if(crop.id==='wheat'||crop.id==='rice') {
      for(let j=0;j<3;j++) { const stalk=mesh('cylinder',wilt?0x897650:ready?0xcead59:0x7d9b57,(j-1)*.09,.3,0,.015,.6,.015,g); stalk.rotation.z=(j-1)*.12; mesh('sphere',wilt?0x897650:ready?0xe0bd65:0x97b56c,(j-1)*.12,.62,0,.055,.16,.055,g); }
    } else {
      mesh('cylinder',leaf,0,.14,0,.025,.28,.025,g);
      for(let j=0;j<3;j++) { const a=j*2.094; const l=mesh('leaf',leaf,Math.sin(a)*.12,.18,Math.cos(a)*.12,.16,.045,.09,g); l.rotation.y=-a; l.rotation.z=wilt?.5:.15; }
      if(ready||wilt||p>.7) {
        const col=wilt?0x78604c:new THREE.Color(crop.color);
        if(crop.id==='pumpkin') { mesh('sphere',col,0,.15,0,.18,.15,.18,g); mesh('cylinder',0x617944,0,.3,0,.025,.1,.025,g); }
        else if(crop.id==='eggplant') mesh('sphere',col,.07,.13,.04,.07,.15,.07,g).rotation.z=.3;
        else if(crop.id==='soybean') { mesh('sphere',col,.1,.22,.05,.05,.13,.05,g); mesh('sphere',col,-.1,.2,0,.05,.12,.05,g); }
        else { mesh('sphere',col,.1,.13,.08,.075,.085,.075,g); mesh('sphere',col,-.1,.14,.03,.065,.075,.065,g); }
      }
    }
  }
}
export class FarmScene {
  constructor(container,onSelect,onHover) {
    this.container=container; this.onSelect=onSelect; this.onHover=onHover; this.objects=[]; this.tileGroups=[]; this.zoom=1;
    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color(0xc8d4bc);
    this.camera=new THREE.OrthographicCamera(-11,11,9,-9,.1,100); this.camera.position.set(15,19,18); this.camera.lookAt(0,0,-.7);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false}); this.renderer.setPixelRatio(Math.min(devicePixelRatio,2)); this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap; this.renderer.outputColorSpace=THREE.SRGBColorSpace; container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','Isometric farm. Click a plot to use your selected tool. Use Plot list for keyboard controls.'); this.renderer.domElement.setAttribute('role','img');
    this.scene.add(new THREE.HemisphereLight(0xfff8e7,0x66815d,2.8)); const sun=new THREE.DirectionalLight(0xffefd1,3); sun.position.set(-8,18,7); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:50}); sun.shadow.bias=-.001; this.scene.add(sun);
    mesh('box',0xa5b78f,0,-.53,-.8,18,.6,18,this.scene);
    mesh('box',0x8e7b56,0,-.25,0,13.1,.65,13.1,this.scene); mesh('box',0x91ab6d,0,.02,0,13,.1,13,this.scene);
    for(let i=0;i<144;i++) {
      const x=i%12-5.5,z=Math.floor(i/12)-5.5; const tile=mesh('box',(i+Math.floor(i/12))%2?COLORS.grass:COLORS.grass2,x,.08,z,.98,.07,.98,this.scene); tile.userData.index=i; this.objects.push(tile);
      const g=new THREE.Group(); g.position.set(x,.12,z); this.scene.add(g); this.tileGroups.push(g);
    }
    for(let i=0;i<13;i++) { if(i<5||i>7) fence(this.scene,i-6,6.5); fence(this.scene,i-6,-6.5); fence(this.scene,-6.5,i-6,Math.PI/2); fence(this.scene,6.5,i-6,Math.PI/2); }
    barn(this.scene); tree(this.scene,-7.8,-5.8);tree(this.scene,-8,-2);tree(this.scene,7.6,-6);tree(this.scene,8,-2);tree(this.scene,7.7,4);tree(this.scene,-7.4,4.7);
    for(let i=0;i<16;i++){ const a=i*2.399; const x=Math.sin(a)*7.5,z=Math.cos(a)*7.5; if(z<-6)continue; mesh('sphere',i%2?0x839b6f:0x8fa77b,x,0,z,.21,.23,.24,this.scene); }
    mesh('box',0xd0bc94,.2,.08,7.4,2,.05,1.8,this.scene);
    this.hoverMesh=new THREE.Mesh(new THREE.BoxGeometry(.97,.025,.97),new THREE.MeshBasicMaterial({color:0xfff8b5,transparent:true,opacity:.45})); this.hoverMesh.visible=false; this.scene.add(this.hoverMesh);
    this.raycaster=new THREE.Raycaster(); this.pointer=new THREE.Vector2();
    const pick=e=>{const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);return this.raycaster.intersectObjects(this.objects,false)[0]?.object.userData.index;};
    this.renderer.domElement.addEventListener('pointermove',e=>{const i=pick(e);if(i!==this.hoverIndex){this.hoverIndex=i;this.hoverMesh.visible=i!==undefined;if(i!==undefined)this.hoverMesh.position.set(i%12-5.5,.145,Math.floor(i/12)-5.5);onHover(i);this.renderer.render(this.scene,this.camera);}});
    this.renderer.domElement.addEventListener('pointerleave',()=>{this.hoverMesh.visible=false;this.hoverIndex=undefined;onHover(undefined);this.renderer.render(this.scene,this.camera);});
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};});
    this.renderer.domElement.addEventListener('pointerup',e=>{if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<8){const i=pick(e);if(i!==undefined)onSelect(i);}this.down=null;});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container); this.resize();
    this.renderer.render(this.scene,this.camera);
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);const aspect=w/h,vertical=aspect<1?12:9.4;this.camera.left=-vertical*aspect;this.camera.right=vertical*aspect;this.camera.top=vertical;this.camera.bottom=-vertical;this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);}
  setZoom(delta){this.zoom=THREE.MathUtils.clamp(this.zoom+delta,.65,1.65);this.resize();}
  update(state,now){
    let dirty=false;
    for(let i=0;i<144;i++){
      const tile=state.tiles[i],g=this.tileGroups[i],status=cropStatus(tile,now),p=progress(tile,now);const key=JSON.stringify(tile)+status+Math.floor(p*4)+itemReady(tile,now);
      if(g.userData.key===key)continue;dirty=true;g.userData.key=key;g.clear();
      this.objects[i].material=material(tile.kind==='grass'||tile.kind==='item'?((i+Math.floor(i/12))%2?COLORS.grass:COLORS.grass2):tile.kind==='fallow'?0x93755a:COLORS.dirt);
      if(['plowed','crop'].includes(tile.kind))for(let row=0;row<5;row++)mesh('box',0x5e4538,0,.02,(row-2)*.17,.86,.03,.045,g);
      if(tile.kind==='crop')sprout(g,CROP_BY_ID[tile.crop],status,p);
      if(tile.kind==='item'){
        if(tile.item==='apple')tree(g,0,0,itemReady(tile,now));
        else if(tile.item==='chicken')chicken(g,itemReady(tile,now));
        else if(tile.item==='hay'){mesh('box',0xd7bb70,0,.25,0,.7,.5,.56,g);mesh('box',0xae8b4f,-.22,.26,0,.035,.52,.58,g);mesh('box',0xae8b4f,.22,.26,0,.035,.52,.58,g);}
        else fence(g,0,0);
      }
      if(status==='ready'||itemReady(tile,now)){const mark=mesh('sphere',0xf5d782,.32,.7,.32,.07,.07,.07,g);mark.castShadow=false;}
    }
    if(dirty)this.renderer.render(this.scene,this.camera);
  }
  destroy(){cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.renderer.dispose();}
}
