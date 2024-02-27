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
    this.add.image(1600, 600, 'background').setDisplaySize(3000, 1200).setScrollFactor(1);

    // Задаємо розміри світу
    this.physics.world.bounds.width = 3000; // Розміри світу для карти паркуру
    this.physics.world.bounds.height = 1200;

    platforms = this.physics.add.staticGroup();

    // Створення базової платформи
    platforms.create(400, 1068, 'platform').setScale(2).refreshBody();

    // Перша серія платформ
    platforms.create(800, 968, 'platform').setScale(1.5).refreshBody();
    platforms.create(1200, 798, 'platform').setScale(1.5).refreshBody();
    platforms.create(1600, 628, 'platform').setScale(1.5).refreshBody();
    platforms.create(2000, 798, 'platform').setScale(1.5).refreshBody();
    platforms.create(2400, 968, 'platform').setScale(1.5).refreshBody();

    // Додавання додаткових платформ вище
    platforms.create(2800, 868, 'platform').setScale(1.5).refreshBody(); // Нова, ще правіше
    platforms.create(2200, 698, 'platform').setScale(1.5).refreshBody(); // Вище і правіше
    platforms.create(1800, 528, 'platform').setScale(1.5).refreshBody(); // Вище, у центрі
    platforms.create(1400, 398, 'platform').setScale(1.5).refreshBody(); // Верхня частина карти
    platforms.create(1000, 268, 'platform').setScale(1.5).refreshBody(); // Верхня частина, лівіше

    // Спавн гравця
    player = this.physics.add.sprite(100, 950, 'hero');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true); // Гравець не випадає з карти

    // Додавання фізики колізії
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

    scoreText = this.add.text(460, 260, 'Score: 0', { fontSize: '32px', fill: '#FFF' }).setScrollFactor(0);

    shells = this.physics.add.group();

    this.physics.add.collider(player, shells, hitBomb, null, this);

    // Налаштування камери
    this.cameras.main.setBounds(0, 0, 3000, 1200); // Задати межі світу для камери
    this.cameras.main.startFollow(player, true, 0.05, 0.05); // Дозволити камері слідкувати за гравцем
    this.cameras.main.setZoom(1.5); // Збільшити масштаб камери для кращого огляду
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
    if (Phaser.Math.Between(0, 100) > 98) {
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
    var x = 3000; // Змінюємо початкову позицію бомби на правий край екрану
    var y = Phaser.Math.Between(0, 1200);
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