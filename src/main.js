class TXR {
	/**
	 * @typedef {Object} TXRConfig
	 * @property {string} canvasID
	 * @property {string} parentID
	 * @property {number[]} innerSize
	 * @property {number} padding
	 * @property {string} font
	 * @property {number} fontSize
	 * @property {number[]} spacing
	 * @property {bool} logXY
	 */

	/**
	 * Default Config
	 *
	 * @static
	 * @memberof TXR
	 * @type {TXRConfig}
	 */
	static defaultConfig = {
		innerSize: [20, 20],
		padding: 10,
		font: "monospace",
		fontSize: 20,
		spacing: [1, 0],
		logXY: false
	};

	/**
	 * Previous data from rendering. Use TXR.data to get values.
	 *
	 * @memberof TXR
	 * @type {RenderData}
	 */
	_prevRenderData = null;

	/**
	 * Creates a TeXt Renderer.
	 * @param {TXRConfig} [config=TXR.defaultConfig]
	 * @memberof TXR
	 */
	constructor(config = TXR.defaultConfig) {
		this._config = config;
		this.add._txr = this;
		this.data._txr = this;

		if (config.canvasID) {
			this._canvas = document.querySelector(`canvas#${config.canvasID}`);
		} else if (config.parentID) {
			const canvas = document.createElement("div");
			canvas.id = "game";
			document.getElementById(config.parentID).appendChild(canvas);
			this._canvas = canvas;
		} else {
			const canvas = document.createElement("div");
			canvas.id = "game";
			document.body.appendChild(canvas);
			this._canvas = canvas;
		}

		const testEl = document.createElement("div");
		testEl.style = `
			position: absolute;
			visibility: hidden;
			height: auto;
			width: auto;
			white-space: nowrap;
			font-size: ${config.fontSize};
			font-family: ${config.font ?? "monospace"};
		`;
		testEl.innerText = "O";

		document.body.appendChild(testEl);

		this._canvas.style = `
			font-size: ${config.fontSize};
			font-family: ${config.font ?? "monospace"};
			width: ${
				testEl.clientWidth *
				config.innerSize[0] *
				((config.spacing ?? [0, 0])[0] + 1)
			};
			height: ${
				testEl.clientHeight *
				config.innerSize[1] *
				((config.spacing ?? [0, 0])[1] + 1)
			};
			white-space: pre;
		`;
	}

	render() {
		let text = new RenderGrid(
			this._config.innerSize[0] * (this._config.spacing[0] + 1),
			this._config.innerSize[1] * (this._config.spacing[1] + 1)
		);

		this.objects
			.sort(({ index: a }, { index: b }) => a - b)
			.forEach(
				/** @param {RenderObject} obj */
				(obj) => {
					let data = obj.render();

					switch (data.type) {
						case "char":
							text.set(
								data.x * (this._config.spacing[0] + 1),
								data.y * (this._config.spacing[1] + 1),
								data.char,
								obj
							);
							break;

						case "rect":
							for (
								let x = 0;
								x <= data.w * (this._config.spacing[0] + 1);
								x++
							) {
								for (
									let y = 0;
									y <= data.h * (this._config.spacing[1] + 1);
									y++
								) {
									let rectX =
										x == 0
											? 0
											: x == data.w * (this._config.spacing[0] + 1)
											? 2
											: 1;
									let rectY =
										y == 0
											? 0
											: y == data.h * (this._config.spacing[1] + 1)
											? 2
											: 1;
									let char = data.rect[rectY * 3 + rectX];
									let locY = data.y * (this._config.spacing[1] + 1) + y;
									let locX = data.x * (this._config.spacing[0] + 1) + x;
									if (char != " " || data.forceBlank)
										if (
											text.grid[locY][locX] == " " ||
											char == " " ||
											text.grid[locY][locX] == char
										)
											text.set(locX, locY, char, obj);
										else text.set(locX, locY, data.intersect, obj);
								}
							}
							break;

						case "string":
							data.text.split("\n").forEach((line, li) => {
								let chars = line.split("");
								(data.align == TextObject.alignment.RIGHT
									? chars.reverse()
									: chars
								).forEach((char, i) => {
									text.set(
										data.x * (this._config.spacing[0] + 1) +
											(data.align == TextObject.alignment.RIGHT ? -i : i),
										data.y * (this._config.spacing[1] + 1) + li,
										char,
										obj
									);
								});
							});
							break;
					}
				}
			);

		text.grid.forEach((l, y) =>
			l.forEach((c, x) => {
				if (c?.length != 1)
					console.warn(
						`Charecter '${c}' at [${x}, ${y}] does not have length of one.`
					);
			})
		);

		this._canvas.innerHTML = text.grid
			.map((l, y) =>
				l
					.map(
						(c, x) =>
							`<span class="${text.tagGrid[y][x]}" ${
								this._config.logXY ? `data-x=${x} data-y=${y}` : ""
							}>${c}</span>`
					)
					.join("")
			)
			.join("\n");

		this._prevRenderData = text;
	}

	destroy(object) {
		if (object instanceof RenderObject) {
			let index = this.objects.indexOf(object);
			if (index != -1) {
				this.objects.splice(index, 1);
			} else
				console.warn("Cannot destroy object: object is not on render list.");
		} else
			throw new TypeError(
				"Cannot destroy object: object is not a instance of RenderObject."
			);
	}

	objects = [];
	add = {
		/** @type {TXR} */
		_txr: null,

		char(char, x, y) {
			const charObj = new CharecterObject(char, x, y);
			this._txr.objects.push(charObj);
			return charObj;
		},

		rect(x, y, w, h, rectChars) {
			const rectObj = new RectangleObject(x, y, w, h, rectChars);
			this._txr.objects.push(rectObj);
			return rectObj;
		},

		text(text, x, y) {
			const textObj = new TextObject(text, x, y);
			this._txr.objects.push(textObj);
			return textObj;
		},

		line(x, y, length, dir, line) {
			const lineObj = new LineObject(x, y, length, dir, line);
			this._txr.objects.push(lineObj);
			return lineObj;
		},

		keys(...keys) {
			let inputObj = new KeyboardInput(...keys);
			return inputObj;
		}
	};

	data = {
		/** @type {TXR} */
		_txr: null,

		checkTag(x, y, tag) {
			return this._txr._prevRenderData.tagGrid[y][x].split(" ").includes(tag);
		},

		getTags(x, y) {
			return this._txr._prevRenderData.tagGrid[y][x].split(" ");
		},

		getObj(x, y) {
			return this._txr._prevRenderData.objGrid[y][x];
		},

		get hasData() {
			return this._txr._prevRenderData != null;
		}
	};
}

