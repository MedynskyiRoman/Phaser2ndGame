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

var lives;
var livesText;
var lifeLine;
var restartButton;
var score = 0;
var scoreText;
var gameOver;

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
    this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 48 });
}

var player;
var cursors;
var smokes;
var shells;
var mushroom;
var worldWidth = config.width * 2;
var worldHeight = 1080;
var yStart = 315;

function create() {
    //this.add.image(1600, 600, 'background').setDisplaySize(3000, 1200).setScrollFactor(1);

    this.add.tileSprite(0, 0, worldWidth, worldHeight, 'fon').setOrigin(0,0);

    // Задаємо розміри світу
    this.physics.world.bounds.width = worldWidth; // Розміри світу для карти
    this.physics.world.bounds.height = worldHeight;

    platforms = this.physics.add.staticGroup();

    for(var x = 0; x < worldWidth; x = x + 400) {
       
        platforms.create(x, 1080, 'platform').setOrigin(0,1).refreshBody();
        //console.log('platforms x: ',x)
    }


    createMushrooms(this, worldWidth);
    createTrees(this, worldWidth);
    createIslands(this, worldWidth);
    flyIslands();

    // Створення базової платформи
    //platforms.create(400, 1068, 'platform').setScale(2).refreshBody();
    // Перша серія платформ
    //platforms.create(800, 968, 'platform').setScale(1.5).refreshBody();
    //platforms.create(1200, 798, 'platform').setScale(1.5).refreshBody();
    //platforms.create(1600, 628, 'platform').setScale(1.5).refreshBody();
    //platforms.create(2000, 798, 'platform').setScale(1.5).refreshBody();
    //platforms.create(2400, 968, 'platform').setScale(1.5).refreshBody();
    //platforms.create(2800, 868, 'platform').setScale(1.5).refreshBody();
    //platforms.create(2200, 698, 'platform').setScale(1.5).refreshBody();
    //platforms.create(1800, 528, 'platform').setScale(1.5).refreshBody();
    //platforms.create(1400, 398, 'platform').setScale(1.5).refreshBody();
    //platforms.create(1000, 268, 'platform').setScale(1.5).refreshBody();

    //this.add.text(20, 20, 'Score: 0')







    // Спавн гравця
    player = this.physics.add.sprite(100, 950, 'hero');
    player.setBounce(0.2).setCollideWorldBounds(true).setDepth(2);

    // Додавання фізики колізії
    this.physics.add.collider(player, platforms);

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

    // Додавання кнопки перезавантаження
    var resetButton = this.add.text(400, 450, 'Reset', { fontSize: '32px', fill: '#FFFFFF' }).setInteractive().setScrollFactor(0);
    resetButton.on('pointerdown', restartGame, this);
}

function update() {
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
    shell.disableBody(true, true);

    lives -= 1;
    livesText.setText('Life: ' + showLife());

    if (lives <= 0) {
        livesText.setStyle({ fill: '#ff0000' });
        gameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
    }
}

function createMushrooms(game, worldWidth) {
    const mushrooms = game.physics.add.staticGroup();

    for (let x = 100; x < worldWidth; x += Phaser.Math.Between(200, 800)) {
        // Врахування масштабу при розрахунку Y-позиції, щоб гриби дотикалися до землі
        const scale = Phaser.Math.FloatBetween(0.2, 2);
        console.log('scale: '+ scale)
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

function restartGame() {
    this.scene.restart();
    console.log('restart')
    // score = 0; // Скидання очків до 0
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
