import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.onload = () => loadModel();

function loadModel() {

    const loader = new GLTFLoader();
    loader.load('/model/avatar-2.glb', 
        (gltf) => {
            setupScene(gltf);
            document.getElementById('avatar-loading').style.display = 'none';
        },
        (xhr) => {
            const percentageCompletion = Math.round((xhr.loaded / xhr.total) * 100);
            document.getElementById('avatar-loading').innerText = `Loading model... ${percentageCompletion}%`;
        },
        (error) => {
            console.log(error);
        }
    );
}

function setupScene(gltf) {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const container = document.getElementById('avatar-container');
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    


    // camera setup
    const camera = new THREE.PerspectiveCamera(
        45, container.clientWidth / container.clientHeight);
    camera.position.set(0.5, 7, 0.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 3;
    controls.minPolarAngle = 1.4;
    controls.maxPolarAngle = 1.4;
    controls.target = new THREE.Vector3(1, 2, 0);
    controls.update();

    const scene = new THREE.Scene();

    // Scene setup
    scene.add(new THREE.AmbientLight());

    const spotlight = new THREE.SpotLight(0xffffff, 5, 25, 2);
    spotlight.penumbra = 0.5;
    spotlight.position.set(0,4,2);
    spotlight.castShadow = true;
    scene.add(spotlight);

    const keylight = new THREE.DirectionalLight(0xffffff, 2);
    keylight.position.set(1, 1, 2);
    keylight.lookAt(new THREE.Vector3());
    scene.add(keylight);

    const avatar = gltf.scene;
    avatar.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })

    scene.add(avatar);

    // Load animation
    const mixer = new THREE.AnimationMixer(avatar);
    const clips = gltf.animations;
    const typeClip = THREE.AnimationClip.findByName(clips, 'typing');
    const stressClip = THREE.AnimationClip.findByName(clips, 'stress');
    const typeAction = mixer.clipAction(typeClip);
    const stressAction = mixer.clipAction(stressClip);

    let isStress = false;
    const raycaster = new THREE.Raycaster();
    container.addEventListener('mousedown', (ev) => {
        const coords = {
            x: (ev.offsetX / container.clientWidth) * 2 - 1,
            y: -(ev.offsetY / container.clientHeight) * 2 + 1
        };

        raycaster.setFromCamera(coords, camera);
        const intersections = raycaster.intersectObjects(avatar);

        if (intersections.length > -1) {
            if (isStress) return;

            isStress = true;
            stressAction.reset();
            stressAction.play();
            typeAction.crossFadeTo(stressAction, 0.5);

            setTimeout(() => {
                typeAction.reset();
                typeAction.play();
                stressAction.crossFadeTo(typeAction, 1);
                setTimeout(() => isStress = false, 1000);
            }, 4000)
        }
    });
    
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        mixer.update(clock.getDelta());
        renderer.render(scene, camera);
    }

    window.addEventListener( 'resize', onWindowResize );

    function onWindowResize(){
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate();
    typeAction.play();

}