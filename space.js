// canvas
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');

let shipImg;
let shipVelocityX;
let tileWidth, tileHeight; //needed for ship, alien proportions and their movement

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
let alienRows = 2; // initially there will be 2 rows of aliens
let alienColumns = 3; //initially there will be 3 columns of aliens
let alienCount = 0; //number of aliens to defeat
let alienVelocityX = 1; //speed of aliens

// bullets
let bulletArray = [];
let bulletVelocityY = -10; //bullet speed 

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

    // Load alien image 
    alienImg = new Image();
    alienImg.src = "./purplealien.png";
    createAliens(); // Create aliens 
    

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip); // when user presses A/D or arrows the ship moves
    document.addEventListener("keyup", shoot);  // when user presses Space bar bullets are shot toward the aliens
    addTouchEvents();
}

// Call resizeCanvas once on page load to initialize everything
resizeCanvas();

// Update canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Adjust the update function to ensure aliens are drawn
function update() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Draw ship
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    // Track if any alien hits the border
    let hitBorder = false;

    // Move aliens horizontally
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alienVelocityX;

            // Check if any alien reaches the canvas border
            if (alien.x + alien.width >= canvas.width || alien.x <= 0) {
                hitBorder = true; // Flag that a border collision has occurred
            }

            // Draw each alien
            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);
        }
    }

    // If a border was hit, reverse direction for all aliens
    if (hitBorder) {
        alienVelocityX = -alienVelocityX; // Reverse direction

        // Move all aliens down one row
        for (let i = 0; i < alienArray.length; i++) {
            alienArray[i].y += alien.height;
        }
    }

    // Draw and update bullets
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle = "white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Bullet collision with aliens
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && Collision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
            }
        }
    }

    // Clear used or off-screen bullets
    while (bulletArray.length > 0 && (bulletArray[0].used || bulletArray[0].y < 0)) {
        bulletArray.shift();
    }

    // Move to the next level if all aliens are shot
    if (alienCount == 0) {
        alienColumns = Math.min(alienColumns + 1, columns / 2 - 5); // increase nr of columns with 1 for next level - max 7 columns of aliens
        alienRows = Math.min(alienRows + 1, rows - 9); // increase nr of rows with 1 for next level - max 7 rows of aliens
        alienVelocityX = Math.sign(alienVelocityX) * (Math.abs(alienVelocityX) + 2); // Increase speed while keeping direction
        alienArray = [];
        bulletArray = [];
        createAliens();
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

// Add touch-based shooting and ship movement
function addTouchEvents() {
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
}

// Handle touch start (for moving the ship and shooting)
function handleTouchStart(event) {
    const touch = event.touches[0];
    touchX = touch.clientX; // Store the initial touch position

    // Check if the touch was a tap in the area of the ship to shoot
    // If touch is at the bottom of the screen (near the ship), shoot
    if (touch.clientY > canvas.height - ship.height) {
        shoot(event); // Trigger shooting when the user taps near the ship
    }
}

// Handle touch movement (for moving the ship)
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
function handleTouchEnd() {
    touchX = null; // Reset touch position when the touch ends
}


// Adjust createAliens function
function createAliens() {
    alienArray = []; // Clear array to avoid duplications

    for(let c = 0; c < alienColumns; c++) {
        for(let r = 0; r < alienRows; r++) {
            let alienX = tileWidth + c * alien.width * 1.5; // Alien x position with spacing
            let alienY = tileHeight + r * alien.height * 1.5; // Alien y position with spacing
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


function shoot(e) {
    // Fire a bullet if Space key is pressed or if called by touch event
    if (e === null || e.type === 'touchstart' || e.code === "Space") {
        let bullet = {
            x: ship.x + ship.width * 15 / 32,
            y: ship.y,
            width: tileWidth / 8,
            height: tileHeight / 3,
            used: false,
        };
        bulletArray.push(bullet);
    }
}


function Collision(a,b){
    return a.x < b.x + b.width &&  // a top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&  // a top right corner passes b top left corner
           a.y < b.y + b.height && // a top left corner doesn't reach b bottom left corner
           a.y + a.height > b.y; // a bottom left corners passes b top left corner
}
