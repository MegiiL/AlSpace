// canvas
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');

let shipImg;
let shipVelocityX;
let tileWidth, tileHeight;

const rows = 16;
const columns = 24; // 3:2 ratio

// ship properties are initialized to 0 and calculated after canvas resize
const ship = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
};

// alien properties are initialized to 0 and calculated after canvas resize
let alienArray = [];
let alien = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
};

let alienImg;
let alienRows = 2;
let alienColumns = 3;
let alienCount = 0; //number of aliens to defeat


let touchX = null; // Stores the initial touch position for mobile

function resizeCanvas() {
    const maxWidth = 600;
    const width = Math.min(window.innerWidth, maxWidth);
    const height = width * (600 / 400); // Maintain 3:2 aspect ratio
    canvas.width = width;
    canvas.height = height;

    // Recalculate tile sizes based on the updated canvas size
    tileWidth = canvas.width / columns;
    tileHeight = canvas.height / rows;

    // Recalculate ship position and size after resizing
    ship.x = canvas.width / 2 - tileWidth;
    ship.y = canvas.height - tileHeight * 2;
    ship.width = tileWidth * 2;
    ship.height = tileHeight * 2;
    shipVelocityX = tileWidth;

    // Recalculate alien size based on tile size
    alien.width = tileWidth;
    alien.height = tileHeight;

    // Load ship image after resizing
    shipImg = new Image();
    shipImg.src = "./ship.png";
    shipImg.onload = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    }

    // Load alien image and create aliens after the image loads
    alienImg = new Image();
    alienImg.src = "./purplealien.png";
    alienImg.onload = function() {
        createAliens(); // Create aliens after alien image has loaded
    }

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);
    addTouchEvents();
}

// Call resizeCanvas once on page load to initialize everything
resizeCanvas();

// Update canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Animation and rendering loop
// Adjust the update function to ensure aliens are drawn
function update() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Draw ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    // Draw aliens
    for(let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);
        }
    }

    requestAnimationFrame(update);
}


// Keyboard control function
function moveShip(e) {
    if ((e.code === "ArrowLeft" || e.code === "KeyA") && ship.x - shipVelocityX >= 0) {
        ship.x -= shipVelocityX; // Move left one tile
    }
    else if ((e.code === "ArrowRight" || e.code === "KeyD") && ship.x + shipVelocityX + ship.width <= canvas.width) {
        ship.x += shipVelocityX; // Move right one tile
    }
}

// Touch control functions for mobile dragging
function addTouchEvents() {
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
}

// Handle touch start
function handleTouchStart(event) {
    const touch = event.touches[0];
    touchX = touch.clientX; // Store the initial touch position
}

// Handle touch movement
function handleTouchMove(event) {
    if (touchX === null) return; // No touch start, so ignore move

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchX; // Calculate horizontal movement
    touchX = touch.clientX; // Update touchX to the new position

    // Update the ship's x position based on deltaX
    ship.x += deltaX;

    // Ensure the ship stays within the canvas bounds
    if (ship.x < 0) {
        ship.x = 0;
    } else if (ship.x + ship.width > canvas.width) {
        ship.x = canvas.width - ship.width;
    }
}

// Reset touch position when touch ends
canvas.addEventListener('touchend', () => {
    touchX = null;
});

// Adjust createAliens function
function createAliens() {
    alienArray = []; // Clear array to avoid duplications

    for(let c = 0; c < alienColumns; c++) {
        for(let r = 0; r < alienRows; r++) {
            let alienX = tileWidth + c * alien.width* 1.5; 
            let alienY = tileHeight + r * alien.height * 1.5;
            let newAlien = {
                x: alienX,
                y: alienY,
                width: alien.width,
                height: alien.height,
                alive: true,
            };

            alienArray.push(newAlien);
        }
    }
    alienCount = alienArray.length;
}
