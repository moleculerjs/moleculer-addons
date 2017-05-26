"use strict";

let mongoose 		= require("mongoose");
let Schema 			= mongoose.Schema;

let PostSchema = new Schema({
	title: {
		type: String,
		trim: true
	},
	content: {
		type: String,
		trim: true
	},
	votes: {
		type: Number,
		default: 0
	},
	author: {
		type: Schema.ObjectId
	}	

}, {
	timestamps: true
});

module.exports =mongoose.model("Post", PostSchema);