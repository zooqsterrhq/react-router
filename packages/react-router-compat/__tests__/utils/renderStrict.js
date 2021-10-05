import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";

import StrictMode from "./StrictMode.js";

function renderStrict(element, node) {
  act(() => {
    ReactDOM.render(<StrictMode>{element}</StrictMode>, node);
  });
}

export default renderStrict;
