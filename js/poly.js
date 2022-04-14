const polyDetectUrl =
	"https://hesv-backend.herokuapp.com/equations/get-polynomial-equation";

const polySolveUrl =
	"https://hesv-backend.herokuapp.com/equations/solve-polynomial-equation";

let elt = document.getElementById("calculator");
let calculator = Desmos.GraphingCalculator(
	elt,
	(options = {
		settingsMenu: false,
		keypad: false,
		expressionsTopbar: false,
		expressions: false,
	})
);

let drawer = null;

let inputBox = document.getElementById("poly-eqn");
inputBox.addEventListener("keyup", function (event) {
	calculator.setExpression({ id: "graph1", latex: inputBox.value });
	toggleSolveBtn();
});

//Get the buttons
let sendBtn = document.getElementById("send");
let solveBtn = document.getElementById("solve");

function toggleSendBtn() {
	let imageBase64 = drawer.api.getCanvasAsImage();
	let tooltip = document.getElementById("send-tooltip");
	if (imageBase64) {
		sendBtn.disabled = false;
		tooltip.innerHTML = "Send Image for Inference";
	} else {
		sendBtn.disabled = true;
		tooltip.innerHTML = "Draw Something First!";
	}
}

//Listen for drawing events
let canvas = document.getElementById("canvas-editor");
canvas.addEventListener("click", function (event) {
	toggleSendBtn();
});

function toggleSolveBtn() {
	let eqn = inputBox.value;
	let tooltip = document.getElementById("solve-tooltip");
	if (eqn.length > 0) {
		solveBtn.disabled = false;
		tooltip.innerHTML = "Solve this equation";
	} else {
		solveBtn.disabled = true;
		tooltip.innerHTML = "Enter a equation!";
	}
}

function togglePleaseWait() {
	inputBox.value = "Please Wait...";
}

function sendImage() {
	let imageBase64 = drawer.api.getCanvasAsImage();
	if (imageBase64) {
		let blob = dataURItoBlob(imageBase64);
		let formData = new FormData();
		formData.append("image", blob);

		var requestOptions = {
			method: "POST",
			body: formData,
			redirect: "follow",
		};
		togglePleaseWait();
		fetch(polyDetectUrl, requestOptions)
			.then((response) => response.json())
			.then((result) => polyDetectSuccess(result))
			.catch((error) => console.log("error", error));
	} else {
		alert("Draw Something!!");
	}
}

function solve() {
	if (inputBox.value.length > 0) {
		let formData = new FormData();
		formData.append("equation", inputBox.value);

		var requestOptions = {
			method: "POST",
			body: formData,
			redirect: "follow",
		};
		fetch(polySolveUrl, requestOptions)
			.then((response) => response.json())
			.then((result) => polySolveSuccess(result))
			.catch((error) => console.log("error", error));
	} else {
		alert("Enter Equation");
	}
}

function polyDetectSuccess(result) {
	let equation = result.equation;
	let logs = result.debug_logs;
	console.log(equation, logs);
	calculator.setExpression({ id: "graph1", latex: equation });
	inputBox.value = equation;
	toggleSolveBtn();
}

function polySolveSuccess(result) {
	let solutions = result.solutions;
	let sol_type = result.solution_type;
	let logs = result.debug_logs;

	let solutionsWrapper = document.getElementById("solutions-wrapper");
	solutionsWrapper.innerHTML = "";

	for (let i = 0; i < solutions.length; i++) {
		let solution_div = document.createElement("div");
		solution_div.className = "solution";
		solution_div.innerHTML =
			`X <sub>` + eval(i + 1) + `</sub> = ` + solutions[i];
		solutionsWrapper.appendChild(solution_div);
	}
}

function dataURItoBlob(dataURI) {
	var binary = atob(dataURI.split(",")[1]);
	var array = [];
	for (var i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}
	return new Blob([new Uint8Array(array)], { type: "image/png" });
}

function clearCanvas() {
	drawer = null;
	$("#canvas-editor").empty();
	setupCanvas();
	toggleSendBtn();
}

function setupCanvas() {
	drawer = new DrawerJs.Drawer(
		null,
		{
			texts: customLocalization,
			plugins: ["Pencil", "Eraser"],

			defaultActivePlugin: { name: "Pencil", mode: "lastUsed" },
			pluginsConfig: {
				Eraser: {
					brushSize: 25,
				},
				Pencil: {
					brushSize: 5,
				},
			},
			activeColor: "#000000",
			transparentBackground: false,
			toolbars: {
				drawingTools: {
					positionType: "inside",
				},

				settings: {
					positionType: "inside",
				},
			},
		},

		window.innerWidth * 0.9375,
		window.innerHeight * 0.4
	);
	$("#canvas-editor").append(drawer.getHtml());
	drawer.onInsert();
}

window.onload = function () {
	setupCanvas();
};

window.onresize = function () {
	var width = window.innerWidth * 0.9375;
	var height = window.innerHeight * 0.37037;
	drawer.api.setSize(width, height);
};
