var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_ProjMatrixFromLight;
    uniform mat4 u_MvpMatrixOfLight;
    varying vec4 v_PositionFromLight;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_PositionFromLight = u_MvpMatrixOfLight * a_Position; //for shadow
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    uniform sampler2D u_ShadowMap;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying vec4 v_PositionFromLight;
    const float deMachThreshold = 0.005; //0.001 if having high precision depth
    void main(){ 
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        //***** shadow
        vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
        /////////******** LOW precision depth implementation ********///////////
        float depth = rgbaDepth.r;
        float visibility = (shadowCoord.z > depth + deMachThreshold) ? 0.3 : 1.0;

        gl_FragColor = vec4( (ambient + diffuse + specular)*visibility, 1.0);
    }
`;


var VSHADER_SHADOW_SOURCE = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main(){
          gl_Position = u_MvpMatrix * a_Position;
      }
  `;

var FSHADER_SHADOW_SOURCE = `
      precision mediump float;
      void main(){
        /////////** LOW precision depth implementation **/////
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
      }
  `;
  
  var VSHADER_REFLECT_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main(){
      gl_Position = u_MvpMatrix * a_Position;
      v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
      v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
  }    
`;

var FSHADER_REFLECT_SOURCE = `
  precision mediump float;
  uniform vec3 u_ViewPosition;
  uniform samplerCube u_envCubeMap;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main(){
    vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
    vec3 normal = normalize(v_Normal);
    vec3 R = reflect(-V, normal);
    gl_FragColor = vec4(textureCube(u_envCubeMap, R).rgb, 1.0);
  }
`;

var VSHADER_SOURCE_Texture = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
    }    
`;

var FSHADER_SOURCE_Texture = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform sampler2D u_Sampler;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 texColor = texture2D( u_Sampler, v_TexCoord ).rgb;
        vec3 ambientLightColor = texColor;
        vec3 diffuseLightColor = texColor;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

var VSHADER_SOURCE_ENVCUBE = `
attribute vec4 a_Position;
varying vec4 v_Position;
void main() {
  v_Position = a_Position;
  gl_Position = a_Position;
} 
`;

var FSHADER_SOURCE_ENVCUBE = `
precision mediump float;
uniform samplerCube u_envCubeMap;
uniform mat4 u_viewDirectionProjectionInverse;
varying vec4 v_Position;
void main() {
  vec4 t = u_viewDirectionProjectionInverse * v_Position;
  gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
}
`;

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

/////BEGIN:///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function initAttributeVariable(gl, a_attribute, buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

/////END://///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

///// normal vector calculation (for the cube)
function getNormalOnVertices(vertices){
  var normals = [];
  var nTriangles = vertices.length/9;
  for(let i=0; i < nTriangles; i ++ ){
      var idx = i * 9 + 0 * 3;
      var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
      idx = i * 9 + 1 * 3;
      var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
      idx = i * 9 + 2 * 3;
      var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];

      var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
      var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

      var nx = uy*vz - uz*vy;
      var ny = uz*vx - ux*vz;
      var nz = ux*vy - uy*vx;

      var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx = nx / norm;
      ny = ny / norm;
      nz = nz / norm;

      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }
  return normals;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var objScale = 1.0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var nVertex;
