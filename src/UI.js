import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import * as THREE from 'three';
import { store,  materials, wallItems } from './StateManager';

import { MapControls, OrbitControls } from './three/OrbitControls';
import { DRACOLoader } from './three/DRACOLoader';
import { GLTFLoader } from './three/GLTFLoader';
import { CSS2DObject, CSS2DRenderer } from './three/CSS2DRenderer';
// import { DragControls } from './three/DragControls';
let isMouseDown = false;

let isDrag = false;
let ceiling = new THREE.Mesh();
const offset = new THREE.Vector3();
const worldPos = new THREE.Vector3();
const orientation = new THREE.Quaternion();

let updateTimeout;

const gltfLoader = new GLTFLoader();

let selectedItem;
let hoverItem;

const rayWalls = [];

let selectedObject;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('js/');

gltfLoader.setDRACOLoader(dracoLoader);

const objects = [];

const mouse = new THREE.Vector2(), raycaster = new THREE.Raycaster();


let root = new THREE.Object3D();

const wallMat = new THREE.MeshStandardMaterial({ color: 'white' });
const wallOrigin = new THREE.Mesh(new THREE.BoxGeometry(.1, 1, 1), wallMat);
wallOrigin.geometry.translate(.05, .5, .5);

const canvas = document.createElement('canvas');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .01, 50);

camera.position.z = 8;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
const labelRenderer = new CSS2DRenderer();



renderer.outputEncoding = THREE.sRGBEncoding;

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.minDistance = 5;
orbitControls.maxDistance = 20;
orbitControls.maxPolarAngle = 1.5;
orbitControls.minAzimuthAngle = .1;
const frustum = 1000;

const orthoCam = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0, 30);
camera.position.y = 8;

orthoCam.position.y = 10;
orthoCam.zoom = 200;
const mapControls = new MapControls(orthoCam, labelRenderer.domElement);

mapControls.zoomSpeed = .5;
mapControls.enableRotate = false;

mapControls.screenSpacePanning = true;
mapControls.minZoom = 200;
mapControls.maxZoom = frustum;
orthoCam.updateProjectionMatrix();




function getWorldDirection(local,
    object) {
    object.getWorldQuaternion(orientation);
    return local.clone().applyQuaternion(orientation);
}
const texLoader = new THREE.TextureLoader();

const light = new THREE.PointLight('white', .5, 20, 1);
scene.add(light);


loadTextures()

function loadTextures() {

    wallMat.map = texLoader.load('assets/tiles/' + materials[0].diffuse);
    wallMat.roughnessMap = texLoader.load('assets/tiles/' + materials[0].specular);
    wallMat.normalMap = texLoader.load('assets/tiles/' + materials[0].normal);
    wallMat.roughnessMap.repeat.x = wallMat.roughnessMap.repeat.y = 2;
    wallMat.map.repeat.x = wallMat.map.repeat.y = 2;
    wallMat.normalMap.repeat.x = wallMat.normalMap.repeat.y = 2;
    wallMat.roughnessMap.wrapS = wallMat.roughnessMap.wrapT = THREE.RepeatWrapping;
    wallMat.map.wrapS = wallMat.map.wrapT = THREE.RepeatWrapping;
    wallMat.normalMap.wrapS = wallMat.normalMap.wrapT = THREE.RepeatWrapping;
    wallMat.needsUpdate = true;


}

scene.add(camera);

const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ side: THREE.BackSide, transparent: true }));

const InvisibleMat = new THREE.MeshBasicMaterial({ color: 'red', visible: false, transparent: true, opacity: .3 });
box.geometry.translate(0, .5, 0);
scene.add(box);
let door = new THREE.Mesh(new THREE.BoxGeometry(wallItems.door.width, wallItems.door.height, wallItems.door.depth), InvisibleMat);
door.geometry.translate(0, wallItems.door.height * .5, 0);



texLoader.load('assets/brown_photostudio_02.jpg', function (texture) {

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    var envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = new THREE.Color('white');

    texture.dispose();
    pmremGenerator.dispose();



});


function DragObject(vec3, object) {
  



}



function animate() {

    if (store.view === 1) {
        rayWalls.forEach(object => {
            // isFacingCamera(object);

        });
    }
    // isFacingCamera(ceiling);


    if (store.view === 1) {
        renderer.render(scene, camera);
        orbitControls.update();
    } else {
        renderer.render(scene, orthoCam);
        mapControls.update();
        labelRenderer.render(scene, orthoCam);
    }
    requestAnimationFrame(animate);



}

function resize() {
    const container = document.getElementById('canvas-container');
    renderer.setSize(container.clientWidth, container.clientWidth);
    labelRenderer.setSize(container.clientWidth, container.clientWidth);
}
animate();





window.onresize = resize;


const onmousedown = (e) => {

    isMouseDown = true;


    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);


    var objectIntersects = raycaster.intersectObjects(objects, false);


    if (objectIntersects.length > 0 && isMouseDown) {
        selectedItem = objectIntersects[0].object;
        orbitControls.enabled = false;
    }

}

