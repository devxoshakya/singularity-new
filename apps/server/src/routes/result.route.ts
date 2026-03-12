import { Hono } from "hono";
import {
	getResultByRollNoController,
	getResultsByYearController,
	getStudentsCacheController,
} from "../controllers/result.controller";

const resultRouter = new Hono();

// GET /api/result/cache - Get all student records with minimal fields for caching
resultRouter.get("/cache", getStudentsCacheController);

// GET /api/result/by-rollno?rollNo=XXX - Get result by roll number
resultRouter.get("/by-rollno", getResultByRollNoController);

// GET /api/result/by-year?year=1 - Get all students by year
resultRouter.get("/by-year", getResultsByYearController);

export default resultRouter;