var cameraDirX = 0, cameraDirY = -0.3, cameraDirZ = -1;
var cameraX = 3, cameraY = 3, cameraZ = 13;
var lightX = 3, lightY = 8, lightZ = 10;
var textures = {};
var imgNames = ["PlatonicSurface_Color.jpg","lionfox.jpg", "fan1 - Kopi.jpg"];
var objCompImgIndex1 = ["lionfox.jpg", "fan1 - Kopi.jpg"];
var objCompImgIndex2 = ["PlatonicSurface_Color.jpg"];
var texCount = 0;
var numTextures = imgNames.length;
var imgNames2 = [];
var numTextures2 = imgNames2.length;
var roblox = [];
var lion = [];
var football = [];
var cube = [];
var cubeObj = [];
var quadObj;
var cubeMapTex;
var rotateAngle = 0;
var viewDir, newViewDir;
var offScreenWidth = 2048, offScreenHeight = 2048;
var fbo;
var x=0, y=-1, z=-10.0, moveright=0, moveforward=0, moveup=0, lx=0, lz=0, bx=0, bz=0, by=-1;
var point=0, start=0, wait=1000; 
var ballmove;

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    document.getElementById('point').innerHTML=point;
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    var quad = new Float32Array(
      [
        -1, -1, 1,
         1, -1, 1,
        -1,  1, 1,
        -1,  1, 1,
         1, -1, 1,
         1,  1, 1
      ]); //just a quad

    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position'); 
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap'); 
    programEnvCube.u_viewDirectionProjectionInverse = 
               gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse'); 

    quadObj = initVertexBufferForLaterUse(gl, quad);

    cubeMapTex = initCubeTexture("posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", 
                                      "posz.jpg", "negz.jpg", 512, 512)
    
    shadowProgram = compileShader(gl, VSHADER_SHADOW_SOURCE, FSHADER_SHADOW_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');

    reflectProgram = compileShader(gl, VSHADER_REFLECT_SOURCE, FSHADER_REFLECT_SOURCE);
    reflectProgram.a_Position = gl.getAttribLocation(reflectProgram, 'a_Position'); 
    reflectProgram.a_Normal = gl.getAttribLocation(reflectProgram, 'a_Normal'); 
    reflectProgram.u_MvpMatrix = gl.getUniformLocation(reflectProgram, 'u_MvpMatrix'); 
    reflectProgram.u_modelMatrix = gl.getUniformLocation(reflectProgram, 'u_modelMatrix'); 
    reflectProgram.u_normalMatrix = gl.getUniformLocation(reflectProgram, 'u_normalMatrix');
    reflectProgram.u_ViewPosition = gl.getUniformLocation(reflectProgram, 'u_ViewPosition');
    reflectProgram.u_envCubeMap = gl.getUniformLocation(reflectProgram, 'u_envCubeMap');

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_MvpMatrixOfLight = gl.getUniformLocation(program, 'u_MvpMatrixOfLight'); 
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_ShadowMap = gl.getUniformLocation(program, "u_ShadowMap");
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 

    gl.useProgram(program);

    programTexture = compileShader(gl, VSHADER_SOURCE_Texture, FSHADER_SOURCE_Texture);
    gl.useProgram(programTexture);
    programTexture.a_Position = gl.getAttribLocation(programTexture, 'a_Position'); 
    programTexture.a_TexCoord = gl.getAttribLocation(programTexture, 'a_TexCoord'); 
    programTexture.a_Normal = gl.getAttribLocation(programTexture, 'a_Normal'); 
    programTexture.u_MvpMatrix = gl.getUniformLocation(programTexture, 'u_MvpMatrix'); 
    programTexture.u_modelMatrix = gl.getUniformLocation(programTexture, 'u_modelMatrix'); 
    programTexture.u_normalMatrix = gl.getUniformLocation(programTexture, 'u_normalMatrix');
    programTexture.u_LightPosition = gl.getUniformLocation(programTexture, 'u_LightPosition');
    programTexture.u_ViewPosition = gl.getUniformLocation(programTexture, 'u_ViewPosition');
    programTexture.u_Ka = gl.getUniformLocation(programTexture, 'u_Ka'); 
    programTexture.u_Kd = gl.getUniformLocation(programTexture, 'u_Kd');
    programTexture.u_Ks = gl.getUniformLocation(programTexture, 'u_Ks');
    programTexture.u_shininess = gl.getUniformLocation(programTexture, 'u_shininess');
    programTexture.u_Sampler = gl.getUniformLocation(programTexture, "u_Sampler") 

    /////3D model dragon
    response = await fetch('roblox.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      roblox.push(o);
    }
    /////3D model lion
    response = await fetch('lion.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      lion.push(o);
    }
    response = await fetch('football.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      football.push(o);
    }
    for( let i=0; i < 1; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, imgNames[0], football);};
      image.src = imgNames[0];
    }
    for( let i=1; i < imgNames.length; i ++ ){
      let image = new Image();
      image.onload = function(){initTexture(gl, image, imgNames[i], lion);};
      image.src = imgNames[i];
    }
    ////cube
    //TODO-1: create vertices for the cube whose edge length is 2.0 (or 1.0 is also fine)
    //F: Face, T: Triangle, V: vertex (XYZ)
    cubeVertices = [
                    0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,
                    1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0,
                    1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
                    0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
                    1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0,
                    0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0
                  ]
    cubeNormals = getNormalOnVertices(cubeVertices);
    let o = initVertexBufferForLaterUse(gl, cubeVertices, cubeNormals, null);
    cube.push(o);
    response = await fetch('cube.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      cubeObj.push(o);
    }

    fbo = initFrameBuffer(gl);

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);
    draw();//draw it once before mouse move

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
    document.onkeydown = function(ev){keydown(ev)};

    var tick = function() {
      rotateAngle += 0.25;
      draw();
      requestAnimationFrame(tick);
    }
    tick();
    ballmove = function(){
      z=-10.0;
      draw();
      setTimeout(() => { kick(2.0, -5.0);}, 200);
      draw();
      setTimeout(() => { kick(3.5, -4.0);}, 300);
      draw();
      setTimeout(() => { kick(4.0, -3.0);}, 400);
      draw();
      setTimeout(() => { kick(3.5, -2.0);}, 500);
      draw();
      setTimeout(() => { kick(2.0, -1.0);}, 600); 
      draw();
      setTimeout(() => { kick(0.0, 1.0);}, 800);
      draw();
      setTimeout(() => { kick(-1.0, -20.0);}, 1200);
      draw();
      setTimeout(()=> {x=Math.random()*5.0-3.0; z=-10.0; y=-1.0}, 2000);
      draw();
      setTimeout(()=> {requestAnimationFrame(ballmove);}, 2000+wait);
    }
      
}