class RenderGrid {
	constructor(w, h) {
		this.grid = Array(h)
			.fill("")
			.map(() => Array(w).fill(" "));
		this.tagGrid = Array(h)
			.fill("")
			.map(() => Array(w).fill(""));
		this.objGrid = Array(h)
			.fill("")
			.map(() => Array(w).fill(null));
	}

	/**
	 * Set charect in grid.
	 *
	 * @param {number} x X x, y
	 * @param {number} y Y x, y
	 * @param {*} char Charcter to assign
	 * @param {*} object Object to assign
	 * @memberof RenderGrid
	 */
	set(x, y, char, object) {
		this.grid[y][x] = char;
		this.tagGrid[y][x] = object.tags.join(" ");
		this.objGrid[y][x] = object;
	}

	get(x, y) {
		return this.objGrid[y][x];
	}
}

class RenderObject {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.index = 0;
		this.tags = [];
	}

	move(x, y) {
		this.x += x;
		this.y += y;
		return this;
	}

	setIndex(i) {
		this.index = i;
		return this;
	}

	setPos(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	tag(tag) {
		this.tags.push(tag);
		return this;
	}

	render() {
		return { x: this.x, y: this.y };
	}
}

class CharecterObject extends RenderObject {
	constructor(char, x, y) {
		super(x, y);
		this.char = char;
	}

	setChar(charecter) {
		this.char = charecter;
	}

	render() {
		return { type: "char", ...super.render(), char: this.char };
	}
}

class RectangleObject extends RenderObject {
	constructor(
		x,
		y,
		w,
		h,
		{ vBorder, hBorder, tlCorner, trCorner, blCorner, brCorner, corner } = {
			vBorder: "|",
			hBorder: "-",
			corner: "+"
		}
	) {
		super(x, y);
		this.width = w;
		this.height = h;
		this.intersect = corner ?? tlCorner;
		this.forceBlank = false;
		this.rectString =
			`${tlCorner ?? corner}${hBorder}${trCorner ?? corner}` +
			`${vBorder} ${vBorder}` +
			`${blCorner ?? corner}${hBorder}${brCorner ?? corner}`;
	}

