const express = require('express');
const mysql = require('mysql2');

const  app = express();

const port = 3000

app.use(express.json)

const connection = mysql.createConnection({
    //host: "192.168.1.250",
    //user: "north",
    //password: "Nakhon@112493317",
    ///database: "h11249" 
    host: "192.168.1.250",
    user: "north",
    password: "Nakhon@112493317",
    database: "h11249"
})

connection.connect((err) => {
    if (err) {
        console.err(" err connecting to navicat " , err );
        return;
    }
    console.log("Connected to navicat successfully ! " )
}) 


app.get("/api", (req , res ) => {
    res.jon ({ patient: ["fname" , "iname"]});
});
app.listen(3000,() => {
    console.log(" server started on port 3000 ");

})

app.get("/patient", (req, res) => {
    const sql = "SELECT fname, lname FROM patient";

    connection.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching patient data:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json(results);   // ส่งข้อมูล JSON กลับไป
    });
});