function draw(){
  ///// off scree shadow
  gl.useProgram(shadowProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  //cube
  let cubeMdlMatrix1 = new Matrix4();
  cubeMdlMatrix1.setScale(1.0, 1.0, 1.0);
  cubeMdlMatrix1.translate(2.5+Math.sin(rotateAngle/8)*2, 0.0, 3.0+ Math.sin(rotateAngle/4)*2);
  let cubeMvpFromLight1 = drawOffScreen(cube, cubeMdlMatrix1);

  let cubeMdlMatrix = new Matrix4();
  cubeMdlMatrix.setScale(1.0, 5.0, 2.0);
  let cubeMvpFromLight = drawOffScreen(cube, cubeMdlMatrix);

  let robloxMdlMatrix = new Matrix4();
  robloxMdlMatrix.setTranslate(4.2 + Math.sin(rotateAngle/8)*2, 0.8, 3.5+ Math.sin(rotateAngle/4)*2);
  robloxMdlMatrix.scale(0.3, 0.3, 0.3);
  robloxMdlMatrix.rotate(40, 0, 1, 0);
  let robloxMvpFromLight = drawOffScreen(roblox, robloxMdlMatrix);

  let lionMdlMatrix = new Matrix4();
  if(moveforward>=1.5)
    moveforward=1.5;
  else if(moveforward<=0)
    moveforward=0;
  if(2.0+moveright>=13.0)
    moveright=11.0;
  else if(2.0+moveright<=-7.0)
    moveright=-9.0;
   
  lx=5.0+moveright;
  lz=9.0-moveforward;
  lionMdlMatrix.setTranslate(5.0+moveright, 0.1+moveup, 9.0-moveforward);
  lionMdlMatrix.scale(0.2,0.2,0.2);
  let lionMvpFromLight = drawOffScreen(lion, lionMdlMatrix);

  bx=4.8+x;
  bz=8.3+z;
  by=y;
  let ballMdlMatrix = new Matrix4();
  ballMdlMatrix.setTranslate(4.0+x, 0.1+y, 8.3+z);
  ballMdlMatrix.scale(0.005,0.005,0.005);
  let ballMvpFromLight = drawOffScreen(football, ballMdlMatrix);
  

  ///// on scree rendering
  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4,0.4,0.4,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  //cube
  drawOneObjectOnScreen(cube, cubeMdlMatrix, cubeMvpFromLight, 1.0, 1.0, 1.0);
  
  drawOneObjectOnScreen(cube, cubeMdlMatrix1, cubeMvpFromLight1, 1.0, 0.84, 0.0);
  //roblox
  drawOneObjectOnScreen(roblox, robloxMdlMatrix, robloxMvpFromLight, 1.0, 0.84, 0.0);

  drawObj(lionMdlMatrix, lion, objCompImgIndex1, lionMvpFromLight);
  drawObj(ballMdlMatrix, football, objCompImgIndex2, ballMvpFromLight);
  
  
  drawReflect(cube);
  
  drawEnv();
  
}
function drawReflect(objComponents){
  
  //rotate the camera view direction
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(60, 1, 1, 15);
  viewMatrix.setLookAt(cameraX, cameraY, cameraZ,
                        cameraX + newViewDir.elements[0], 
                        cameraY + newViewDir.elements[1], 
                        cameraZ + newViewDir.elements[2], 
                        0, 1, 0);
  var viewMatrixRotationOnly = new Matrix4();
  viewMatrixRotationOnly.set(viewMatrix);
  viewMatrixRotationOnly.elements[12] = 0; //ignore translation
  viewMatrixRotationOnly.elements[13] = 0;
  viewMatrixRotationOnly.elements[14] = 0;
 
  //Draw the reflective cube
  gl.useProgram(reflectProgram);
  gl.depthFunc(gl.LESS);
  //model Matrix (part of the mvp matrix)
  var modelMatrix = new Matrix4();
  
  modelMatrix.setScale(objScale, objScale, objScale);
  modelMatrix.translate(0.8, 5.3, 1.0);
  modelMatrix.rotate(45, 1, 0, 1);
  modelMatrix.rotate(rotateAngle, 0, 1, 0); //make the cube rotate
  modelMatrix.translate(-0.5, 0.0, -0.5);
  //mvp: projection * view * model matrix  
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  //normal matrix
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(reflectProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1i(reflectProgram.u_envCubeMap, 0);

  gl.uniformMatrix4fv(reflectProgram.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(reflectProgram.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(reflectProgram.u_normalMatrix, false, normalMatrix.elements);

  for( let i=0; i < objComponents.length; i ++ ){
    initAttributeVariable(gl, reflectProgram.a_Position, objComponents[i].vertexBuffer);
    initAttributeVariable(gl, reflectProgram.a_Normal, objComponents[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, objComponents[i].numVertices);
  }
}
/////Call drawOneObject() here to draw all object one by one 
////   (setup the model matrix and color to draw)
function drawOffScreen(obj, mdlMatrix){

  var mvpFromLight = new Matrix4();
  //model Matrix (part of the mvp matrix)
  let modelMatrix = new Matrix4();
  modelMatrix.setRotate(angleY, 1, 0, 0);
  modelMatrix.rotate(angleX, 0, 1, 0);
  modelMatrix.multiply(mdlMatrix);
  //mvp: projection * view * model matrix  
  
  mvpFromLight.setPerspective(70, offScreenWidth/offScreenHeight, 1, 15);
  mvpFromLight.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);
  mvpFromLight.multiply(modelMatrix);

  gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, mvpFromLight.elements);

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, shadowProgram.a_Position, obj[i].vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }

  return mvpFromLight;
}
function drawOneObjectOnScreen(obj, mdlMatrix, mvpFromLight, colorR, colorG, colorB){
  var mvpFromCamera = new Matrix4();

  //model Matrix (part of the mvp matrix)
  modelMatrix.setRotate(0, 1, 0, 0);//for mouse rotation
  modelMatrix.rotate(0, 0, 1, 0);//for mouse rotation
  modelMatrix.multiply(mdlMatrix);

  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);
  mvpFromCamera.setPerspective(60, 1, 1, 15);
  mvpFromCamera.lookAt(cameraX, cameraY, cameraZ, 
    cameraX + newViewDir.elements[0], 
    cameraY + newViewDir.elements[1], 
    cameraZ + newViewDir.elements[2], 
    0, 1, 0)//(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
  mvpFromCamera.multiply(modelMatrix);
  //normal matrix
  
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 1.0);
  gl.uniform1f(program.u_shininess, 10.0);
  gl.uniform1i(program.u_ShadowMap, 0);
  gl.uniform3f(program.u_Color, colorR, colorG, colorB);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpFromCamera.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(program.u_MvpMatrixOfLight, false, mvpFromLight.elements);

  gl.activeTexture(gl.TEXTURE0);   
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture); 

  for( let i=0; i < obj.length; i ++ ){
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}


