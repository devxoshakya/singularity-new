import { Hono } from "hono";
import {
	getResultByRollNoController,
	getResultsByYearController,
} from "../controllers/result.controller";

const resultRouter = new Hono();

// GET /api/result/by-rollno?rollNo=XXX - Get result by roll number
resultRouter.get("/by-rollno", getResultByRollNoController);

// GET /api/result/by-year?year=1&page=1&perPage=10 - Get all students by year with pagination
resultRouter.get("/by-year", getResultsByYearController);

export default resultRouter;
