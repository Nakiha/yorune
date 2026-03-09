# Gargantua Black Hole - Technical Implementation Guide

## Problem Diagnosis
Current shader outputs pure black. Common causes:
1. Shader compilation errors (check browser console)
2. Uniform variables not properly set
3. Camera position outside ray marching range
4. Missing precision qualifiers
5. Division by zero or NaN propagation

## Recommended Implementation Approach

### Step 1: Minimal Working Shader
Start with a simple test shader that outputs a color gradient to verify Three.js setup works:
```glsl
void main() {
    gl_FragColor = vec4(vUv, 0.5 + 0.5*sin(uTime), 1.0);
}
```

### Step 2: Working Ray Marching Template
Use a proven ray marching structure:

```glsl
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uCameraPos;

#define MAX_STEPS 100
#define MAX_DIST 50.0
#define SURFACE_DIST 0.01

// Black hole parameters
const float RS = 1.0;           // Schwarzschild radius
const float ISCO = 3.0;         // Innermost stable orbit
const float DISK_OUTER = 6.0;   // Disk outer radius

// Simple noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

// Temperature to color (blackbody approximation)
vec3 tempToColor(float t) {
    t = clamp(t, 1000.0, 40000.0) / 100.0;
    vec3 col;
    col.r = t <= 66.0 ? 1.0 : 1.292936 * pow(t - 60.0, -0.1332);
    col.g = t <= 66.0 ? 0.390082 * log(t) - 0.631841 : 1.129891 * pow(t - 60.0, -0.0755);
    col.b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : 0.543207 * log(t - 10.0) - 0.196564);
    return clamp(col, 0.0, 1.0);
}

void main() {
    // Normalized pixel coordinates
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    
    // Camera setup - position looking at origin
    vec3 ro = uCameraPos;
    vec3 lookAt = vec3(0.0);
    
    // Camera coordinate system
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);
    
    // Ray direction
    vec3 rd = normalize(forward + uv.x * right + uv.y * up);
    
    // Ray marching
    vec3 color = vec3(0.0);
    vec3 pos = ro;
    float t = 0.0;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        pos = ro + rd * t;
        float r = length(pos);
        
        // Hit event horizon
        if(r < RS) {
            color = vec3(0.0);
            break;
        }
        
        // Check disk intersection
        float diskDist = abs(pos.y);
        if(diskDist < 0.1 && r > ISCO && r < DISK_OUTER) {
            // Temperature profile
            float temp = 12000.0 * pow(ISCO / r, 0.75);
            
            // Doppler effect
            float angle = atan(pos.z, pos.x);
            float orbitalV = sqrt(1.0 / r);
            float viewAngle = dot(normalize(vec3(-pos.z, 0.0, pos.x)), rd);
            float doppler = pow(1.0 + orbitalV * viewAngle, 3.0);
            
            // Turbulence
            float turb = noise(vec2(r * 3.0, angle * 5.0 + uTime * 0.2));
            temp *= 0.8 + 0.4 * turb;
            
            // Accumulate
            float intensity = pow(ISCO/r, 2.0) * doppler * (1.0 - diskDist/0.1);
            color += tempToColor(temp) * intensity * 0.1;
        }
        
        // Gravitational lensing - bend ray toward black hole
        if(r < DISK_OUTER * 2.0 && r > RS) {
            vec3 toCenter = -normalize(pos);
            float strength = 0.5 * RS / (r * r);
            rd = normalize(rd + toCenter * strength);
        }
        
        t += 0.1;
        if(t > MAX_DIST) break;
    }
    
    // Background stars
    if(length(color) < 0.01) {
        float stars = step(0.998, hash(floor(rd.xy * 500.0 + rd.z * 300.0)));
        color += vec3(stars) * 0.5;
    }
    
    // Tone mapping
    color = color / (1.0 + color);
    color = pow(color, vec3(0.4545)); // gamma
    
    gl_FragColor = vec4(color, 1.0);
}
```

### Step 3: Three.js Setup Checklist
```javascript
// 1. Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Create shader material
const material = new THREE.ShaderMaterial({
    vertexShader: `...`,
    fragmentShader: `...`,
    uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(w, h) },
        uCameraPos: { value: new THREE.Vector3(0, 2, 8) }
    }
});

// 3. Create fullscreen quad
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);

// 4. Setup scene and camera
const scene = new THREE.Scene();
scene.add(mesh);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// 5. Animation loop
function animate() {
    requestAnimationFrame(animate);
    material.uniforms.uTime.value += 0.016;
    renderer.render(scene, camera);
}
```

## Key Physics Details

### 1. Accretion Disk Temperature
- Inner edge (ISCO): ~10,000-25,000K (white/blue)
- Outer edge: ~3,000-5,000K (orange/red)
- Profile: T ∝ r^(-3/4) (Shakura-Sunyaev disk model)

### 2. Doppler Beaming
- Intensity ∝ (1 + v/c)^4 for relativistic beaming
- v = orbital velocity = sqrt(GM/r) in natural units
- Approaching side is ~2-3x brighter

### 3. Gravitational Lensing
- Deflection angle ≈ 4GM/(c²r) for light
- In shader: bend ray direction toward black hole
- Photon sphere at 1.5 RS (light can orbit)

### 4. Camera Position
- Start at distance ~8-12 RS from center
- Y offset ~2-4 RS for good view of disk plane
- Look at origin (black hole center)

## Debug Tips
1. Add `console.log` for uniform values
2. Check browser console for shader errors
3. Simplify shader to isolate issues
4. Try constant colors to verify pipeline
5. Ensure uResolution is set correctly

## References
- Interstellar visualization paper by James et al.
- Schwarzschild metric for non-rotating black holes
- Kerr metric for rotating black holes (Gargantua was Kerr)
