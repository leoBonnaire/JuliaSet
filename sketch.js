var canvas;

// Keep track of the mode you're in
var mouse = 0; // Choose with the mouse
var moving = 0; // Animation 1
var mandelbrot = 0; // Mandelbrot set
var choice = 0; // Keyboard choice
var perlin = 0; // Animation 2

var zoom;
var showCursor = 0;
var drawGrid = false;

var xOffset, yOffset;

// Angles for the sin() animation 1
var angle;

// Max iterations
var max;
var autoIte = true;

var zoomSens;

// Color array : red green and blue
// var colore = [1, 0, 1];

// Default values for c = ca + cb*i
var ca = -100, cb = -100;

// Offsets for Perlin Noise animation
var xoff1 = 0; 
var xoff2 = 100;


function setup() {
  centerCanvas();
  pixelDensity(1);
  
  // Initiate the default values
  document.getElementById("max").value = 75;
  document.getElementById("lumi").value = 50;
  document.getElementById("zoomSens").value = 7;
  
  initPos();
  
  angle = 0;
}

function centerCanvas() {
  // Create the canvas function of the window size
  canvas = createCanvas(floor(0.5 * windowWidth), floor(0.5 * windowWidth));
  var x = windowWidth - width - 10;
  // y center the canvas
  var y = (windowHeight - 0.5 * windowWidth) / 2;
  canvas.position(x, y);
}

function windowResized() {
  centerCanvas();
}

function draw() {
	
  loadPixels();
  
  // Take the values given by the user
  if(!autoIte) max = document.getElementById("max").value * 1;
  else { 
	max = floor(log(100 / zoom) * (1 + log(100 / zoom) / 25) + 50)
	document.getElementById("max").value = max; 
  }
  zoomSens = document.getElementById("zoomSens").value * pow(10, -4);
  
  if(autoIte) {
	document.getElementById("max").value = floor((1 + log(100 / zoom)) * (1 + log(100 / zoom) / 10) + 75);
  }
  
  // Change ca and cb in function of the mode
  if(mouse) {
	// Function of the mouse pos
	ca = map(mouseX, 0, width, -zoom + xOffset, zoom + xOffset);
	cb = - map(mouseY, 0, height, -zoom - yOffset, zoom - yOffset);
  } else if(moving) {
	// Change c with sin()
	angle += 0.02;
	
	let r;
	
	if(cos(angle) < 0) r = 0.8;
	else r = 0.35;
	
	ca = r * cos(angle);
	cb = 0.75 * sin(angle);
  } else if(choice) {
	// Take the user-given values
	ca = document.getElementById("a").value * 1;
	cb = document.getElementById("b").value * 1;
  } else if(perlin) {
	// Change c with Perlin Noise
	xoff1 += 0.01;
	xoff2 += 0.01;
	ca = map(noise(xoff1), 0, 1, -zoom, zoom);
	cb = map(noise(xoff2), 0, 1, -zoom, zoom);
  } else if(ca == -100 && cb == -100) {
	// Default values
	ca = -0.625;
	cb = -0.442;
  }
  
  // Move width [Z] [Q] [S] [D]
  if(keyIsDown(90)) yOffset += zoomSens * 75 * zoom;
  if(keyIsDown(83)) yOffset -= zoomSens * 75 * zoom;
  if(keyIsDown(81)) xOffset -= zoomSens * 75 * zoom;
  if(keyIsDown(68)) xOffset += zoomSens * 75 * zoom;

  // Now go through all the pixels
  for(let x = 0; x < width; x++) {
	  for(let y = 0; y < height; y++) {
		  
		  // Calculate the pos of the pixel in the landmark
		  let a = map(x, 0, width, -zoom, zoom) + xOffset;
		  let b = - map(y, 0, height, -zoom, zoom) + yOffset;
		  
		  // If you want to draw the Mandelbrot set, c is the pixel pos, not a constant
		  if(mandelbrot) {
			ca = a;
			cb = b;
		  }
		  
		  // Z = z² + c
		  // Z = (a + i*b)² + ca + i*cb
		  // Z = a² - b² + 2*a*b*i + ca + i*cb
		  // Z = (a² - b² + ca) + (2*a*b + cb)*i
		  // A = a² - b² + ca  |  B = 2*a*b + cb
		  
		  // Calculate these A and B for Nmax = max
		  for(var n = 0; n < max; n++) {
			  let nextA = a * a - b * b + ca;
			  let nextB = 2 * a * b + cb;
			  
			  a = nextA;
			  b = nextB;
			  
			  if(abs(a + b) > 2.0) break; // Is going toward infinity, so break
		  }
		  
		  let minColor = document.getElementById("lumi").value * 1;
		  
		  // Calculate the color in function of the value of n (how fast it goes to infinity)
		  let bright = map(n, 0, max, minColor, 255 * 3);
		  if(n === max) bright = 0; // If it was stable, make it black
		  
		  let redPart, greenPart, bluePart;
		  if(bright < 255) bluePart = bright; else bluePart = 0;
		  if(bright > 255 && bright < 2 * 255) greenPart = bright - 255; else greenPart = 0;
		  if(bright > 2 * 255) redPart = bright - 2 * 255; else redPart = 0;
		  
		  bluePart += 0.3 * bright;
		  greenPart += 0.3 * bright;
		  redPart += 0.3 * bright;
		  
		  // Index of the pixel
		  let index = (x + y * width) * 4;
		  // Change the color of the pixel
		  pixels[index + 0] = redPart;
		  pixels[index + 1] = greenPart;
		  pixels[index + 2] = bluePart;
		  pixels[index + 3] = 255;
		  
	  }
  }
  
  updatePixels();
  
  // Display the pos of c
  if(showCursor && !mandelbrot) {
	  // Always pick a visible color
	  stroke(255, 120, 120);
	  strokeWeight(2);
	  
	  let x = map(ca, -zoom + xOffset, zoom + xOffset, 0, width);
	  let y = map(- cb, -zoom - yOffset, zoom - yOffset, 0, height);
	  line(x - 3, y - 3, x + 3, y + 3);
	  line(x + 3, y - 3, x - 3, y + 3);
  }
  
  // Draw the grid
  if(drawGrid) draw_grid();
  else {
	  stroke(0);
	  strokeWeight(0.5);
  }
  
  fill('white');
  textSize(12);
  
  // Display the value of c
  if(!mandelbrot)
	  text("c = " + ca.toFixed(4) + " + (" + 
	                cb.toFixed(4) + ") * i", 50, 50);
  else text("Ensemble de Mandelbrot", 50, 50)
  
  // Display the zoom
  text("Zoom : " + (1/zoom - 1/2).toFixed(2), 50, 70);
  
  text("FPS : " + frameRate().toFixed(0), 50, 90);
}