function drawEnv(){
  
    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    var newViewDir = rotateMatrix.multiplyVector3(viewDir);

    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(60, 1, 1, 15);
    var viewMatrixRotationOnly = new Matrix4();
    viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ, 
                                  cameraX + newViewDir.elements[0], 
                                  cameraY + newViewDir.elements[1], 
                                  cameraZ + newViewDir.elements[2], 
                                  0, 1, 0);
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);
    var vpFromCameraInverse = vpFromCamera.invert();

    //quad
    gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, 
                        false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
}
//obj, modelMatrix, objCompImgIndex
function drawObj(mdlMatrix, ObjCmp, objCompImgIndex, mvpFromLight){
    
    gl.useProgram(programTexture);

    var mvpFromCamera = new Matrix4();
    //model Matrix (part of the mvp matrix)
    modelMatrix.setRotate(0, 1, 0, 0);//for mouse rotation
    modelMatrix.rotate(0, 0, 1, 0);//for mouse rotation
    modelMatrix.multiply(mdlMatrix);

    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    var newViewDir = rotateMatrix.multiplyVector3(viewDir);
    mvpFromCamera.setPerspective(60, 1, 1, 15);
    mvpFromCamera.lookAt(cameraX, cameraY, cameraZ, 
      cameraX + newViewDir.elements[0], 
      cameraY + newViewDir.elements[1], 
      cameraZ + newViewDir.elements[2], 
      0, 1, 0)//(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
      mvpFromCamera.multiply(modelMatrix);
    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(programTexture.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(programTexture.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(programTexture.u_Ka, 0.2);
    gl.uniform1f(programTexture.u_Kd, 0.7);
    gl.uniform1f(programTexture.u_Ks, 1.0);
    gl.uniform1f(programTexture.u_shininess, 10.0);
    gl.uniform1i(programTexture.u_ShadowMap, 0);

    gl.uniformMatrix4fv(programTexture.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(programTexture.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(programTexture.u_normalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(program.u_MvpMatrixOfLight, false, mvpFromLight.elements);

    gl.activeTexture(gl.TEXTURE0);   
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture); 

    for( let i=0; i < ObjCmp.length; i ++ ){
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[objCompImgIndex[i]]);
      gl.uniform1i(programTexture.u_Sampler, 0);

      initAttributeVariable(gl, programTexture.a_Position, ObjCmp[i].vertexBuffer);
      initAttributeVariable(gl, programTexture.a_TexCoord, ObjCmp[i].texCoordBuffer);
      initAttributeVariable(gl, programTexture.a_Normal, ObjCmp[i].normalBuffer);

      gl.drawArrays(gl.TRIANGLES, 0, ObjCmp[i].numVertices);
    }
  
}
function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;
    draw();
}

function initTexture(gl, img, imgName){
  var tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

  textures[imgName] = tex;

  texCount++;
}

function initCubeTexture(posXName, negXName, posYName, negYName, 
                         posZName, negZName, imgWidth, imgHeight)
{
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      fName: posXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      fName: negXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      fName: posYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      fName: negYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      fName: posZName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      fName: negZName,
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, fName} = faceInfo;
    // setup each face so it's immediately renderable
    gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0, 
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    var image = new Image();
    image.onload = function(){
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    };
    image.src = fName;
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  return texture;
}
function kick(y1, z1){
  y=y1; 
  z=z1; 
}
function keydown(ev){ 
  //implment keydown event here
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir= new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  if(ev.key == 'w'){ 
    moveforward+=0.5;
  }
  else if(ev.key == 's'){ 
    moveforward-=0.5;
    console.log(moveforward);
  }
  else if(ev.key == 'd'){ 
    moveright+=0.5;
  }
  else if(ev.key == 'a'){ 
    moveright-=0.5;
  }
  else if(ev.key == ' '){
    setTimeout(() => { moveup+=1.5;}, 150);
    draw();
    setTimeout(() => { moveup+=0.5;}, 250);
    draw();
    setTimeout(() => { moveup-=2.0;}, 350);
    draw();
    //console.log("(",bz, lz,"),", Math.abs(bz-lz));
    if(Math.abs(bx-lx)<0.3 && by>=0 && bz>=6.3 && (lz>=7.3 && lz<=9.3)){
      point++;
      console.log("point: ", point);
      document.getElementById('point').innerHTML=point;
      if(point>30)
        wait=0;
      else if(point>25)
        wait=50;
      else if(point>20)
        wait=100;
      else if(point>15)
        wait=300;
      else if(point>10)
        wait=500;
      else if(point>5)
        wait=700;
    }
  }
  else if(ev.key == '3'){
    cameraZ = 16;
  }
  else if(ev.key == '1'){
    cameraZ = 13;
  }
  else if(ev.which === 13 ){
    if(start==0){
      ballmove();
      start=1;
    }
  }
  draw();
}
function initFrameBuffer(gl){
  //create and set up a texture object as the color buffer
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offScreenWidth, offScreenHeight,
                  0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  

  //create and setup a render buffer as the depth buffer
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                          offScreenWidth, offScreenHeight);

  //create and setup framebuffer: linke the color and depth buffer to it
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                              gl.RENDERBUFFER, depthBuffer);
  frameBuffer.texture = texture;
  return frameBuffer;
}

