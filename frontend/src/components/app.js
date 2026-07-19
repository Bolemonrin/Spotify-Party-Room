/** @format */

import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import Home from "./Home";
import "../../static/css/index.css";
// console.log("Imported styles", styles);

class App extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="center">
				<Home />
			</div>
		);
	}
}

export default App;

const appDiv = createRoot(document.getElementById("app"));
appDiv.render(<App />);
