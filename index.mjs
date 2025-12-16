import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ========================= Database Setup =========================
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10,
    waitForConnections: true
});

// ========================= Routes =========================

// Home Route
app.get('/', async (req, res) => {
    try {
        const [sites] = await pool.query(`
            SELECT * 
            FROM fe_comic_sites
            ORDER BY comicSiteName
        `);

        const [randRows] = await pool.query(`
            SELECT c.*, s.comicSiteName, s.comicSiteUrl
            FROM fe_comics c
            JOIN fe_comic_sites s 
                ON c.comicSiteId = s.comicSiteId
            ORDER BY RAND() LIMIT 1
        `);

        res.render("Home", {
            sites,
            randomComic: randRows[0] || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Home Route Error");
    }
});

// Add Comic Page
app.get("/addComic", async (req, res) => {
    const [sites] = await pool.query("SELECT * FROM fe_comic_sites");
    res.render("addComic", { sites });
});

app.post("/addComic", async (req, res) => {
    const { title, url, publishDate, site_id } = req.body;

    await pool.query(
        `INSERT INTO fe_comics (comicTitle, comicUrl, comicDate, comicSiteId)
         VALUES (?,?,?,?)`,
        [title, url, publishDate, site_id]
    );

    res.redirect("/");
});

// Comic Page
app.get("/comicPage/:siteId", async (req, res) => {
    const siteId = req.params.siteId;

    const [[site]] = await pool.query(
        `SELECT * FROM fe_comic_sites WHERE comicSiteId = ?`,
        [siteId]
    );

    const [comics] = await pool.query(
        `SELECT * FROM fe_comics WHERE comicSiteId = ? ORDER BY comicDate`,
        [siteId]
    );

    res.render("comicPage", { site, comics });
});

// Add Comment Page
app.get("/addComment/:comicId", async (req, res) => {
    const comicId = req.params.comicId;

    const [[comic]] = await pool.query(`
        SELECT c.*, s.comicSiteName
        FROM fe_comics c
        JOIN fe_comic_sites s 
            ON c.comicSiteId = s.comicSiteId
        WHERE c.comicId = ?
    `, [comicId]);

    res.render("addComment", { comic });
});

app.post("/addComment/:comicId", async (req, res) => {
    const comicId = req.params.comicId;
    const { username, email, comment } = req.body;

    await pool.query(
        `INSERT INTO fe_comments (author, email, comment, comicId)
         VALUES (?, ?, ?, ?)`,
        [username, email, comment, comicId]
    );

    const [[row]] = await pool.query(
        `SELECT comicSiteId FROM fe_comics WHERE comicId = ?`,
        [comicId]
    );

    res.redirect(`/comicPage/${row.comicSiteId}`);
});

// API — Random Comic
app.get("/api/randomComic", async (req, res) => {
    const [rows] = await pool.query(`
        SELECT c.*, s.comicSiteName
        FROM fe_comics c
        JOIN fe_comic_sites s 
            ON c.comicSiteId = s.comicSiteId
        ORDER BY RAND() LIMIT 1
    `);
    res.json(rows[0] || null);
});

// API — Modal for Comments
app.get("/api/comments/:comicId", async (req, res) => {
    const comicId = req.params.comicId;
    const [comments] = await pool.query(
        `SELECT * FROM fe_comments WHERE comicId = ?`,
        [comicId]
    );
    res.json(comments);
});

// DBTest Route
app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

// SERVER LISTENING
app.listen(3000, () => console.log("Running at http://localhost:3000"));