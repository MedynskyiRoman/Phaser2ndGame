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

var score = 0;
var scoreText;
var gameOver;

function preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('smoke', 'assets/smoke.png');
    this.load.image('shell', 'assets/shell.png');
    this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 48 });
}

var player;
var cursors;
var smokes;
var shells;

function create() {
    this.add.image(960, 540, 'background').setDisplaySize(1920, 1080).setScrollFactor(0);

    // Задаємо розміри світу
    this.physics.world.bounds.width = 1920;
    this.physics.world.bounds.height = 1080;

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'platform').setScale(2).refreshBody();

    // Створення додаткових платформ для ширшої карти
    platforms.create(1200, 400, 'platform');
    platforms.create(1600, 250, 'platform');
    platforms.create(2000, 220, 'platform');

    player = this.physics.add.sprite(100, 450, 'hero');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, platforms);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('hero', { start: 1, end: 3 }),
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
        frames: this.anims.generateFrameNumbers('hero', { start: 5, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    smokes = this.physics.add.group({
        key: 'smoke',
        repeat: 24, // Збільшуємо кількість цілей для ширшої карти
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    smokes.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(smokes, platforms);
    this.physics.add.overlap(player, smokes, collectStar, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' }).setScrollFactor(0);

    shells = this.physics.add.group();

    this.physics.add.collider(player, shells, hitBomb, null, this);

    // Налаштування камери, щоб слідувала за гравцем
    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.startFollow(player);
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

    // Рандомне створення бомб, які летять справа наліво
    if (Phaser.Math.Between(0, 100) > 99) {
        createBomb(this);
    }

    // Перевірка чи гравець торкнувся нижньої границі екрана
    if (player.y >= this.game.config.height - player.height) {
        gameOver = true;
        this.physics.pause();
        player.setTint(0xff0000);
    }
}

function collectStar(player, smoke) {
    smoke.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score + '/210');

    // Якщо гравець набрав 210 очок
    if (score >= 210) {
        scoreText.setStyle({ fill: '#00ff00' }); // Змінюємо колір тексту на зелений
        gameOver = true;
        this.physics.pause(); // Зупиняємо фізику гри
    }
}


function createBomb(game) {
    var x = 1920; // Змінюємо початкову позицію бомби на правий край екрану
    var y = Phaser.Math.Between(100, 970);
    var shell = shells.create(x, y, 'shell');
    shell.setVelocity(-Phaser.Math.Between(100, 200), 0); // Напрямок руху бомби наліво
    shell.body.setAllowGravity(false); // Вимкнення гравітації для бомби
}


function hitBomb(player, shell) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}