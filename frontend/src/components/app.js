import React, { Component } from "react";
import { createRoot } from "react-dom/client";

export default class App extends Component {
  render() {
    return <h1>Testing React Code</h1>;
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);
