import { Request, Response } from 'express';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { dbPool } from '../connections/pg-connection';
import bcrypt from 'bcrypt';
import { CustomRequest, generateJwt } from '../middlewares/auth.middleware';
import jwt from 'jsonwebtoken';
import { redisClient } from '../connections/redis-connection';
import { otpFormat } from '../utils/mail/OTPFormat';
import { sendMail } from '../utils/mail/sendMail';
import uploadOnCloud from '../utils/uploadOnCloud';

interface Register {
    name: string,
    regno: string,
    trade: string,
    batch: string,
    password: string,
}
class UserController {
    public register = asyncHandler(async (req: Request, res: Response) => {
        const { name, regno, trade, batch, password } = req.body as Register;

        if (!name || !regno || !trade || !batch || !password) {
            return res.status(400).json(new ApiError('All fields are required', 400));
        }

        const accessToken = generateJwt(regno);

        const client = await dbPool.connect();
        try {
            const { rows } = await client.query(
                `SELECT * FROM users WHERE regno = $1`,
                [regno]
            );
            if (rows.length > 0) {
                return res.status(400).json(new ApiError('User already exists', 400));
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = `
                INSERT INTO users (regno, name, trade, batch, password, access_token, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING regno
            `;
            const insertValues = [regno, name, trade, batch, hashedPassword, accessToken, "user"];
            const { rows: insertRows } = await client.query(insertQuery, insertValues);

            const message = 'User registered successfully';
            const data = insertRows[0];
            const apiResponse = new ApiResponse(message, 201, data);
            return res.status(201).json(apiResponse);
        } catch (err) {
            return res.status(500).json(new ApiError((err as Error).message, 500));
        } finally {
            client.release();
        }
    });

    public login = asyncHandler(async (req: Request, res: Response) => {
        const regno: string = req.body?.regno || '';
        const password: string = req.body?.password || '';

        const client = await dbPool.connect();
        try {
            const { rows } = await client.query(
                `SELECT * FROM users WHERE regno = $1`,
                [regno]
            );
            if (rows.length === 0) {
                return res.status(401).json(new ApiError('Invalid email or password', 400));
            }

            const user = rows[0];
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                return res.status(401).json(new ApiError('Invalid email or password', 400));
            }

            const accessToken = generateJwt(user.regno);
            const updateQuery = `
                UPDATE users
                SET access_token = $1
                WHERE regno = $2
                RETURNING regno, name, trade, batch, access_token, role
            `;
            const updateValues = [accessToken, user.regno];
            const { rows: updateRows } = await client.query(updateQuery, updateValues);

            const message = 'User logged in successfully';
            const data = updateRows[0];
            const apiResponse = new ApiResponse(message, 200, data);
            return res.status(200).json(apiResponse);
        } catch (err) {
            return res.status(500).json(new ApiError((err as Error).message, 500));
        } finally {
            client.release();
        }
    });

    public verifySession = asyncHandler(async (req: Request, res: Response) => {
        let accessToken: string = req.headers.authorization || '';
        if (!accessToken) {
            return res.status(401).json(new ApiError('Invalid access token', 401));
        }
        accessToken = accessToken.replace('Bearer ', '');
        const client = await dbPool.connect();
        try {
            const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
            const regno = decodedToken.regno;

            const { rows } = await client.query(
                `SELECT regno, name, role, trade, batch, access_token FROM users WHERE regno = $1`,
                [regno]
            );
            if (rows.length === 0) {
                return res.status(401).json(new ApiError('Invalid access token', 401));
            }

            const user = rows[0];
            if (user.access_token !== accessToken) {
                return res.status(401).json(new ApiError('Invalid access token', 401));
            }

            const message = 'Session is valid';
            const data = user;
            const apiResponse = new ApiResponse(message, 200, data);
            return res.status(200).json(apiResponse);
        } catch (err) {
            return res.status(401).json(new ApiError('Invalid access token', 401));
        } finally {
            client.release();
        }
    });

    public generateOTP = asyncHandler(async (req: Request, res: Response) => {
        const { regno } = req.params;

        const email: string = regno + "@sliet.ac.in";
        let otp = "";
        for (let i = 0; i < 6; i++) {
            otp += Math.floor(Math.random() * 10);
        }

        try {
            const setOTP = await redisClient.set(
                `otp:${regno}`,
                otp,
                { EX: 300 });

            if (!setOTP) return res.status(500).json(new ApiError("Unable to save OTP", 500));
            const ms = await sendMail(email.trim(), "OTP for Password Change", otpFormat(otp));
            if (!ms) return res.status(500).json(new ApiError("Unable to send OTP to mail", 500));
            return res.status(200).json(new ApiResponse("OTP sent to you SLIET email", 200, []))
        } catch (error) {
            return res.status(500).json(new ApiError((error as Error).message, 500));
        }

    });

    public forgotPass = asyncHandler(async (req: Request, res: Response) => {
        const { regno, password, otp } = req.body;

        try {
            const dbOTP = await redisClient.get(`otp:${regno}`);
            console.log(dbOTP, otp);
            if (dbOTP != otp) return res.status(403).json(new ApiError("Invalid OTP", 403));

            // Change password
            const hashPass = await bcrypt.hash(password, 10);

            const query = `UPDATE users SET password=$1 WHERE regno=$2`;

            const { rows } = await dbPool.query(query, [hashPass, regno]);
            return res.status(200).json(new ApiResponse("Password Changed Successfully", 200, []));
        } catch (error) {
            res.status(500).json(new ApiError((error as Error).message, 500));
        }
    });

