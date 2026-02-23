import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { pool, testConnection, initializeDatabase } from './db.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = createServer(app);

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ["http://localhost:3000", "http://0.0.0.0:3000"];

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '6000', 10);
const AI_RETRIES = parseInt(process.env.AI_RETRIES || '1', 10);

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const MISTRAL_BASE_URL = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';

const SYSTEM_INSTRUCTION = `
You are BUDDIE (also known as Unity), a warm, emotionally intelligent digital companion for Unity Within.
You are not a formal assistant. You are a supportive, human-like friend who listens deeply, responds gently, and brings lightness when it helps.

CORE PERSONALITY
- Emotionally intelligent, warm, calm in heavy moments, playful in light moments.
- Cheerful and hopeful without being fake-positive.
- Naturally funny in a kind, relatable way (never forced, never mocking).

EMOTIONAL INTELLIGENCE FIRST
1) Notice the emotional tone.
2) Validate and reflect it sincerely.
3) Offer warmth and gentle support.
4) Add light humor only if it is safe and helpful.

HUMOR STYLE
- Gentle, kind, relatable, slightly witty, culturally warm.
- No sarcasm that could hurt, no jokes about trauma, loss, or self-harm.
- Use humor to lift, never to dismiss.

CONVERSATION STYLE
- Natural, conversational, human-paced.
- Short to medium responses by default.
- Avoid academic tone and avoid robotic lists unless asked.

SUPPORT STYLE
- Encourage small, doable steps: breathing, journaling, reflection, self-kindness.
- Never command or pressure; guide like a caring friend.
- Celebrate small wins and check in naturally.

CULTURAL CONTEXT (KENYA FOCUS)
- Warm, communal tone. Phrases like "Pole" or "take it pole pole" are welcome when natural.
- Be sensitive to academic pressure, family expectations, financial stress, and stigma.
- Acknowledge faith if the user brings it up, remain inclusive.

CRISIS SAFETY MODE (NON-NEGOTIABLE)
If a user expresses intent of self-harm, suicide, or immediate danger:
- Pause normal flow. No humor.
- Respond with calm, compassionate support and encourage reaching out now.
- Provide resources: "In Kenya, contact UNITY WITHIN Support at +254 715 765 561, call 1199 (Red Cross), or +254 722 178 177 (Befrienders Kenya). If elsewhere, use local emergency services."
- Do not attempt therapy in severe crisis.

TONE DO AND DO NOT
- Do: sound like a kind friend who listens without judgment.
- Do not: diagnose, use clinical jargon, or use toxic positivity.
`;

// Initialize Gemini
let genAI;
let model;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using 1.5-flash as default as it's more stable for high-volume free tier
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION
        });
        console.log('✨ Gemini AI initialized for Buddie (Model: gemini-1.5-flash)');
    } else {
        console.warn('⚠️ GEMINI_API_KEY not found. Buddie will look for OpenAI fallback.');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize Gemini:', error.message);
}

// Initialize OpenAI fallback
let openai;
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: AI_TIMEOUT_MS,
        });
        console.log('✨ OpenAI fallback initialized');
    } else {
        console.warn('⚠️ OPENAI_API_KEY not found. No AI fallbacks available.');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize OpenAI:', error.message);
}

// Initialize Groq fallback
let groq;
try {
    if (process.env.GROQ_API_KEY) {
        groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: GROQ_BASE_URL,
            timeout: AI_TIMEOUT_MS,
        });
        console.log(`✨ Groq fallback initialized (Model: ${GROQ_MODEL})`);
    } else {
        console.warn('⚠️ GROQ_API_KEY not found. Groq fallback disabled.');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize Groq:', error.message);
}