/* Go back to the first pos and first zoom */
function initPos(){
    zoom = 2;
	xOffset = 0; 
	yOffset = 0;
}

function mouseWheel(event) {
	// Change the zoom in function of the mouse wheel
	if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
		
		zoom += zoomSens * zoom * event.delta;
		return false;
	}
}

function mousePressed() {
	// First check if the mouse is in the canvas and if your not in keyboard mode
	if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height && mouseButton === LEFT && !choice) {
		
		// If it's not playing one of the animations
		if(!moving && !perlin) {
			// Take the c value of the click
			ca = map(mouseX, 0, width, -zoom + xOffset, zoom + xOffset);
			cb = - map(mouseY, 0, height, -zoom - yOffset, zoom - yOffset);
		}
		
		// Then change the values of go to keyboard mode
		document.getElementById("a").value = ca;
		document.getElementById("b").value = cb;
		changeMode(4);
	}
}
/* Draw the grid */
function draw_grid() {

  fill('black');
  stroke(0);
  strokeWeight(0.5);
  
  let x, y;
  
  textSize(10);
  
  // Draw the x pos
  y = map(0, -zoom - yOffset, zoom - yOffset, 0, height);
  for(let i = -2.5; i <= 2.5; i += 0.25){
	let x = map(i, -zoom + xOffset, zoom + xOffset, 0, width);
	line(x, y - 3, x, y + 3);
	text(i, x - 10, y + 15);
  }
  
  // Draw the y pos
  x = map(0, -zoom + xOffset, zoom + xOffset, 0, width);
  for(let i = -2.5; i <= 2.5; i += 0.25){
	let y = map(i, -zoom - yOffset, zoom - yOffset, 0, height);
	line(x - 3, y, x + 3, y);
	if(i != 0) text(-i, x - 25, y + 5);
  }
  
  // Draw the axes
  line(x, 0, x, height);
  line(0, y, width, y);
}

/* Change the mode */
function changeMode(mode) {
	if(mode == 1) { // With the mouse
		mouse = 1;
		moving = 0;
		mandelbrot = 0;
		choice = 0;
		perlin = 0;
	} else if(mode == 2) { // Animation 1
		mouse = 0;
		moving = 1;
		mandelbrot = 0;
		choice = 0;
		perlin = 0;
	} else if(mode == 3) { // Mandelbrot set
		mouse = 0;
		moving = 0;
		mandelbrot = 1;
		choice = 0;
		perlin = 0;
	} else if(mode == 4) { // Keyboard mode
		choice = 1;
		mouse = 0;
		moving = 0;
		mandelbrot = 0;
		perlin = 0;
	} else if(mode == 5) { // Animation 2
		choice = 0;
		mouse = 0;
		moving = 0;
		mandelbrot = 0;
		perlin = 1;
	}
}

function randomize() {
	document.getElementById("a").value = random(-1.5, 0.25);
	document.getElementById("b").value = random(-0.5, 0.5);
	changeMode(4);
}