varying float Vcolor;
uniform float u_Hover;

void main() {

    // Adjust Color on hover
    vec3 color = vec3(0.5);
    color.rgb += Vcolor * 0.5 * u_Hover;
    gl_FragColor = vec4(color, 1.0);
    
}