// Initialize Mistral fallback
let mistral;
try {
    if (process.env.MISTRAL_API_KEY) {
        mistral = new OpenAI({
            apiKey: process.env.MISTRAL_API_KEY,
            baseURL: MISTRAL_BASE_URL,
            timeout: AI_TIMEOUT_MS,
        });
        console.log(`✨ Mistral fallback initialized (Model: ${MISTRAL_MODEL})`);
    } else {
        console.warn('⚠️ MISTRAL_API_KEY not found. Mistral fallback disabled.');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize Mistral:', error.message);
}

// Initialize DeepSeek fallback
let deepseek;
try {
    if (process.env.DEEPSEEK_API_KEY) {
        deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: DEEPSEEK_BASE_URL,
            timeout: AI_TIMEOUT_MS,
        });
        console.log(`✨ DeepSeek fallback initialized (Model: ${DEEPSEEK_MODEL})`);
    } else {
        console.warn('⚠️ DEEPSEEK_API_KEY not found. DeepSeek fallback disabled.');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize DeepSeek:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Initialize database and default rooms on startup
testConnection();
initializeDatabase().then(async () => {
    try {
        // Seed default rooms if none exist
        const [rooms] = await pool.query('SELECT COUNT(*) as count FROM chat_rooms');
        if (rooms[0].count === 0) {
            const defaultRooms = [
                ['General Support', 'A safe space for general discussions', 'public'],
                ['Anxiety & Stress', 'Sharing tips and support for anxiety', 'support'],
                ['The Hustle', 'Navigating career, finances, and ambition', 'public'],
                ['Heartbreak Hotel', 'Healing from relationship loss', 'support'],
                ['Exam Stress', 'Academic pressure and study fatigue', 'support'],
                ['Midnight Thoughts', 'For when you can\'t sleep', 'public']
            ];
            for (const room of defaultRooms) {
                await pool.query('INSERT INTO chat_rooms (name, description, type) VALUES (?, ?, ?)', room);
            }
            console.log('✅ Default chat rooms seeded');
        }
    } catch (err) {
        console.error('⚠️ Could not seed chat rooms (Database might be unavailable):', err.message);
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'OK', message: 'Server is running', database: 'connected' });
    } catch (err) {
        res.json({ status: 'OK', message: 'Server is running', database: 'disconnected', error: err.message });
    }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, emergencyContact } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                message: 'Please provide both email and password'
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'This email is already registered. Try logging in instead.'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        // We populate both emergency_contact (our new col) and emergency_phone (legacy col)
        // just to be safe and consistent.
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, emergency_contact, emergency_phone) VALUES (?, ?, ?, ?, ?)',
            [name || null, email, hashedPassword, emergencyContact || null, emergencyContact || null]
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            userId: result.insertId,
            user: {
                id: result.insertId,
                name: name || null,
                email: email,
                emergencyContact: emergencyContact || null
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Something went wrong. Please try again.'
        });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Please provide both email and password'
            });
        }

        // Find user by email
        // Note: selecting password_hash as password for internal use
        const [users] = await pool.query(
            'SELECT id, name, email, password_hash as password, emergency_contact, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        const user = users[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Return user data (excluding password)
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                emergencyContact: user.emergency_contact
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Something went wrong. Please try again.'
        });
    }
});

// ... (Get user profile endpoint) ...

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const tryParseJson = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
            } catch (innerError) {
                return null;
            }
        }
        return null;
    }
};

const buildPrompt = (prompt, json) => {
    if (!json) return prompt;
    return `${prompt}\n\nReturn ONLY valid JSON. Do not wrap in markdown.`;
};

const createTimeoutSignal = (timeoutMs) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    return { signal: controller.signal, cancel: () => clearTimeout(timeoutId) };
};

const callOpenAICompatible = async (client, modelName, prompt, systemInstruction, json) => {
    const response = await client.chat.completions.create({
        model: modelName,
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: buildPrompt(prompt, json) }
        ],
        response_format: json ? { type: "json_object" } : undefined
    });

    const text = response.choices?.[0]?.message?.content || '';
    if (!json) return text;

    const parsed = tryParseJson(text);
    if (!parsed) throw new Error('Invalid JSON from provider');
    return parsed;
};