const onmouseup = (e) => {

    isMouseDown = false;
    orbitControls.enabled = true;
    selectedItem = undefined;

    Update(store);
}



const onmousemove = (e) => {

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (e.touches) {
        mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(rayWalls, false);

    var objectIntersects = raycaster.intersectObjects(objects);


    if (intersects.length > 0) {


        selectedObject = intersects[0].object;
        if (isMouseDown && selectedItem) DragObject(intersects[0].point, selectedItem);

    } else {
        selectedObject = null;
    }

    if (objectIntersects.length > 0) {
        hoverItem = objectIntersects[0].object;
        hoverItem.material.visible = true;
    } else if (hoverItem) {
        hoverItem.material.visible = false;

    }




}

canvas.addEventListener('mousemove', onmousemove);
canvas.addEventListener('mousedown', onmousedown);
canvas.addEventListener('mouseup', onmouseup);






function Update() {
    if (updateTimeout) clearTimeout(updateTimeout);

    updateTimeout = setTimeout(() => {
        GenerateBathroom();

    }, 20);

}



function GenerateBathroom() {

    document.getElementById('measures').append(labelRenderer.domElement);

    orthoCam.position.y = store.Height;

    box.scale.x = store.Width;
    box.scale.y = store.Height;
    box.scale.z = store.Length;
    const foundationDepth = 0;
    light.position.y = store.Height;


    mapControls.enabled = !(orbitControls.enabled = store.view);


    if (root) scene.remove(root); root = new THREE.Object3D();
    scene.add(root);

    store.view === 0 ? root.position.y = -store.Height / 2 : root.position.y = 0;

    // store.view !== 1 && GenerateMeasurements();


}


const UI = observer(() => {

    useEffect(() => {
        const container = document.getElementById('canvas-container');
        container.innerHTML = '';
        container.append(canvas);
        resize();

    }, []);



    function AssignVal(e) {
        store[e.target.id] = e.target.value;

        // store.cwidth = Math.min(store.width - 1000, store.cwidth);
        // store.clength = Math.min(store.length - 1000, store.clength);
    }



    const types = [1, 2, 3, 4, 5];



    Update();


    return <div className='container vh-100 overflow-auto'>
        <div className="row">
            <div className="col-3">
            <img src="logo.png" className='mt-3' width={'100%'} alt="" />
                <h4 className='mt-3'>Room Dimensions</h4>
                <div className="d-flex flex-wrap w-100">
                    {types.map(type => {

                        return <div onClick={e => {

                            store.cwidth = Math.min(store.width - 1000, store.cwidth);
                            store.clength = Math.min(store.length - 1000, store.clength);
                            store.type = type
                        }} key={type} className={'tab' + (store.type === type ? ' active' : '')}>
                            <img src={"assets/ui/" + type + ".svg"} alt="" />
                        </div>
                    })}
                </div>
                <div className="form-group">
                    <label htmlFor="width" className="form-label">Romm width : {store.width}</label>
                    <input onChange={AssignVal} type="range" id='width' value={store.width} min={2000} max={10000} className="form-range" />
                </div>
                <div className="form-group">
                    <label htmlFor="length" className="form-label">Room length : {store.length}</label>
                    <input onChange={AssignVal} type="range" id='length' value={store.length} min={2000} max={10000} className="form-range" />
                </div>
                <div className="form-group">
                    <label htmlFor="height" className="form-label">Ceiling height : {store.height}</label>
                    <input onChange={AssignVal} type="range" id='height' value={store.height} min={2000} max={10000} className="form-range" />
                </div>

                {store.type > 1 && < div >
                    <div className="form-group">
                        <label htmlFor="cwidth" className="form-label">Cutout width : {store.cwidth}</label>
                        <input onChange={AssignVal} type="range" id='cwidth' value={store.cwidth} min={1000} max={store.width - 1000} className="form-range" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="clength" className="form-label">Cutout length : {store.clength}</label>
                        <input onChange={AssignVal} type="range" id='clength' value={store.clength} min={1000} max={store.length - 1000} className="form-range" />
                    </div>
                </div>}


            </div>
            <div className="col-8 position-relative p-0 m-2">
                <div id='measures' style={{ display: store.view !== 1 ? '' : 'none' }} className="top-0 start-0 position-absolute w-100 h-100">

                </div>
                <div id="canvas-container" className='border'>

                </div>
                <div className="views position-absolute end-0 top-0 mt-3">
                    <img onClick={e => store.view = 0} className={(store.view === 0 ? 'active ' : '') + 'btn p-2 bg-light m-1 rounded-5'} src="assets/ui/2d.svg" alt="" />
                    <img onClick={e => store.view = 1} className={(store.view === 1 ? 'active ' : '') + 'btn p-2 bg-light m-1 rounded-5'} src="assets/ui/3d.svg" alt="" />
                </div>
            </div>
        </div>
    </div >
});

export default UI;