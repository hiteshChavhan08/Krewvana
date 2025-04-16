import { z } from 'zod';

const cuidSchema = z.string().cuid();
const testId = "cm9jhi4wg000gvw98se9bft64";

try {
    cuidSchema.parse(testId);
    console.log(`Zod validation passed for: ${testId}`);
} catch (error) {
    console.error(`Zod validation failed for: ${testId}`);
    if (error instanceof z.ZodError) {
        console.error(error.errors);
    }
}