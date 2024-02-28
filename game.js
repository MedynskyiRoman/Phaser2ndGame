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
    this.load.image('fon', 'assets/fon.png');
    this.load.spritesheet('hero', 'assets/hero.png', { frameWidth: 32, frameHeight: 48 });
}

var player;
var cursors;
var smokes;
var shells;
var worldWidth = 3000;
var worldHeight = 1200;

function create() {
    //this.add.image(1600, 600, 'background').setDisplaySize(3000, 1200).setScrollFactor(1);

    this.add.tileSprite(0, 0, worldWidth, worldHeight, 'fon').setOrigin(0,0);

    // Задаємо розміри світу
    this.physics.world.bounds.width = worldWidth; // Розміри світу для карти
    this.physics.world.bounds.height = worldHeight;

    platforms = this.physics.add.staticGroup();

    for(var x = 0; x < worldWidth; x = x + 450) {
        console.log(x)
        platforms.create(x, 1100, 'platform').setOrigin(0,0).refreshBody();
    }






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
        repeat: 50, // Збільшуємо кількість цілей для ширшої карти
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    smokes.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(smokes, platforms);
    this.physics.add.overlap(player, smokes, collectStar, null, this);

    scoreText = this.add.text(360, 260, 'Score: 0', { fontSize: '32px', fill: '#FFF' }).setScrollFactor(0);

    shells = this.physics.add.group();

    this.physics.add.collider(player, shells, hitBomb, null, this);

    // Налаштування камери
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight); // Задати межі світу для камери
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
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}

