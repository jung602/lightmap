uniform sampler2D uBakedTexture;
uniform sampler2D uLightMapTexture;
uniform vec3 uLightColor;
uniform float uLightStrength;

varying vec2 vUv;

// Lighten 블렌드 (더 밝은 값 선택)
vec3 blendLighten(vec3 base, vec3 blend) {
    return max(base, blend);
}

// Screen 블렌드 (빛이 더해지는 효과)
vec3 blendScreen(vec3 base, vec3 blend) {
    return vec3(1.0) - (vec3(1.0) - base) * (vec3(1.0) - blend);
}

// Overlay 블렌드 (대비 유지하면서 빛 더하기)
vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(
        2.0 * base * blend,
        vec3(1.0) - 2.0 * (vec3(1.0) - base) * (vec3(1.0) - blend),
        step(0.5, base)
    );
}

// Add 블렌드 (단순 덧셈, 강한 빛)
vec3 blendAdd(vec3 base, vec3 blend) {
    return min(base + blend, vec3(1.0));
}

// sRGB to Linear 변환 (감마 디코딩)
vec3 sRGBToLinear(vec3 srgb) {
    return pow(srgb, vec3(2.2));
}

// 선택한 블렌드 모드를 강도와 함께 적용
vec3 applyLightBlend(vec3 base, vec3 blend, float opacity) {
    // 여기서 블렌드 모드를 변경하세요:
    // return mix(base, blendLighten(base, blend), opacity);  // Lighten
    // return mix(base, blendOverlay(base, blend), opacity);  // Overlay
    return mix(base, blendScreen(base, blend), opacity);   // Screen (현재)
    // return mix(base, blendAdd(base, blend), opacity);      // Add
}

void main()
{
    // 텍스처 읽기 (sRGB로 저장된 이미지)
    vec3 bakedColor = texture2D(uBakedTexture, vUv).rgb;
    vec3 lightMapColor = texture2D(uLightMapTexture, vUv).rgb;
    
    // sRGB → Linear 변환 (LinearSRGBColorSpace 설정 시 수동 변환 필요)
    bakedColor = sRGBToLinear(bakedColor);
    
    // Light Color도 Linear로 변환
    vec3 lightColorLinear = sRGBToLinear(uLightColor);
    
    // Lightmap 적용 (Linear 공간에서 계산)
    float lightStrength = lightMapColor.r * uLightStrength;
    bakedColor = applyLightBlend(bakedColor, lightColorLinear, lightStrength);
    
    // Linear 공간 그대로 출력 (렌더러가 최종 변환)
    gl_FragColor = vec4(bakedColor, 1.0);
}

