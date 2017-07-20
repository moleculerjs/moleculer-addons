"use strict";

const Adapter = require("../../src/memory-adapter");

require("../common/crud.test")(new Adapter());