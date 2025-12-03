import 'dotenv/config'; // Importing .env enviroment values
import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
//for Express to get values using the POST method
app.use(express.urlencoded({ extended: true }));
//setting up database connection pool
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', async(req, res) => {
    let sql = `SELECT * 
                FROM fe_comics
                ORDER BY RAND()
                LIMIT 1`;
     const [randomComic] = await pool.query(sql);
     console.log(randomComic);
    res.render('Home.ejs', {randomComic})
});

app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});//dbTest

app.listen(3000, () => {
    console.log("Express server running")
})
