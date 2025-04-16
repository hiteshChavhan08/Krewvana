"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zod_1 = require("zod");
var cuidSchema = zod_1.z.string().cuid();
var testId = "cm9jhi4wg000gvw98se9bft64";
try {
    cuidSchema.parse(testId);
    console.log("Zod validation passed for: ".concat(testId));
}
catch (error) {
    console.error("Zod validation failed for: ".concat(testId));
    if (error instanceof zod_1.z.ZodError) {
        console.error(error.errors);
    }
}