	setRectAsString(rectString) {
		this.rectString = rectString;
		return this;
	}

	setRectAsObject(
		{ vBorder, hBorder, tlCorner, trCorner, blCorner, brCorner, corner } = {
			vBorder: "|",
			hBorder: "-",
			corner: "+"
		}
	) {
		this.rectString =
			`${tlCorner ?? corner}${hBorder}${trCorner ?? corner}` +
			`${vBorder} ${vBorder}` +
			`${blCorner ?? corner}${hBorder}${brCorner ?? corner}`;
		return this;
	}

	setFill(char = " ") {
		this.rectString = char.repeat(9);
		this.intersect = char;
		return this;
	}

	setForceBlank(value = true) {
		this.forceBlank = value;
		return this;
	}

	setIntersect(intersect) {
		this.intersect = intersect;
		return this;
	}

	setBox(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
		return this;
	}

	render() {
		return {
			type: "rect",
			...super.render(),
			rect: this.rectString,
			intersect: this.intersect,
			w: this.width,
			h: this.height,
			forceBlank: this.forceBlank
		};
	}
}

class TextObject extends RenderObject {
	static alignment = {
		LEFT: 0,
		RIGHT: 1
	};

	constructor(text, x, y) {
		super(x, y);
		this.text = text;
		this.align = TextObject.alignment.LEFT;
		this.setIndex(1);
	}

	setText(text) {
		this.text = text;
		return this;
	}

	setAlignment(align) {
		this.align = align;
		return this;
	}

	addChar(char) {
		this.text += char;
		return this;
	}

	render() {
		return {
			type: "string",
			...super.render(),
			text: this.text,
			align: this.align
		};
	}
}

class LineObject extends RenderObject {
	static direction = {
		UP: [0, -1],
		RIGHT: [1, 0],
		DOWN: [0, 1],
		LEFT: [-1, 0]
	};

	constructor(x, y, length, dir = LineObject.direction.RIGHT, char = "-") {
		super(x, y);
		this.length = length;
		this.char = char;
		this.dir = dir;
	}

	setChar(char) {
		this.char = char;
		return this;
	}

	setLine([x1, y1], [x2, y2]) {
		this.x = x1;
		this.y = y1;
		this.dx = x2;
		this.dy = y2;
		return this;
	}

	setLength(length) {
		this.length = length;
		return this;
	}

	render() {
		return {
			type: "rect",
			...super.render(),
			rect: this.char.repeat(9),
			intersect: this.char,
			w: this.length * this.dir[0],
			h: this.length * this.dir[1]
		};
	}
}

class TXREvent extends Array {
	push(listener) {
		if (typeof listener != "function")
			throw new TypeError("Couldn't add listener: Listener is not a function.");
		super.push(listener);
		return this;
	}

	pop(listener) {
		this.splice(
			this.findIndex((l) => l == listener),
			1
		);
	}

	fire(params) {
		this.forEach((listener) => {
			listener(...params);
		});
	}
}

class EventGroup {
	constructor() {
		this.events = {};
	}

	on(event, listener) {
		if (this.events[event] != undefined) {
			this.events[event].push(listener);
		} else {
			this.events[event] = new TXREvent().push(listener);
		}

		return this;
	}

	off(event, listener) {
		if (this.events[event] != undefined) {
			this.events[event].pop(listener);
			return this;
		} else throw new Error(`Unkown listener ${listener} to ${event}.`);
	}

	fire(event, ...params) {
		if (this.events[event] != undefined) {
			this.events[event].fire(params);
			return true;
		} else return false;
	}
}

class KeyboardInput extends EventGroup {
	constructor(...keys) {
		super();
		this.keys = keys;
		this.pressed = Object.fromEntries(keys.map((k) => [k, false]));

		window.addEventListener("keydown", this._keyDown.bind(this));
		window.addEventListener("keyup", this._keyUp.bind(this));
	}

	_keyDown(e) {
		if (this.pressed[e.key] != undefined) {
			this.pressed[e.key] = true;
			this.fire(
				"change",
				Object.entries(this.pressed)
					.map(([k, v]) => (v ? k : null))
					.filter((k) => k != null)
			);
		}
	}
	_keyUp(e) {
		if (this.pressed[e.key] != undefined) {
			this.pressed[e.key] = false;
			this.fire(
				"change",
				Object.entries(this.pressed)
					.map(([k, v]) => (v ? k : null))
					.filter((k) => k != null)
			);
		}
	}
}
