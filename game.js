// Конфігурація гри
var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var platforms, player, enemies, cursors, smokes, shells, scoreText, livesText, lives, lifeLine, restartButton, mushroom, enemyCountText;
var score = 0;
var lives = 3;
var gameOver = false;
var worldWidth = config.width * 2;
var worldHeight = 1080;
var yStart = 800;

function preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('smoke', 'assets/smoke.png');
    this.load.image('shell', 'assets/shell.png');
    this.load.image('fon', 'assets/fon.png');
    this.load.image('mushroom', 'assets/Mushroom.png');
    this.load.image('tree', 'assets/Tree.png');
    this.load.image('leftisl', 'assets/left_island.png');
    this.load.image('rghtisl', 'assets/right_island.png');
    this.load.image('midisl', 'assets/middle_island.png');
    this.load.image('live', 'assets/live.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 48 });
}


function create() {

    this.add.tileSprite(0, 0, worldWidth, worldHeight, 'fon').setOrigin(0,0);
    this.physics.world.bounds.width = worldWidth; // Розміри світу для карти
    this.physics.world.bounds.height = worldHeight;

    platforms = this.physics.add.staticGroup();
    for(var x = 0; x < worldWidth; x = x + 400) {
        platforms.create(x, 1080, 'platform').setOrigin(0,1).refreshBody();
    }

    // Спавн гравця
    player = this.physics.add.sprite(100, 950, 'hero');
    if (player) {
        player.setBounce(0.2).setCollideWorldBounds(true).setDepth(2);
        this.physics.add.collider(player, platforms);
    }

    cursors = this.input.keyboard.createCursorKeys();
    if (cursors) {
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
        }
    }

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'hero', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('hero', { start: 5, end: 6 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    smokes = this.physics.add.group({
        key: 'smoke',
        repeat: 50, // Збільшуємо кількість цілей для ширшої карти
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    smokes.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setDepth(10);
    });

    this.physics.add.collider(smokes, platforms);
    this.physics.add.overlap(player, smokes, collectStar, null, this);

    scoreText = this.add.text(360, 260, 'Score: ' + score + '/400', { fontSize: '32px', fill: '#FFF' }).setScrollFactor(0);

    shells = this.physics.add.group();

    this.physics.add.collider(player, shells, hitBomb, null, this);

    // Налаштування камери
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight); // Задати межі світу для камери
    this.cameras.main.startFollow(player, true, 0.05, 0.05); // Дозволити камері слідкувати за гравцем
    this.cameras.main.setZoom(1.5); // Збільшити масштаб камери для кращого огляду


    lives = 3; //Кількість життів
    
    createLives(this);
    createMushrooms(this, worldWidth);
    createTrees(this, worldWidth);
    flyIslands();
    createEnemies(this);

    // Додавання колізій для ворогів з платформами
    this.physics.add.collider(enemies, platforms);

    // Створення текстового об'єкта для відображення кількості ворогів
    enemyCountText = this.add.text(1250, 300, '', { fontSize: '32px', fill: '#FFF' }).setScrollFactor(0);


    // Додавання кнопки перезавантаження
    var resetButton = this.add.text(400, 450, 'Reset', { fontSize: '32px', fill: '#FFFFFF' }).setInteractive().setScrollFactor(0);
    resetButton.on('pointerdown', restartGame, this);

    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10 // Максимальна кількість снарядів, які можуть бути на екрані одночасно
    });
    
    this.physics.add.collider(player, enemies, playerHitEnemy, null, this);

    livesText = this.add.text(1250, 260, 'Life:' + showLife(), { fontSize: '32px', fill: '#FFF'}).setScrollFactor(0);
}

