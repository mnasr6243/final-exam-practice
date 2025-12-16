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
    // Get all comic sites for navigation menu and home page
    try {
        const [sites] = await pool.query(`
            SELECT * 
            FROM fe_comic_sites
            ORDER BY comicSiteName
        `);

        // Get a random comic to display on home page 
        const [randRows] = await pool.query(`
            SELECT c.*, s.comicSiteName, s.comicSiteUrl
            FROM fe_comics c
            JOIN fe_comic_sites s 
                ON c.comicSiteId = s.comicSiteId
            ORDER BY RAND() LIMIT 1
        `);
        
        // Render home page with sites and random comic
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
    // Get comic sites for the dropdown menu in the add comic form
    const [sites] = await pool.query("SELECT * FROM fe_comic_sites");
    // Render the add comic page with sites
    res.render("addComic", { sites });
});

// Handles Add Comic Form Submission
app.post("/addComic", async (req, res) => {
    const { title, url, publishDate, site_id } = req.body;

    // Insert new comic into the database
    await pool.query(
        `INSERT INTO fe_comics (comicTitle, comicUrl, comicDate, comicSiteId)
         VALUES (?,?,?,?)`,
        [title, url, publishDate, site_id]
    );
    // Redirect to home page after adding the comic
    res.redirect("/");
});

// Comic Page
app.get("/comicPage/:siteId", async (req, res) => {
    const siteId = req.params.siteId;

    // Get comic site details and all comics for that site to display on the comic page
    const [[site]] = await pool.query(
        `SELECT * FROM fe_comic_sites WHERE comicSiteId = ?`,
        [siteId]
    );

    // Get all comics for the specified site ordered by date
    const [comics] = await pool.query(
        `SELECT * FROM fe_comics WHERE comicSiteId = ? ORDER BY comicDate`,
        [siteId]
    );

    // Render the comic page with site details and comics
    res.render("comicPage", { site, comics });
});

// Add Comment Page
app.get("/addComment/:comicId", async (req, res) => {
    const comicId = req.params.comicId;

    // Get comic details to display on the add comment page
    const [[comic]] = await pool.query(`
        SELECT c.*, s.comicSiteName
        FROM fe_comics c
        JOIN fe_comic_sites s 
            ON c.comicSiteId = s.comicSiteId
        WHERE c.comicId = ?
    `, [comicId]);

    // Render the add comment page with comic details
    res.render("addComment", { comic });
});

// Handles Add Comment Form Submission
app.post("/addComment/:comicId", async (req, res) => {
    const comicId = req.params.comicId;
    const { username, email, comment } = req.body;

    // Insert new comment into the database
    await pool.query(
        `INSERT INTO fe_comments (author, email, comment, comicId)
         VALUES (?, ?, ?, ?)`,
        [username, email, comment, comicId]
    );

    // Get the comic site ID to redirect back to the comic page after adding the comment
    const [[row]] = await pool.query(
        `SELECT comicSiteId FROM fe_comics WHERE comicId = ?`,
        [comicId]
    );

    // Redirect to the comic page after adding the comment
    res.redirect(`/comicPage/${row.comicSiteId}`);
});

// API — Random Comic
// Returns a random comic with its site name for the random comic button on the home page
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
// Returns comments for a specific comic to display in the comments modal on the comic page
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