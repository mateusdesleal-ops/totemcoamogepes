/* Frota Coamo: cabine branca e bitrem claro com lonas azuis.
   Modelo leve em geometria nativa; marcas vêm dos arquivos oficiais existentes.
   Frente em +z, como os modelos de máquinas. Dimensões preservam as rotas. */
import * as THREE from "three";
export function createCoamoTruck(W) {
  const { RB, mergeGroup } = W.kit;
  const g = new THREE.Group(); g.name = "frota-coamo";
  const m = (color, roughness = .5, metalness = .15) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const white = m("#f4f4ef"), dark = m("#252a30"), blue = m("#144dab", .85, 0);
  const rim = m("#cbd1d6", .26, .8), rubber = m("#151719", .95, 0), glass = m("#183039", .16, .5);
  const red = m("#c63230"), lamp = m("#fff4d8");
  const add = (geo, mat, x, y, z, parent=g) => { const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o; };
  const box=(w,h,d,mat,x,y,z,parent=g)=>add(RB(w,h,d,.05,2),mat,x,y,z,parent);
  const tex = file => { const t=new THREE.TextureLoader().load(file);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t; };
  const logo=new THREE.MeshBasicMaterial({map:tex('assets/logo_verde.png'),transparent:true});
  const logoWhite=new THREE.MeshBasicMaterial({map:tex('assets/logo.png'),transparent:true});
  function sign(w,mat,x,y,z,ry=0,parent=g) {const p=add(new THREE.PlaneGeometry(w,w*670/1478),mat,x,y,z,parent);p.rotation.y=ry;return p;}
  // Build along +x, then rotate to the model convention (+z).
  box(11.9,.25,1.65,dark,-.1,.88,0);
  box(2.35,2.7,2.45,white,4.75,2.27,0);
  box(2.15,.65,2.35,white,4.65,3.85,0);
  box(.09,1.18,2.15,glass,5.96,2.9,0);
  box(.12,1.05,1.95,dark,5.98,1.62,0);
  for(const y of [1.27,1.55,1.83])box(.15,.06,1.8,rim,6.04,y,0);
  box(.2,.24,2.45,white,6.02,.95,0);
  box(.08,.44,2.22,white,5.98,3.7,0);
  sign(1.2,logo,6.03,3.7,0,Math.PI/2);
  for(const side of [-1,1]) {
    box(1.4,1.1,.07,glass,4.85,2.9,side*1.24);
    box(.24,.62,.22,dark,5.55,2.95,side*1.47);
    box(.12,.65,.32,lamp,6.03,1.3,side*.99);
    sign(.85,logo,4.8,1.95,side*1.264,side===1?0:Math.PI);
    box(1.5,.44,.44,rim,2.85,.85,side*.95);
  }
  // Two distinct trailers and visible connecting drawbar.
  const tarps=[];
  for(const x of [1.1,-3.55]) {
    box(4.25,1.35,2.5,white,x,2,0);
    box(4.3,.16,2.6,rim,x,2.72,0);
    const tarp=new THREE.Group();tarp.name='fleet-tarp';g.add(tarp);tarps.push(tarp);
    box(4.32,1.15,2.58,blue,x,3.33,0,tarp);
    const rolled=new THREE.Group();rolled.name='fleet-rolled-tarp';rolled.visible=false;g.add(rolled);
    const roll=add(new THREE.CylinderGeometry(.14,.14,4.25,10),blue,x,2.9,-1.15,rolled);roll.rotation.z=Math.PI/2;roll.userData.keep=true;
    for(const side of [-1,1]) {
      sign(1.1,logo,x,2.05,side*1.34,side===1?0:Math.PI);
      sign(2.25,logoWhite,x,3.35,side*1.3,side===1?0:Math.PI,tarp);
      for(let dx=-1.8;dx<=1.8;dx+=.6) {
        box(.055,1.25,.075,rim,x+dx,2,side*1.27);
        const rope=box(.022,1.2,.025,dark,x+dx,2.25,side*1.32);rope.rotation.z=.3;
        box(.28,.08,.04,Math.round((dx+1.8)/.6)%2?red:white,x+dx,1.46,side*1.32);
      }
    }
  }
  // Grain remains independently animated when the receiving truck is uncovered.
  const heap=box(3.95,.32,2.2,m('#e0b54a',1,0),1.1,2.8,0);heap.name='fleet-heap';heap.visible=false;heap.userData.keep=true;
  for(const x of [4.8,2.9,2.15,-.1,-.82,-1.54,-4.1,-4.82,-5.54])for(const side of [-1,1]) {
    const wheel=new THREE.Group();wheel.name='fleet-wheel';wheel.position.set(x,.57,side*1.19);g.add(wheel);
    const tire=add(new THREE.CylinderGeometry(.57,.57,.4,16),rubber,0,0,0,wheel);tire.rotation.x=Math.PI/2;tire.userData.keep=true;
    const hub=add(new THREE.CylinderGeometry(.33,.33,.42,12),rim,0,0,0,wheel);hub.rotation.x=Math.PI/2;hub.userData.keep=true;
  }
  for(const z of [-.9,.9])box(.07,.18,.32,red,-5.72,1.15,z);
  // Do not bake the tarp: it must open independently at the receiving pit.
  tarps.forEach(t=>t.traverse(o=>{if(o.isMesh)o.userData.keep=true;}));
  mergeGroup(g);
  g.rotation.y=-Math.PI/2;
  return g;
}