function update() {
    if (player && cursors){
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}
    // Рандомне створення ядер, які летять справа наліво
    if (Phaser.Math.Between(0, 100) > 95) {
        createBomb(this);
    }

    // Перевірка чи гравець торкнувся нижньої границі екрана
    if (player.y >= worldHeight - player.height) {
        gameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);
    }

    if (lives <= 0) {
        gameOver = true;
        // Зупиняємо гру
        this.physics.pause();
        player.setTint(0xff0000);
        livesText.setStyle({ fontSize: '32px', fill: '#FF0000' });
    }

    moveEnemies(this);

    // Оновлення тексту для відображення кількості активних ворогів
    enemyCountText.setText('Enemies: ' + enemies.countActive(true));

    if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
        shootBullet(this);
    }    
}

function collectStar(player, smoke) {
    smoke.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score + '/400');

    // Якщо гравець набрав 400 очок
    if (score >= 400) {
        scoreText.setStyle({ fill: '#00ff00' }); // Змінюємо колір тексту на зелений
        gameOver = true;
        this.physics.pause(); // Зупиняємо фізику гри
    }
}


function createBomb(game) {
    var x = worldWidth; // Змінюємо початкову позицію ядра на правий край екрану
    var y = Phaser.Math.Between(0, worldHeight);
    var shell = shells.create(x, y, 'shell');
    shell.setVelocity(-Phaser.Math.Between(100, 200), 0); // Напрямок руху ядра наліво
    shell.body.setAllowGravity(false); // Вимкнення гравітації для ядра
    shells.setDepth(10);
}


function hitBomb(player, shell) {
    if (player && shell) {
        shell.disableBody(true, true);
        lives -= 1;
        updateLivesDisplay();
    }
}

function createMushrooms(game, worldWidth) {
    const mushrooms = game.physics.add.staticGroup();

    for (let x = 100; x < worldWidth; x += Phaser.Math.Between(200, 800)) {
        // Врахування масштабу при розрахунку Y-позиції, щоб гриби дотикалися до землі
        const scale = Phaser.Math.FloatBetween(0.2, 2);
        const mushroom = mushrooms.create(x, 1080-32, 'mushroom').setOrigin(0, 1).setScale(scale);
        mushrooms.setDepth(1);
    }
}

function createTrees(game, worldWidth) {
    const trees = game.physics.add.staticGroup();

    for (let x = 0; x < worldWidth; x += Phaser.Math.Between(300, 900)) {
        const scale = Phaser.Math.FloatBetween(0.8, 1.2);
        const tree = trees.create(x, game.scale.height - 32, 'tree').setOrigin(0, 1).setScale(scale);

        // Встановлення глибини дерев за гравцем
        tree.setDepth(Phaser.Math.Between(1, 4));
    }
}

// function createIslands(game, worldWidth) {
//     for (var x = 0; x<worldWidth; x = x + Phaser.Math.FloatBetween(400, 500)){
//         var y = Phaser.Math.FloatBetween(128, 128*6)
//     }
// }

function createLives(game) {
    const livesGroup = game.physics.add.group();
    
    for (let x = 2000; x < worldWidth; x += 2000) {
        livesGroup.create(x, game.scale.height - 100, 'live').setOrigin(0.5, 1).setDepth(5);
    }

    game.physics.add.collider(livesGroup, platforms);
    game.physics.add.overlap(player, livesGroup, collectLife, null, game);
}

function collectLife(player, life) {
    life.disableBody(true, true);
    lives += 1;
    livesText.setText('Life: ' + showLife());
}

function updateLivesDisplay() {
    if (livesText) {
        livesText.setText('Life: ' + showLife());
    }
}

function restartGame() {
    this.scene.restart();
    score = 0;
    // lives = 3; // Скидання кількості життів до початкової кількості
}

function showLife() {
    var lifeLine = ''

    for (var i = 0; i < lives; i++) {
        lifeLine += '❤'
    }
    return lifeLine
}