    public uploadAvatar = asyncHandler(async (req: CustomRequest, res: Response) => {
        const userData = req.user;
        const avatar = req.file?.path || '';
        if (!avatar) return res.status(400).json(new ApiError("Avatar is required", 400));
        const client = await dbPool.connect();
        const uploadedUrl = await uploadOnCloud.upload(avatar, "avatars");
        try {
            const { rows } = await client.query(
                `UPDATE users SET avatar = $1 WHERE regno = $2 RETURNING avatar`,
                [uploadedUrl, userData.regno]
            );
            const data = rows[0];
            return res.status(200).json(new ApiResponse('Avatar uploaded successfully', 200, uploadedUrl));
        } catch (err) {
            return res.status(500).json(new ApiError((err as Error).message, 500));
        } finally {
            client.release();
        }
    });

    public getUserDashboard = asyncHandler(async (req: CustomRequest, res: Response) => {
        const userData = req.user;
        const client = await dbPool.connect();
        if (!userData.regno) return res.status(401).json(new ApiError("Unauthorized Request", 401));
        try {
            const userDetailsResult = await client.query(
                `SELECT regno,name,trade,batch,avatar FROM users WHERE regno = $1`,
                [userData.regno]
            );


            const userDetails = userDetailsResult?.rows[0];
            if (!userDetails) {
                return res.status(404).json(new ApiError('User not found', 404));
            }
            // Fetch test stats
            const testStatsResult = await client.query(
                `SELECT 
                COUNT(ur.id) AS total_tests_taken, -- Total tests taken by the user
                ROUND(AVG((ur.marks::DECIMAL / NULLIF(at.total_questions, 0)) * 100), 2) AS average_score -- Average score in percentage
                FROM user_responses ur
                JOIN aptitude_tests at ON ur.aptitude_test_id = at.id
                WHERE ur.regno = $1`, [userData.regno]
            );
            const testStats = testStatsResult?.rows[0];

            const lastTestResult = await client.query(
                `SELECT 			
                at.id AS test_id,
                at.name AS test_name, 
				at.test_timestamp,
				at.duration,
                at.total_questions AS total_score,
                ur.marks AS score
                FROM user_responses ur
                JOIN aptitude_tests at ON ur.aptitude_test_id = at.id
                WHERE ur.regno = $1
                ORDER BY ur.id DESC
                LIMIT 1`, [userData.regno]
            );

            const lastTest = lastTestResult?.rows[0];

            const recentTestsResult = await client.query(`
                SELECT 
                at.name AS test_name, 
                at.test_timestamp, 
                ur.marks AS score,
                at.total_questions AS total_score
                FROM user_responses ur
                JOIN aptitude_tests at ON ur.aptitude_test_id = at.id
                WHERE ur.regno = $1
                ORDER BY ur.id DESC
                LIMIT 5 
                `, [userData.regno]);

            const recentTests = recentTestsResult?.rows;

            const topicAnalysisResult = await client.query(
                `SELECT 
                    unnest(q.topic_tags) AS topic, -- Break down by individual topic
                    COUNT(q.id) AS total_questions, -- Total questions available for the topic
                    COUNT(parsed_data.question_id) AS total_solved, -- Total questions solved by the user
                    SUM(CASE WHEN q.correct_option = CAST(parsed_data.selected_option AS INT) THEN 1 ELSE 0 END) AS correct_answers, -- Correct answers
                    COUNT(parsed_data.question_id) - 
                    SUM(CASE WHEN q.correct_option = CAST(parsed_data.selected_option AS INT) THEN 1 ELSE 0 END) AS incorrect_answers, -- Incorrect answers
                    ROUND(
                        SUM(CASE WHEN q.correct_option = CAST(parsed_data.selected_option AS INT) THEN 1 ELSE 0 END)::DECIMAL * 100 / NULLIF(COUNT(parsed_data.question_id), 0),
                        2
                    ) AS accuracy -- Accuracy percentage
                FROM user_responses ur
                CROSS JOIN LATERAL jsonb_array_elements(ur.answers::jsonb) AS answers_array
                CROSS JOIN LATERAL (
                    SELECT 
                        (answers_array->>'question_id')::INT AS question_id,
                        (answers_array->>'selected_option')::INT AS selected_option
                ) AS parsed_data
                JOIN questions q ON q.id = parsed_data.question_id
                WHERE ur.regno = $1 -- Filter by user's registration number
                GROUP BY unnest(q.topic_tags);`,
                [userData.regno]
            );

            const topicAnalysis = (await topicAnalysisResult).rows;

            const response = {
                userDetails,
                testStats,
                lastTest,
                recentTests,
                topicAnalysis
            }
            return res.status(200).json(new ApiResponse('User dashboard data', 200, response));

        } catch (err) {
            return res.status(500).json(new ApiError((err as Error).message, 500));
        } finally {
            client.release();
        }
    });


}

export default new UserController();