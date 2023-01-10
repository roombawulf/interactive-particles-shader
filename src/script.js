import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'

import pointsVertex from './shaders/particles/vertex.glsl'
import pointsFragment from './shaders/particles/fragment.glsl'

// Debug
const gui = new dat.GUI({
    width: 200
})
gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x252422)

// Particles
const geom = new THREE.BufferGeometry()
const mat = new THREE.ShaderMaterial({
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    uniforms: {
        u_Time: {value: 0.0},
        u_Point: {value: new THREE.Vector3()},
        u_Intersect: {value: false},
        u_Hover: {value: 0}
    }
})

const spherePoints = new THREE.IcosahedronGeometry(1, 24)
.getAttribute('position').array
geom.setAttribute('position', new THREE.BufferAttribute(spherePoints, 3))
const points = new THREE.Points(geom, mat)
scene.add(points)

// Invisible sphere for raycasting mouse position
const sphere = new THREE.SphereGeometry(1.1, 16, 8)
const sphereMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x000000),
    wireframe: true
})
const sphereMesh = new THREE.Mesh(sphere, sphereMat)
//scene.add(sphereMesh)

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 4.5
scene.add(camera)

// Raycast
const raycaster = new THREE.Raycaster()
const point = new THREE.Vector3()
// Mouse
const mouse = new THREE.Vector2()
let hover = false
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1
    mouse.y = -(event.clientY / sizes.height) * 2 + 1

    gsap.to(camera.position, {
        x: () => mouse.x * 0.2,
        y: () => mouse.y * 0.2,
        duration: 0.3
      })
})

// Controls
const controls = new OrbitControls(camera, canvas)
//controls.enableDamping = true
controls.enabled = false

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


// Pointer Helper 
const pointerGeom = new THREE.SphereGeometry(0.03)
const pointerMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xaa0000),
    visible: false
})
const pointer = new THREE.Mesh(pointerGeom, pointerMat)
pointer.material.color.setHSL(Math.random(), 0.5, 0.5)

// // Add to see the pointer
//scene.add(pointer)

// Hover Animate
function animateHover(value){
    gsap.to(mat.uniforms.u_Hover, {
        value: value,
        duration: 1.0,
        ease: "power2.out"
    })
}

const clock = new THREE.Clock()
const obj = sphereMesh //Sphere mesh from earlier
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    mat.uniforms.u_Time.value = elapsedTime

    // Raycast
    raycaster.setFromCamera(mouse, camera)
    const intersect = raycaster.intersectObject(obj)

    if(intersect.length === 0){
        if(hover) {
            hover = false
            animateHover(0)
        }
    } 
    else{
        if (!hover) {
            hover = true
            animateHover(1)
        }
    }
    if(intersect.length > 0){

        gsap.to(point, {
            x: () => intersect[0]?.point.x || 0,
            y: () => intersect[0]?.point.y || 0,
            z: () => intersect[0]?.point.z || 0,
            overwrite: true,
            duration: 0.3,
            onUpdate: () => {
                pointer.position.set(point.x, point.y, point.z)
                mat.uniforms.u_Point.value = point
            }
        })
        pointerMat.visible = true
        
    }
    else{pointerMat.visible = false}

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}
tick()