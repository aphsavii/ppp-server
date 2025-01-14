import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { dbPool } from "../connections/pg-connection";
import { QUESTION_TYPES } from "../constants";
import uploadOnCloud from "../utils/uploadOnCloud";

interface Question {
    description: string,
    options: any,
    correct_option: number,
    difficulty_level: number,
    question_type: QUESTION_TYPES,
    format: string,
    topic_tags: any
}

interface filters {
    topic_tags: string[] | null
    question_type: QUESTION_TYPES
    difficulty_level: number,
    sort: 'ASC' | 'DESC'
}


class QuestionController {
    public addQuestion = asyncHandler(async (req: Request, res: Response) => {
        const question: Question = req.body;
        if ( !question.options || !question.correct_option || !question.difficulty_level || !question.question_type || !question.format || !question.topic_tags) {
            return res.status(400).json(new ApiError('All fields are required', 400));
        }

        question.options = question.options.split(',');
        question.topic_tags = question.topic_tags.split(',');

        if (question.format === 'img') {
            const img = req.file?.path;
            if (!img) {
                return res.status(400).json(new ApiError('Image is required', 400));
            }
            const imgPath = await uploadOnCloud.upload(img, "questions");

            question.description = imgPath;
        }
        const client = await dbPool.connect();
        try {
            const { rows } = await client.query(
                `INSERT INTO questions (description, options, correct_option, difficulty_level, question_type, format, topic_tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [question.description, question.options, question.correct_option, question.difficulty_level, question.question_type, question.format, question.topic_tags]
            );
            return res.status(201).json(new ApiResponse('Question added successfully', 201, rows[0]));
        } catch (error) {
            return res.status(500).json(new ApiError((error as Error).message, 500));
        }
        finally {
            client.release();
        }

    });

    public deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
        const id: number = +req.params.id;

        try {
            const { rows } = await dbPool.query(
                "DELETE FROM questions WHERE id=$1 RETURNING *", [id]);
            return res.status(200).json(new ApiResponse("Question deleted successfully", 200, rows[0]))
        } catch (e) {
            return res.status(500).json(new ApiError((e as Error).message, 500));
        }
    });

    public getQuestions = asyncHandler(async (req: Request, res: Response) => {
        const filters: filters = req.body;
        // Get pagination parameters from the request
        const page = parseInt(req.query.page as string, 10) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit as string, 10) || 10; // Default to 10 items per page
        const offset = (page - 1) * limit; // Calculate the offset for pagination

        try {
            let query = `SELECT * FROM questions WHERE 1=1`;
            let countQuery = `SELECT COUNT(*) AS total FROM questions WHERE 1=1`; // Separate query for total count
            let values: any[] = [];
            let index = 1;

            // Add filters dynamically
            if (filters.topic_tags && filters.topic_tags.length>0 ) {
                query += ` AND topic_tags @> $${index}`;
                countQuery += ` AND topic_tags @> $${index}`;
                values.push(filters.topic_tags);
                index++;
            }
            if (filters.question_type) {
                query += ` AND question_type = $${index}`;
                countQuery += ` AND question_type = $${index}`;
                values.push(filters.question_type);
                index++;
            }
            if (filters.difficulty_level) {
                query += ` AND difficulty_level = $${index}`;
                countQuery += ` AND difficulty_level = $${index}`;
                values.push(filters.difficulty_level);
                index++;
            }

            // Add sorting and pagination
            query += ` ORDER BY id ${filters.sort || 'ASC'} LIMIT $${index} OFFSET $${index + 1}`;
            values.push(limit, offset);

            // Execute queries
            const { rows } = await dbPool.query(query, values); // Fetch paginated results
            const { rows: countRows } = await dbPool.query(countQuery, values.slice(0, index - 1)); // Fetch total count
            const total = parseInt(countRows[0].total, 10); // Total number of records

            // Calculate total pages
            const totalPages = Math.ceil(total / limit);

            // Prepare response
            return res.status(200).json(new ApiResponse('Questions retrieved successfully', 200, {
                page,
                totalPages,
                total,
                results: rows,
            }));
        } catch (error) {
            console.error('Error fetching questions:', error);
            return res.status(500).json(new ApiError((error as Error).message, 500));
        }
    });

}



export default new QuestionController();