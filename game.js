// Конфігурація гри
var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var platforms, player, enemies, cursors, smokes, shells, scoreText, livesText, lives, lifeLine, restartButton, mushroom;
var score = 0;
var lives = 3;
var gameOver = false;
var worldWidth = config.width * 2;
var worldHeight = 1080;
var yStart = 315;

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

    livesText = this.add.text(1250, 260, 'Life:' + showLife(), { fontSize: '32px', fill: '#FFF'}).setScrollFactor(0);
    
    createLives(this);
    createMushrooms(this, worldWidth);
    createTrees(this, worldWidth);
    createIslands(this, worldWidth);
    flyIslands();
    initializeEnemies(this);
    createBullets(this);
    setupBulletCollisions(this);

    // Додавання кнопки перезавантаження
    var resetButton = this.add.text(400, 450, 'Reset', { fontSize: '32px', fill: '#FFFFFF' }).setInteractive().setScrollFactor(0);
    resetButton.on('pointerdown', restartGame, this);
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
    if (Phaser.Math.Between(0, 100) > 98) {
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

    updateEnemyMovement(this);
    //shootBullet(this);
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

function createIslands(game, worldWidth) {
    for (var x = 0; x<worldWidth; x = x + Phaser.Math.FloatBetween(400, 500)){
        var y = Phaser.Math.FloatBetween(128, 128*6)
    }
}

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
        y += Phaser.Math.Between(200, 330);
        var yStep = Phaser.Math.Between(1, 3);
        var y = yStart * yStep;

        platforms.create(x, y, 'leftisl').setOrigin(1, 1).setScale(0.5).setSize(64, 46.5).setDepth(10);

        var i;
        var islandLength = Phaser.Math.Between(1, 3); // Визначаємо довжину острова
        for (i = 1; i <= islandLength; i++) {
            platforms.create(x + 64 * i, y, 'midisl').setOrigin(1, 1).setScale(0.5).setSize(64, 46.5).setDepth(10);
        }

        platforms.create(x + 64 * (i), y, 'rghtisl').setOrigin(1, 1).setScale(0.5).setSize(64, 46.5).setDepth(10);
    }
}


//Вороги та постріли

function initializeEnemies(scene) {
    scene.enemies = scene.physics.add.group();
    for(let i = 0; i < 5; i++) {
        var x = Phaser.Math.Between(100, scene.scale.width - 100);
        var y = Phaser.Math.Between(100, scene.scale.height - 100);
        var enemy = scene.enemies.create(x, y, 'enemy');
        enemy.setCollideWorldBounds(true);
    }
}

function updateEnemyMovement(scene) {
    scene.enemies.children.iterate(function(enemy) {
        if (scene.player && enemy) {
            // Тепер, коли ми впевнилися, що scene.player існує, ми можемо безпечно використовувати його координати
            if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y) < 400) {
                scene.physics.moveToObject(enemy, scene.player, 120);
            } else {
                enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
            }
        }
    });
}


function createBullets(scene) {
    scene.bullets = scene.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10
    });
}

// function shootBullet(scene) {
//     if (scene.cursors.space.isDown) {
//         var bullet = scene.bullets.get(scene.player.x, scene.player.y - 20);
//         if (bullet) {
//             bullet.setActive(true).setVisible(true).setVelocityY(-300);
//         }
//     }
// }

function setupBulletCollisions(scene) {
    scene.physics.add.collider(scene.bullets, scene.enemies, function(bullet, enemy) {
        bullet.disableBody(true, true);
        enemy.disableBody(true, true);
    });
}
