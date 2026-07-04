const mysql = require('mysql2');
const { database } = require('./config/db');
// connect without database
const connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"raj@0416#"    //   your mysql password
});
// create database
connection.query("CREATE DATABASE IF NOT EXISTS interiord",(err)=>{
    if (err){
        console.error("error creating database:",err);
    } else{
        console.log("Database 'interiord' created or already exists");
    }
    connection.end();
});