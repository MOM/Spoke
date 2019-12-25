// Must be first imports
import "react-hot-loader";
import "babel-polyfill";

import * as React from "react";
import * as ReactDOM from "react-dom";
const Form = require("react-formal");
const { StyleSheet } = require("aphrodite");
import * as injectTapEventPlugin from "react-tap-event-plugin";

import App from "./App";
import { login, logout } from "./auth-service";
import GSTextField from "../components/forms/GSTextField";
import GSDateField from "../components//forms/GSDateField";
import GSScriptField from "../components//forms/GSScriptField";
import GSScriptOptionsField from "../components//forms/GSScriptOptionsField";
import GSSelectField from "../components//forms/GSSelectField";
import GSPasswordField from "../components//forms/GSPasswordField";

(window as any).AuthService = {
  login,
  logout
};

StyleSheet.rehydrate((window as any).RENDERED_CLASS_NAMES);

Form.addInputTypes({
  string: GSTextField,
  number: GSTextField,
  date: GSDateField,
  email: GSTextField,
  script: GSScriptField,
  scriptoptions: GSScriptOptionsField,
  select: GSSelectField,
  password: GSPasswordField
});

// Needed for MaterialUI
injectTapEventPlugin();

ReactDOM.render(<App />, document.getElementById("mount"));
