'use client';
import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScroll, useTransform } from "framer-motion";

const VERTEX_SHADER = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const BACKGROUND_SHADER = `
    uniform float scroll;
    uniform vec2 size;

    #define S(a,b,t) smoothstep(a,b,t)

    mat2 Rot(float a)
    {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c);
    }

    vec2 hash( vec2 p )
    {
        p = vec2( dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)) );
        return fract(sin(p)*43758.5453);
    }

    float noise( in vec2 p )
    {
        vec2 i = floor( p );
        vec2 f = fract( p );
        
        vec2 u = f*f*(3.0-2.0*f);

        float n = mix( mix( dot( -1.0+2.0*hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( -1.0+2.0*hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                    mix( dot( -1.0+2.0*hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( -1.0+2.0*hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
        return 0.5 + 0.5*n;
    }

    void main()
    {
        vec2 uv = gl_FragCoord.xy / size.xy;
        float ratio = size.x / size.y;

        vec2 tuv = uv;
        tuv -= 0.5;

        float degree = noise(vec2(scroll * 0.1, tuv.x * tuv.y));

        tuv.y *= 1. / ratio;
        tuv *= Rot(radians((degree - 0.5) * 720. + 180.));
        tuv.y *= ratio;

        float frequency = 5.;
        float amplitude = 30.;
        float speed = scroll * 2.;
        tuv.x += sin(tuv.y * frequency + speed) / amplitude;
        tuv.y += sin(tuv.x * frequency * 1.5 + speed) / (amplitude * 0.5);

        vec3 colorYellow = vec3(0.957, 0.804, 0.623) / 2.;
        vec3 colorDeepBlue = vec3(0.192, 0.484, 0.933) / 2.;
        vec3 layer1 = mix(colorYellow, colorDeepBlue, S(-.3, .2, (tuv * Rot(radians(-5.))).x));

        vec3 colorRed = vec3(0.910, 0.110, 0.1) / 3.;
        vec3 colorBlue = vec3(0.350, 0.71, 0.953) / 7.;
        vec3 layer2 = mix(colorRed, colorBlue, S(-.3, .6, (tuv * Rot(radians(-5.))).x));

        vec3 finalComp = mix(layer1, layer2, S(.5, -.3, tuv.y));
        vec3 col = finalComp;

        float dist = 1. - length((uv - 0.5) * vec2(ratio, 1.0));
        float fade = smoothstep(0.0, 1.0, dist) * 1.2;
        col *= fade;

        gl_FragColor = vec4(col, 1.0);
    }
`;

function BackgroundShader({ scrollRef }) {
  const { viewport, size } = useThree();
  const uniforms = useRef({
    scroll: new THREE.Uniform(0),
    size: new THREE.Uniform(new THREE.Vector2(size.width, size.height)), // pixels
  });

  useFrame(() => {
    uniforms.current.scroll.value = scrollRef.current;
  });

  useEffect(() => {
    uniforms.current.size.value.set(size.width, size.height);
  }, [size.width, size.height]);

  return (
    <mesh>
      {/* world units for geometry */}
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={VERTEX_SHADER}
        fragmentShader={BACKGROUND_SHADER}
      />
    </mesh>
  );
}

export default function Background3({ opacity = 1, x = 0, y = 0 }) {
  const { scrollYProgress } = useScroll();
  const scroll = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const scrollRef = useRef(0);

  useEffect(() => {
    return scroll.on("change", (v) => {
      scrollRef.current = v;
    });
  }, [scroll]);

  return (
    <div
      style={{
        marginLeft: `${x}px`,
        marginTop: `${y}px`,
        opacity,
      }}
    >
      <Canvas
        orthographic
        camera={{ zoom: 100, position: [0, 0, 10] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      >
        <BackgroundShader scrollRef={scrollRef} />
      </Canvas>
    </div>
  );
}
