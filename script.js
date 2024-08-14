document.addEventListener('DOMContentLoaded', function () {
    const inputField = document.querySelector('.input-field');
    const plusButton = document.querySelector('.plus');
    const minusButton = document.querySelector('.minus');
    const startButton = document.querySelector('.start-button');
    const gameScreen = document.getElementById('game-screen');
    const bettingScreen = document.getElementById('betting-screen');
    const canvas = document.getElementById('battleship-canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 2;
    const cellSize = canvas.width / gridSize;
    const gameMessage = document.getElementById('game-message');

    let ships = [];
    let shotFired = false;

    const soundEffects = {
        hit: new Audio('boom.mp3'),
        miss: new Audio('sfx.mp3'),
        rocket: new Audio('fired.mp3')
    };

    function preloadSounds() {
        for (const key in soundEffects) {
            soundEffects[key].preload = 'auto';
        }
    }
    preloadSounds();

    function spawnShips() {
        const numberOfShips = 1;

        for (let i = 0; i < numberOfShips; i++) {
            let ship = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };

            while (ships.some(existingShip => existingShip.x === ship.x && existingShip.y === ship.y)) {
                ship = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridSize)
                };
            }
            ships.push(ship);
        }
    }
    
    plusButton.addEventListener('click', function () {
        let currentValue = parseInt(inputField.value, 10) || 0;
        currentValue += 100;
        inputField.value = currentValue;
    });

    minusButton.addEventListener('click', function () {
        let currentValue = parseInt(inputField.value, 10) || 0;
        if (currentValue > 0) {
            currentValue -= 100;
            if (currentValue < 0) {
                currentValue = 0;
            }
            inputField.value = currentValue;
        }
    });

    startButton.addEventListener('click', function () {
        bettingScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        drawGrid();
        spawnShips();
        canvas.addEventListener('click', handleCanvasClick);
    });

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                ctx.strokeStyle = '#000080';
                ctx.lineWidth = 4;
                ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }

    function handleCanvasClick(event) {
        if (shotFired) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const i = Math.floor(x / cellSize);
        const j = Math.floor(y / cellSize);

        shotFired = true;
        canvas.removeEventListener('click', handleCanvasClick);

        soundEffects.rocket.play().then(() => {
            animateBombToCell(i, j);
        }).catch(err => {
            console.error('Error playing rocket sound:', err);
            animateBombToCell(i, j);
        });
    }

    function animateBombToCell(targetX, targetY) {
        const rocketCanvas = document.getElementById('rocket-canvas');
        const rocketCtx = rocketCanvas.getContext('2d');

        rocketCanvas.width = window.innerWidth;
        rocketCanvas.height = window.innerHeight;

        const bombImage = new Image();
        bombImage.src = 'rocket.png';

        const targetPosX = targetX * cellSize + cellSize / 2 + canvas.getBoundingClientRect().left;
        const targetPosY = targetY * cellSize + cellSize / 2 + canvas.getBoundingClientRect().top;

        const startPositions = [
            { x: -50, y: -50 },
            { x: rocketCanvas.width + 50, y: -50 },
            { x: rocketCanvas.width + 50, y: rocketCanvas.height + 50 },
            { x: -50, y: rocketCanvas.height + 50 }
        ];
        const startPos = startPositions[Math.floor(Math.random() * startPositions.length)];

        const controlPoint1 = {
            x: Math.random() * rocketCanvas.width,
            y: Math.random() * rocketCanvas.height
        };
        const controlPoint2 = {
            x: Math.random() * rocketCanvas.width,
            y: Math.random() * rocketCanvas.height
        };

        const duration = 2000;
        const startTime = performance.now();

        const scaleFactor = 2;
        const rocketWidth = 50 * scaleFactor;
        const rocketHeight = 50 * scaleFactor;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);

            const x = Math.pow(1 - t, 3) * startPos.x +
                      3 * Math.pow(1 - t, 2) * t * controlPoint1.x +
                      3 * (1 - t) * Math.pow(t, 2) * controlPoint2.x +
                      Math.pow(t, 3) * targetPosX;

            const y = Math.pow(1 - t, 3) * startPos.y +
                      3 * Math.pow(1 - t, 2) * t * controlPoint1.y +
                      3 * (1 - t) * Math.pow(t, 2) * controlPoint2.y +
                      Math.pow(t, 3) * targetPosY;

            rocketCtx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);
            rocketCtx.drawImage(bombImage, x - rocketWidth / 2, y - rocketHeight / 2, rocketWidth, rocketHeight);

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                checkHit(targetX, targetY);
                rocketCtx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);
            }
        }

        bombImage.onload = function() {
            requestAnimationFrame(animate);
        };
    }
    
    function checkHit(targetX, targetY) {
        const hitShip = ships.find(ship => ship.x === targetX && ship.y === targetY);
        if (hitShip) {
            const winMessages = [
                'Wow, you actually hit something! Did a blindfold help?',
                'Nice job! You finally made a ship sink instead of your hopes.',
                'Incredible! You hit the target. Did you use cheat codes?',
                'Well, well, well, look who’s a naval mastermind now!',
                'You sunk the ship! You must have hired a pro aim coach.',
                'Amazing! You hit the target. The ship’s ghost is crying now.',
                'Bravo! You hit the ship. Did you sacrifice your accuracy to the gods?',
                'Impressive! A broken clock is right twice a day, and so are you!',
                'Congrats! You finally managed to hit something. Better late than never!'
            ];
    
            const randomWinMessage = winMessages[Math.floor(Math.random() * winMessages.length)];
            gameMessage.textContent = randomWinMessage;
            soundEffects.hit.play();
            createExplosionEffect(targetX, targetY);
        } else {
            const missMessages = [
                'Miss! You threw a torpedo into the ocean, genius!',
                'Whiff! Did you even aim?',
                'Fail! You might want to consider a new hobby.',
                'Oops! Did you just try to hit a ghost?',
                'Miss! Are you sure you’re not blind?',
                'Fail! You’re as accurate as a broken compass.',
                'Miss! Maybe you should try throwing peanuts instead.',
                'Epic fail! You couldn’t hit water if you fell out of a boat.',
                'Nope! Even a blindfolded squirrel would have hit better.'
            ];
    
            const randomMissMessage = missMessages[Math.floor(Math.random() * missMessages.length)];
            gameMessage.textContent = randomMissMessage;
            soundEffects.miss.play();
    
            const missGif = document.createElement('img');
            missGif.src = 'angry.gif';
            missGif.style.position = 'absolute';
    
            const canvasRect = canvas.getBoundingClientRect();
            missGif.style.left = `${canvasRect.left + targetX * cellSize}px`;
            missGif.style.top = `${canvasRect.top + targetY * cellSize}px`;
            missGif.style.width = `${cellSize}px`;
            missGif.style.height = `${cellSize}px`;
    
            document.body.appendChild(missGif);
    
            setTimeout(() => {
                document.body.removeChild(missGif);
            }, 3000);
        }
    }
    
    function createExplosionEffect(x, y) {
        const cellSize = canvas.width / gridSize;
        const explosionSize = 100;

        const explosionDiv = document.createElement('div');
        explosionDiv.classList.add('explosion');
        explosionDiv.style.position = 'absolute';
        explosionDiv.style.width = `${explosionSize}px`;
        explosionDiv.style.height = `${explosionSize}px`;
        
        const canvasRect = canvas.getBoundingClientRect();
        explosionDiv.style.left = `${canvasRect.left + x * cellSize + (cellSize / 2) - (explosionSize / 2)}px`;
        explosionDiv.style.top = `${canvasRect.top + y * cellSize + (cellSize / 2) - (explosionSize / 2)}px`;

        document.body.appendChild(explosionDiv);

        requestAnimationFrame(() => {
            explosionDiv.classList.add('explode');
        });

        setTimeout(() => {
            explosionDiv.classList.remove('explode');
            explosionDiv.classList.add('fade-out');
           
            setTimeout(() => {
                document.body.removeChild(explosionDiv);
            }, 2000); 
        }, 2000); 
    }
});