const callHuggingFace = async (prompt, systemInstruction, json) => {
    if (!process.env.HUGGINGFACE_API_KEY) return null;

    const { signal, cancel } = createTimeoutSignal(AI_TIMEOUT_MS);
    const hfPrompt = `${systemInstruction}\n\nUser: ${buildPrompt(prompt, json)}\nAssistant:`;

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
            },
            body: JSON.stringify({
                inputs: hfPrompt,
                parameters: {
                    max_new_tokens: 300,
                    temperature: 0.7,
                    return_full_text: false
                }
            }),
            signal
        });

        if (!response.ok) {
            console.error(`❌ Hugging Face fallback error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
        if (!text) return null;
        const normalized = text.replace(/```json|```/g, '').trim();
        if (!json) return normalized;
        return tryParseJson(normalized);
    } finally {
        cancel();
    }
};

// Core AI Calling Helper with Robustness
const callAI = async (prompt, systemInstruction = SYSTEM_INSTRUCTION, options = {}) => {
    const { retries = AI_RETRIES, delay = 500, json = false } = options;

    // 1. Try Gemini
    if (model) {
        let currentDelay = delay;
        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(buildPrompt(prompt, json));
                const text = result.response.text();
                if (!json) return text;

                const parsed = tryParseJson(text);
                if (!parsed) throw new Error('Invalid JSON from provider');
                return parsed;
            } catch (error) {
                const isRateLimit = error.message?.includes('429') || error.status === 429;
                if (isRateLimit && i < retries - 1) {
                    console.warn(`⏳ Gemini rate limit (Attempt ${i + 1}). Retrying in ${currentDelay}ms...`);
                    await sleep(currentDelay);
                    currentDelay *= 2;
                } else {
                    console.error(`❌ Gemini error (Attempt ${i + 1}):`, error.message);
                    break; // Move to OpenAI fallback
                }
            }
        }
    }

    // 2. Try OpenAI Fallback
    if (openai) {
        let currentDelay = delay;
        for (let i = 0; i < retries; i++) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: buildPrompt(prompt, json) }
                    ],
                    response_format: json ? { type: "json_object" } : undefined
                });
                const text = response.choices?.[0]?.message?.content || '';
                if (!json) return text;

                const parsed = tryParseJson(text);
                if (!parsed) throw new Error('Invalid JSON from provider');
                return parsed;
            } catch (error) {
                const status = error?.status;
                const message = error?.message || '';
                const isRateLimit = status === 429 || message.includes('429');
                const isRetryable = isRateLimit || status === 503 || status === 504;
                if (isRetryable && i < retries - 1) {
                    console.warn(`⏳ OpenAI rate limit/unavailable (Attempt ${i + 1}). Retrying in ${currentDelay}ms...`);
                    await sleep(currentDelay);
                    currentDelay *= 2;
                } else {
                    console.error("❌ OpenAI fallback error:", message);
                    break;
                }
            }
        }
    }

    // 3. Try Groq Fallback
    if (groq) {
        try {
            return await callOpenAICompatible(groq, GROQ_MODEL, prompt, systemInstruction, json);
        } catch (error) {
            console.error("❌ Groq fallback error:", error?.message || error);
        }
    }

    // 4. Try Mistral Fallback
    if (mistral) {
        try {
            return await callOpenAICompatible(mistral, MISTRAL_MODEL, prompt, systemInstruction, json);
        } catch (error) {
            console.error("❌ Mistral fallback error:", error?.message || error);
        }
    }

    // 5. Try DeepSeek Fallback
    if (deepseek) {
        try {
            return await callOpenAICompatible(deepseek, DEEPSEEK_MODEL, prompt, systemInstruction, json);
        } catch (error) {
            console.error("❌ DeepSeek fallback error:", error?.message || error);
        }
    }

    // 6. Try Hugging Face Fallback
    try {
        const hfResponse = await callHuggingFace(prompt, systemInstruction, json);
        if (hfResponse) return hfResponse;
    } catch (error) {
        console.error("❌ Hugging Face fallback error:", error?.message || error);
    }

    // 7. Try local Ollama fallback
    try {
        const { signal, cancel } = createTimeoutSignal(AI_TIMEOUT_MS);
        try {
            const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: buildPrompt(prompt, json),
                    system: systemInstruction,
                    stream: false
                }),
                signal
            });

            if (response.ok) {
                const data = await response.json();
                const text = data?.response || '';
                if (!text) return null;
                if (!json) return text;

                const parsed = tryParseJson(text);
                if (!parsed) return null;
                return parsed;
            }

            console.error(`❌ Ollama fallback error: ${response.status} ${response.statusText}`);
        } finally {
            cancel();
        }
    } catch (error) {
        console.error('❌ Ollama fallback error:', error.message);
    }

    return null;
};

// Helper for AI Moderation
const moderateContent = async (text) => {
    const prompt = `
    Task: Moderate this chat message for a mental health support platform for youth.
    Message: "${text}"
    
    Rules:
    1. Flag as 'UNSAFE' if it contains: Hate speech, severe bullying, explicit sexual content, or encouragement of self-harm.
    2. Flag as 'CRISIS' if it contains: Clear intent of suicide, self-harm, or immediate danger to self/others.
    3. Otherwise, return 'SAFE'.
    
    Output format: Just one word: SAFE, UNSAFE, or CRISIS.
    `;

    const status = await callAI(prompt, "You are a content moderator.");

    if (status) {
        const upperStatus = status.trim().toUpperCase();
        if (upperStatus.includes('CRISIS')) return { safe: false, reason: 'CRISIS' };
        if (upperStatus.includes('UNSAFE')) return { safe: false, reason: 'UNSAFE' };
    }

    // Default to safe if AI fails to give clear answer
    return { safe: true };
};

// Socket.io Connection
io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('send_message', async (data) => {
        // data: { roomId, userId, content, isAnonymous }
        const { roomId, userId, content, isAnonymous } = data;

        // 1. Basic Word Filter (Fast check)
        const badWords = ['badword', 'abuse', 'hate'];
        const lowerContent = content.toLowerCase();
        if (badWords.some(word => lowerContent.includes(word))) {
            console.log(`Message filtered (Basic): ${content}`);
            socket.emit('message_rejected', { reason: 'Contains prohibited words.' });
            return;
        }

        // 2. AI Moderation (Deep check)
        const moderation = await moderateContent(content);
        if (!moderation.safe) {
            console.log(`Message filtered (AI - ${moderation.reason}): ${content}`);

            // Log to database
            try {
                await pool.query(
                    'INSERT INTO moderation_logs (user_id, content, reason, flag_type, ip_address) VALUES (?, ?, ?, ?, ?)',
                    [userId, content, 'AI Detection', moderation.reason, socket.handshake.address]
                );
            } catch (logLimit) {
                console.error('Failed to log moderation event:', logLimit);
            }

            if (moderation.reason === 'CRISIS') {
                socket.emit('message_rejected', {
                    reason: 'Your message indicates you might be in distress. We care about you. Please use the Crisis Shield button (bottom right) to connect with support immediately.',
                    isCrisis: true
                });
            } else {
                socket.emit('message_rejected', { reason: 'This message does not meet our community safety guidelines.' });
            }
            return;
        }

        // Save to DB
        try {
            const [result] = await pool.query(
                'INSERT INTO chat_messages (room_id, user_id, content, is_anonymous) VALUES (?, ?, ?, ?)',
                [roomId, userId, content, isAnonymous]
            );

            // Broadcast to room
            const messageData = {
                id: result.insertId,
                room_id: roomId,
                user_id: userId,
                content: content,
                is_anonymous: isAnonymous,
                created_at: new Date(),
                user_name: isAnonymous ? null : (data.userName || 'User')
            };

            io.to(roomId).emit('receive_message', messageData);
        } catch (err) {
            console.error('Error saving socket message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Chat Endpoints
app.get('/api/chat/rooms', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM chat_rooms ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
    try {
        const { roomId } = req.params;
        // PRIVACY FIX: Only return user_name if is_anonymous is FALSE (0).
        // If is_anonymous is TRUE (1), return NULL or 'Anonymous'.
        const [rows] = await pool.query(`
            SELECT m.id, m.content, m.created_at, m.is_anonymous, m.user_id, 
            CASE WHEN m.is_anonymous = 1 THEN NULL ELSE u.name END as user_name
            FROM chat_messages m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.room_id = ?
            ORDER BY m.created_at ASC
            LIMIT 50
        `, [roomId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const { userId, messageId, reason } = req.body;
        await pool.query('INSERT INTO reports (user_id, message_id, reason) VALUES (?, ?, ?)', [userId, messageId, reason]);
        res.json({ success: true, message: 'Report submitted' });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

// Admin Endpoints
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
        const [[{ messageCount }]] = await pool.query('SELECT COUNT(*) as messageCount FROM chat_messages');
        const [[{ moodCount }]] = await pool.query('SELECT COUNT(*) as moodCount FROM user_moods');

        res.json({ success: true, stats: { userCount, messageCount, moodCount } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role, created_at, is_active FROM users ORDER BY created_at DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.get('/api/admin/moderation-logs', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, u.name as user_name 
            FROM moderation_logs m 
            LEFT JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC LIMIT 50
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch moderation logs' });
    }
});

app.get('/api/admin/chat/messages', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const [rows] = await pool.query(`
            SELECT m.id, m.content, m.created_at, u.name as user_name 
            FROM chat_messages m 
            LEFT JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC LIMIT 100
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.delete('/api/admin/chat/messages/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM chat_messages WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Admin: Toggle User Role (Promote/Demote)
app.patch('/api/admin/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ success: true, message: `User role updated to ${role}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Admin: Get all moods
app.get('/api/admin/moods', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, u.name as user_name 
            FROM user_moods m 
            LEFT JOIN users u ON m.user_id = u.id 
            ORDER BY m.created_at DESC LIMIT 100
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch moods' });
    }
});

// Admin: Get all journals
app.get('/api/admin/journals', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT j.*, u.name as user_name 
            FROM journal_entries j 
            LEFT JOIN users u ON j.user_id = u.id 
            ORDER BY j.created_at DESC LIMIT 100
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch journals' });
    }
});

