"use client";
import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Image from "next/image";

const VERTEX_SHADER = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BACKGROUND_SHADER = `
#define cloud
const float timeScale = 12.0;
const float cloudScale = 1.5;
const float skyCover = .5; 
const float softness = 0.05;
const float brightness = 0.5;
const int noiseOctaves = 8;
const float curlStrain = 3.0;

uniform float time;     // seconds
uniform vec2 size;      // canvas pixel size

//#define turbulence
//#define marble
//#define granite

float hash21(vec2 p)
{
	float h = dot(p,vec2(127.1,311.7));
	
    return  -1.+2.*fract(sin(h)*43758.5453123);
}

vec2 hash22(vec2 p)
{
    p = p*mat2(127.1,311.7,269.5,183.3);
	p = -1.0 + 2.0 * fract(sin(p)*43758.5453123);
	return sin(p*6.283);
}

float perlin_noise(vec2 p)
{
	vec2 pi = floor(p);
    vec2 pf = p-pi;
    vec2 w = pf*pf*(3.-2.*pf);
    
    float f00 = dot(hash22(pi+vec2(.0,.0)),pf-vec2(.0,.0));
    float f01 = dot(hash22(pi+vec2(.0,1.)),pf-vec2(.0,1.));
    float f10 = dot(hash22(pi+vec2(1.0,0.)),pf-vec2(1.0,0.));
    float f11 = dot(hash22(pi+vec2(1.0,1.)),pf-vec2(1.0,1.));
    
    float xm1 = mix(f00,f10,w.x);
    float xm2 = mix(f01,f11,w.x);
    
    float ym = mix(xm1,xm2,w.y); 
    return ym;
   
}

float noise_sum(vec2 p){
    p *= 4.;
	float a = 1., r = 0., s=0.;
    
    for (int i=0; i<5; i++) {
      r += a*perlin_noise(p); s+= a; p *= 2.; a*=.5;
    }
    
    return r/s;///(.1*3.);
}

float noise_sum_abs(vec2 p)
{	
    p *= 4.;
	float a = 1., r = 0., s=0.;
    
    for (int i=0; i<5; i++) {
      r += a*abs(perlin_noise(p)); s+= a; p *= 2.; a*=.5;
    }
    
    return (r/s-.135)/(.06*3.);
}

float noise_sum_abs_sin(vec2 p)
{	
    p *= 7.0/4.0;
    float f = noise_sum_abs(p);
    f = sin(f * 1.5 + p.x * 4.0);
    
    return f *f;
}

float noise_one_octave(vec2 p){
    float r = 0.0;
	r += 0.125*abs(perlin_noise(p*30.));
    return r;
}

float noise(vec2 p){

	#ifdef marble
    	return noise_sum_abs_sin(p);
    #elif defined turbulence
    	return noise_sum_abs(p);
    #elif defined granite
    	return noise_one_octave(p);
    #elif defined cloud
    	return noise_sum(p);
    #endif
}

float sat(float num)
{
    return clamp(num,0.0,1.0);
}



vec2 rotate(vec2 uv)
{
    uv = uv + noise(uv*0.2)*0.005;
    float rot = curlStrain;
    float sinRot=sin(rot);
    float cosRot=cos(rot);
    mat2 rotMat = mat2(cosRot,-sinRot,sinRot,cosRot);
    return uv * rotMat;
}

float fbm (vec2 uv)
{
    float rot = 1.57;
    float sinRot=sin(rot);
    float cosRot=cos(rot);
    float f = 0.0;
    float total = 0.0;
    float mul = 0.5;
    mat2 rotMat = mat2(cosRot,-sinRot,sinRot,cosRot);
    
    for(int i = 0;i < noiseOctaves;i++)
    {
        f += noise(uv+time*0.00015*timeScale*(1.0-mul))*mul;
        total += mul;
        uv *= 3.0;
        uv=rotate(uv);
        mul *= 0.5;
    }
    return f/total;
}

void main(  )
{
    vec2 uv = gl_FragCoord.xy/(40000.0*cloudScale);
    

    float cover = skyCover + .5;
    
    float bright = brightness*6.;
    
    float color1 = fbm(uv-0.5+time*0.00004*timeScale);
    float color2 = fbm(uv-10.5+time*0.00002*timeScale);
    
    float clouds1 = smoothstep(1.0-cover,min((1.0-cover)+softness*2.0,1.0),color1);
    float clouds2 = smoothstep(1.0-cover,min((1.0-cover)+softness,1.0),color2);
    
    float cloudsFormComb = sat(clouds1+clouds2);
    
    vec4 skyCol = vec4(0.6,0.8,1.0,1.0);
    float cloudCol = sat(sat(1.0-pow(color1,1.0)*0.2)*bright);
    vec4 clouds1Color = vec4(cloudCol,cloudCol,cloudCol,1.0);
    vec4 clouds2Color = mix(clouds1Color,skyCol,0.25);
    vec4 cloudColComb = mix(clouds1Color,clouds2Color,sat(clouds2-clouds1));
    
	 gl_FragColor = mix(skyCol,cloudColComb,cloudsFormComb);
}`;

function BackgroundShader() {
  const { viewport, size } = useThree();
  const uniforms = useRef({
    time: new THREE.Uniform(0),
    size: new THREE.Uniform(new THREE.Vector2(size.width, size.height)),
  });

  useFrame((state) => {
    uniforms.current.time.value = state.clock.getElapsedTime();
  });

  useEffect(() => {
    uniforms.current.size.value.set(size.width, size.height);
  }, [size.width, size.height]);

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={VERTEX_SHADER}
        fragmentShader={BACKGROUND_SHADER}
      />
    </mesh>
  );
}

export default function DonatePage({ opacity = 1, x = 0, y = 0 }) {
  return (
    <>
      <div
        style={{ marginLeft: `${x}px`, marginTop: `${y}px`, opacity }}
        className="absolute -z-2"
      >
        <Canvas
          orthographic
          camera={{ zoom: 100, position: [0, 0, 10] }}
          style={{ top: 0, left: 0, width: "100vw", height: "120vh" }}
          className=""
        >
          <BackgroundShader />
        </Canvas>
      </div>
      <div className="h-[80vh] w-screen text-black text-lg z-2 overflow-hidden">
        <div className="mx-auto container flex flex-col justify-center items-center mt-20 ">
          <h1 className="relative text-5xl">DONATE</h1>
          <h3 className="relative">un subtitlu aici</h3>
        </div>
        <div className="relative mt-[-5vh] -z-1 lg:mt-[30vh] h-4/5 w-4/5 mx-auto">
          <Image
            src="/assets/imagine biserica.png"
            alt="imagine-biserica"
            className="object-contain"
            fill
          ></Image>
        </div>
      </div>
    </>
  );
}