function flyIslands() {
    var x = 0;
    while (x < worldWidth) {
        x += Phaser.Math.Between(400, 500); // Додаємо випадкову відстань до x для наступного острова
        //y += Phaser.Math.Between(200, 330);
        var yStep = Phaser.Math.Between(-1, 0);
        var y = yStart - 128 * yStep;

        platforms.create(x, y, 'leftisl').setOrigin(1, 1).setScale(0.5).setSize(64, 46.5).setDepth(10);

        var i;
        var islandLength = Phaser.Math.Between(1, 3); // Визначаємо довжину острова
        for (i = 1; i <= islandLength; i++) {
            platforms.create(x + 64 * i, y, 'midisl').setOrigin(1, 1).setScale(0.5).setSize(64, 46.5).setDepth(10);
        }

        platforms.create(x + 64 * (i), y, 'rghtisl').setOrigin(1, 1).setScale(0.5).setSize(64, 46.5).setDepth(10);
    }
}

// Додавання ворогів
function createEnemies(game) {
    enemies = game.physics.add.group();
    const numberOfEnemies = game.scale.width / 100; // Один ворог на кожні 100 пікселів ширини
    
    for (let i = 0; i < numberOfEnemies; i++) {
        const x = Phaser.Math.Between(100, worldWidth - 100);
        const y = Phaser.Math.Between(100, worldHeight - 100);
        const enemy = enemies.create(x, y, 'enemy');
        enemy.setBounce(0.2).setCollideWorldBounds(true).setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
        enemies.setDepth(Phaser.Math.Between(2));
    }
}

function moveEnemies(game) {
    enemies.children.iterate(function(enemy) {
        // Переміщення до гравця, якщо в межах зони агресії
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y) < 400) {
            const direction = player.x < enemy.x ? -100 : 100;
            enemy.setVelocityX(direction);

            // Стрибок, якщо гравець вище
            if (player.y < enemy.y - 100 && enemy.body.touching.down) {
                enemy.setVelocityY(-300);
            }
        }
    });
}

function shootBullet(game) {
    var bullet = bullets.get();
    if (bullet) {
        bullet.enableBody(true, player.x, player.y, true, true);
        bullet.setVelocityX(300);
        //bullet.body.allowGravity = false;

        // Додавання колізій для снарядів
        game.physics.add.collider(bullet, enemies, bulletHitEnemy, null, game);
        game.physics.add.collider(bullet, platforms, bulletHitPlatform, null, game);
        game.physics.add.collider(bullet, shells, bulletHitBomb, null, game);
    }
}

function shootBullet(game) {
    var bullet = bullets.get(player.x, player.y);
    if (bullet) {
        bullet.enableBody(true, player.x, player.y, true, true);
        bullet.setActive(true).setVisible(true);
        bullet.body.allowGravity = false;
        bullet.setDepth(2);

        // Використовуємо останній напрямок руху гравця для визначення напрямку стрільби
        var bulletSpeed = player.body.velocity.x < 0 ? -300 : 300; // Напрямок стрільби
        bullet.setVelocityX(bulletSpeed);

        // Додавання колізій для снарядів
        game.physics.add.collider(bullet, enemies, bulletHitEnemy, null, game);
        game.physics.add.collider(bullet, platforms, bulletHitPlatform, null, game);
        game.physics.add.collider(bullet, shells, bulletHitBomb, null, game);

        // Встановлення дальності польоту кулі
        game.time.delayedCall(1000, function() { // 1000 мс = 1 секунда дальності польоту
            if (bullet.active) {
                bullet.disableBody(true, true); // Видаляємо снаряд з гри
            }
        }, [], game);
    }
}


function bulletHitEnemy(bullet, enemy) {
    bullet.disableBody(true, true); // або bullet.destroy(); для видалення об'єкта
    enemy.disableBody(true, true); // або enemy.destroy();
}

function bulletHitPlatform(bullet, platform) {
    bullet.disableBody(true, true); // або bullet.destroy();
}

function bulletHitBomb(bullet, shell) {
    bullet.disableBody(true, true); // або bullet.destroy();
    shell.disableBody(true, true); // або bomb.destroy();
}

function playerHitEnemy(player, enemy) {
    enemy.disableBody(true, true);
    lives -= 1;
    updateLivesDisplay();
}