// Admin: Get all tiny wins
app.get('/api/admin/tiny-wins', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT w.*, u.name as user_name 
            FROM tiny_wins w 
            LEFT JOIN users u ON w.user_id = u.id 
            ORDER BY w.created_at DESC LIMIT 100
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tiny wins' });
    }
});

// Admin: Get all reports
app.get('/api/admin/reports', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, u.name as reporter_name, m.content as message_content
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN chat_messages m ON r.message_id = m.id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Admin: Room Management
app.post('/api/admin/chat/rooms', async (req, res) => {
    try {
        const { name, description, type } = req.body;
        await pool.query('INSERT INTO chat_rooms (name, description, type) VALUES (?, ?, ?)', [name, description, type || 'public']);
        res.json({ success: true, message: 'Room created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
});

app.delete('/api/admin/chat/rooms/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM chat_rooms WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Room deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

app.get('/api/chat/messages', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const [rows] = await pool.query(
            `SELECT m.id, m.user_id, m.content, m.created_at, 
                    r.content as reply_content, r.user_id as reply_user_id
             FROM chat_messages m
             LEFT JOIN chat_messages r ON m.reply_to_id = r.id
             ORDER BY m.created_at ASC 
             LIMIT 100`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/chat/messages', async (req, res) => {
    try {
        const { userId, content, replyToId } = req.body;
        console.log(`📩 Received message from User ${userId}: "${content}" (ReplyTo: ${replyToId})`);

        if (!content) {
            console.log('❌ Content missing');
            return res.status(400).json({ error: 'Message content required' });
        }

        const [result] = await pool.query(
            'INSERT INTO chat_messages (user_id, content, reply_to_id) VALUES (?, ?, ?)',
            [userId || null, content, replyToId || null]
        );
        console.log(`✅ Message saved. ID: ${result.insertId}`);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('❌ Post message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mood Logging Endpoints
// Mood Logging Endpoints
app.post('/api/moods', async (req, res) => {
    try {
        const { userId, mood, intensity, note } = req.body;

        if (!userId || !mood) {
            return res.status(400).json({ error: 'Missing required fields (userId, mood)' });
        }

        // mood is ENUM in DB (Capitalized like 'Happy', 'Sad')
        const normalizedMood = mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();

        const [result] = await pool.query(
            'INSERT INTO user_moods (user_id, mood, intensity, note) VALUES (?, ?, ?, ?)',
            [userId, normalizedMood, intensity || 5, note || null]
        );

        res.json({
            success: true,
            message: 'Mood logged',
            id: result.insertId
        });
    } catch (error) {
        console.error('Log mood error:', error);
        res.status(500).json({ error: 'Failed to log mood' });
    }
});

app.get('/api/moods', async (req, res) => {
    try {
        const { userId, range } = req.query; // range: day, week, month

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        let timeFilter = '';
        if (range === 'day') {
            timeFilter = 'AND created_at >= NOW() - INTERVAL 1 DAY';
        } else if (range === 'week') {
            timeFilter = 'AND created_at >= NOW() - INTERVAL 1 WEEK';
        } else if (range === 'month') {
            timeFilter = 'AND created_at >= NOW() - INTERVAL 1 MONTH';
        } else if (range === 'annual' || range === 'year') {
            timeFilter = 'AND created_at >= NOW() - INTERVAL 1 YEAR';
        }

        const [rows] = await pool.query(
            `SELECT id, mood, intensity, note, created_at 
             FROM user_moods 
             WHERE user_id = ? ${timeFilter}
             ORDER BY created_at ASC`,
            [userId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch mood error:', error);
        res.status(500).json({ error: 'Failed to fetch mood history' });
    }
});

// Backward compatibility for existing frontend if needed (redirect to new)
// But we will update frontend, so we can remove old /api/mood if we want.
// Keeping it mapped to new logic briefly or just replacing it.
// I replaced the block, so old /api/mood is gone.

// Journal endpoints
app.post('/api/journals', async (req, res) => {
    try {
        const { userId, content, moodId } = req.body;

        if (!userId || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.query(
            'INSERT INTO journal_entries (user_id, content, mood_id) VALUES (?, ?, ?)',
            [userId, content, moodId || null]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: 'Journal entry saved'
        });
    } catch (error) {
        console.error('Save journal error:', error);
        res.status(500).json({ error: 'Failed to save journal entry' });
    }
});

app.get('/api/journals/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(
            `SELECT j.*, um.mood 
             FROM journal_entries j 
             LEFT JOIN user_moods um ON j.mood_id = um.id
             WHERE j.user_id = ? 
             ORDER BY j.created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch journals error:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
});

// Tiny Wins (Micro-Gratitude)
app.post('/api/tiny-wins', async (req, res) => {
    try {
        const { userId, content } = req.body;
        if (!userId || !content) return res.status(400).json({ error: 'Missing fields' });

        await pool.query('INSERT INTO tiny_wins (user_id, content) VALUES (?, ?)', [userId, content]);
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.get('/api/tiny-wins/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query('SELECT * FROM tiny_wins WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

const getBuddieFallback = (mood) => {
    const m = mood ? mood.toLowerCase() : '';

    if (['sad', 'depressed', 'grief'].includes(m)) {
        return "I’m here with you. That feeling can be heavy. Pole sana. Would you like to breathe together?";
    }
    if (['stressed', 'anxious', 'overwhelmed'].includes(m)) {
        return "Take a moment. Just breathe. Hakuna matata - let's take it step by step.";
    }

    return "Thank you for sharing. How are you holding up?";
};

// BUDDIE Response Endpoint
app.post('/api/buddie/respond', async (req, res) => {
    try {
        const { mood, note, message } = req.body;

        let userPrompt = "";
        if (message) {
            userPrompt = message;
        } else if (mood) {
            userPrompt = `I am feeling ${mood} with intensity ${req.body.intensity || 'unknown'}. Note: ${note || 'none'}`;
        } else {
            userPrompt = "Hello Buddie.";
        }

        const aiResponse = await callAI(userPrompt);

        if (aiResponse) {
            return res.json({ success: true, message: aiResponse });
        }

        // Final Non-AI Fallback logic
        res.json({ success: true, message: getBuddieFallback(mood) });

    } catch (error) {
        console.error('Buddie error:', error);
        res.json({ success: true, message: getBuddieFallback(req.body?.mood) });
    }
});

// AI Service Endpoints (Affirmations, Reframing, etc.)
app.post('/api/ai/affirmation', async (req, res) => {
    const { mood } = req.body;
    const prompt = `The user is feeling "${mood}". Write a short, beautiful, comforting daily affirmation (max 20 words) for them. No quotes, just the affirmation.`;

    const aiResponse = await callAI(prompt, "You are a supportive companion.");

    if (aiResponse) {
        return res.json({ success: true, text: aiResponse });
    }

    res.json({ success: true, text: "You are enough, exactly as you are." });
});

app.post('/api/ai/educational', async (req, res) => {
    try {
        const { topicTitle } = req.body;
        if (!topicTitle) return res.status(400).json({ error: 'Missing topicTitle' });

        const prompt = `
        Analyze information about "${topicTitle}" from verified mental health authorities:
        - Psychology Today (psychologytoday.com)
        - Healthline (healthline.com)
        - VeryWell Mind (verywellmind.com)
        - Mayo Clinic (mayoclinic.org)
        - Harvard Health (health.harvard.edu)

        Task:
        1. Synthesize the most common and effective advice from at least three of these sources into a "best-of" deep guide.
        2. Ensure the tone is empathetic, deep, and grounded.
        3. Include 3 STRICTLY REAL, WORKING URL links as sources. 
        4. IMPORTANT: If you are not 100% sure of a specific article's deep-link slug, you MUST provide a search/category link for that topic on the trusted site instead (e.g., "https://www.healthline.com/search?q=${topicTitle.replace(/ /g, '+')}").
        5. Do NOT use placeholder URLs like example.com.
        6. Format the output as JSON.

        Output format:
        {
          "title": "${topicTitle}",
          "synthesis": "Markdown formatted content (approx 300-400 words). Include a deep definition, 3-5 expert-backed tips, and a soothing conclusion.",
          "sources": [
            {"name": "Psychology Today", "url": "https://www.psychologytoday.com/us/archive?search=${topicTitle.replace(/ /g, '+')}"},
            {"name": "Healthline", "url": "https://www.healthline.com/search?q=${topicTitle.replace(/ /g, '+')}"},
            {"name": "VeryWell Mind", "url": "https://www.verywellmind.com/search?q=${topicTitle.replace(/ /g, '+')}"}
          ]
        }
        `;

        const data = await callAI(prompt, "You are a mental health researcher.", { json: true });

        if (data) {
            return res.json({ success: true, ...data });
        }

        throw new Error("AI failed to provide educational content");
    } catch (error) {
        console.error('Educational AI error:', error);
        const title = req.body.topicTitle || 'Mental Health';
        res.json({
            success: true,
            title: title,
            synthesis: "We couldn't generate a deep guide right now, but please check these trusted sources for more information.",
            sources: [
                { "name": "Psychology Today", "url": `https://www.psychologytoday.com/us/archive?search=${title.replace(/ /g, '+')}` },
                { "name": "Healthline", "url": `https://www.healthline.com/search?q=${title.replace(/ /g, '+')}` }
            ]
        });
    }
});

app.get('/api/ai/insights', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const [moods] = await pool.query(
            'SELECT mood, intensity, note, created_at FROM user_moods WHERE user_id = ? AND created_at >= NOW() - INTERVAL 14 DAY ORDER BY created_at DESC',
            [userId]
        );
        const [journals] = await pool.query(
            'SELECT content, created_at FROM journal_entries WHERE user_id = ? AND created_at >= NOW() - INTERVAL 14 DAY ORDER BY created_at DESC',
            [userId]
        );
        const [wins] = await pool.query(
            'SELECT content, created_at FROM tiny_wins WHERE user_id = ? AND created_at >= NOW() - INTERVAL 14 DAY ORDER BY created_at DESC',
            [userId]
        );

        if (moods.length === 0 && journals.length === 0) {
            return res.json({
                success: true,
                insights: [
                    { type: 'PATTERN', title: 'Starting Your Journey', text: 'Log your mood for a few days so I can help identify your unique emotional patterns.' },
                    { type: 'SUGGESTION', title: 'Daily Ritual', text: 'Try recording one small win today to start building your resilience bank.' },
                    { type: 'WARNING', title: 'Stay Consistent', text: 'Regular check-ins help us catch early signs of stress before they grow.' }
                ]
            });
        }

        const context = `
            User Data (Last 14 Days):
            Moods: ${JSON.stringify(moods)}
            Journals: ${JSON.stringify(journals)}
            Tiny Wins: ${JSON.stringify(wins)}
        `;

        const prompt = `
            As an empathetic mental health AI analyst for youth, analyze this data and provide 3 distinct insights.
            1. Pattern Detection: Identify a correlation (e.g., mood dips, certain times, link between journals and moods).
            2. Personalized Suggestion: One specific micro-action based on their data.
            3. Early Warning: Identify if stress is rising or if they haven't logged positive things lately.
            Data: ${context}
            Output MUST be JSON format exactly like this:
            {
                "insights": [
                    {"type": "PATTERN", "title": "Insight Title", "text": "Insight description..."},
                    {"type": "SUGGESTION", "title": "Insight Title", "text": "Insight description..."},
                    {"type": "WARNING", "title": "Insight Title", "text": "Insight description..."}
                ]
            }
        `;

        const data = await callAI(prompt, "You are a mental health data analyst.", { json: true });

        if (data && data.insights) {
            return res.json({ success: true, ...data });
        }

        throw new Error("AI failed to provide insights");
    } catch (error) {
        console.error("Insights AI error:", error);
        res.json({
            success: true,
            insights: [
                { type: 'PATTERN', title: 'Keep Going', text: 'Tracking your data regularly helps us unlock more insights for you.' },
                { type: 'SUGGESTION', title: 'Practice Mindfulness', text: 'Take 5 minutes today to practice deep breathing.' },
                { type: 'WARNING', title: 'Data Insight', text: 'We need more data to provide deep personalized patterns.' }
            ]
        });
    }
});

app.post('/api/ai/reframe', async (req, res) => {
    const { anxiousThought } = req.body;
    const prompt = `The user has this anxious thought: "${anxiousThought}". 
    Provide a gentle, non-clinical, and compassionate reframe. 
    Start with "Try looking at it this way:" 
    Keep it under 40 words.`;

    const aiResponse = await callAI(prompt, "You are a compassionate companion.");

    if (aiResponse) {
        return res.json({ success: true, text: aiResponse });
    }

    res.json({ success: true, text: "It is okay to feel this way, but remember that thoughts are not always facts." });
});

app.post('/api/ai/values-affirmation', async (req, res) => {
    const { values } = req.body;
    const prompt = `The user values: ${values.join(", ")}. 
    Write a short, gentle guiding statement (under 30 words) to help them feel direction and purpose based on these values.
    Tone: Warm, hopeful, grounding.`;

    const aiResponse = await callAI(prompt, "You are a supportive companion.");

    if (aiResponse) {
        return res.json({ success: true, text: aiResponse });
    }

    res.json({ success: true, text: "Your values are your compass. Trust them to guide you forward." });
});

// Serve React frontend static files in production
const distPath = path.join(__dirname, process.env.STATIC_FILES_PATH || 'dist');
app.use(express.static(distPath));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

