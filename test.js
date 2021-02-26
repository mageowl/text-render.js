const txr = new TXR({ innerSize: [100, 40], spacing: [0, 0], logXY: true });

txr.add
	.text("Use the arrows keys to collect all the coins.", 0, 0)
	.tag("collision");

let player = txr.add.char("@", 50, 5).setIndex(1).tag("player");

txr.add.rect(0, 0, 99, 39).tag("collision");
txr.add.rect(40, 3, 20, 10).tag("collision");
txr.add.rect(30, 20, 10, 5).tag("collision");
txr.add.rect(60, 29, 10, 10).tag("collision");

txr.add.char("]", 60, 8).tag("door");
txr.add.char("]", 65, 29).tag("door");
txr.add.char("]", 40, 22).tag("door");

let totalCoins = 0;
let coinCount = txr.add
	.text("0x", 98, 0)
	.setAlignment(TextObject.alignment.RIGHT)
	.tag("collision");
txr.add.char("o", 99, 0).tag("coin").tag("collision");

// Coins
txr.add.char("o", 31, 24).tag("coin");
txr.add.char("o", 65, 34).tag("coin");
txr.add.char("o", 96, 38).tag("coin");

txr.render();

let keysPressed = txr.add
	.keys("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown")
	.on("change", updateMovement);
let movement = [0, 0];

function updateMovement(keys) {
	movement = [0, 0];

	if (keys.includes("ArrowRight")) movement[0] = 1;
	if (keys.includes("ArrowLeft")) movement[0] = -1;
	if (keys.includes("ArrowUp")) movement[1] = -1;
	if (keys.includes("ArrowDown")) movement[1] = 1;
}

function update() {
	let cx = txr.data.checkTag(player.x + movement[0], player.y, "collision");
	let cy = txr.data.checkTag(player.x, player.y + movement[1], "collision");

	if (cx) movement[0] = 0;

	if (cy) movement[1] = 0;

	if (
		txr.data.checkTag(
			player.x + movement[0],
			player.y + movement[1],
			"collision"
		) &&
		!cx &&
		!cy
	) {
		movement = [0, 0];
	}

	if (
		txr.data.checkTag(player.x + movement[0], player.y + movement[1], "coin")
	) {
		txr.destroy(
			txr.data.getObj(player.x + movement[0], player.y + movement[1])
		);
		totalCoins++;
		coinCount.text = `${totalCoins}x`;
	}

	player.move(...movement);
	if (JSON.stringify(movement) != "[0,0]") {
		txr.render();
	}
	requestAnimationFrame(update);
}

update();
