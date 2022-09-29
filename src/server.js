import dotenv from 'dotenv'
dotenv.config()
import express from'express';
const app = express();
import rutas from './rutas/index.js'
import session from 'express-session'
import passport from 'passport'
import bcrypt from 'bcrypt'
import exphbs from 'express-handlebars'
import { Strategy as LocalStrategy } from "passport-local";
import mongoose from 'mongoose'
import Usuario from './models/models.js'
import os from'os';
import cluster from"cluster";
const cpus = os.cpus();
const iscluster = process.argv[3] == "cluster";
import logger from'./config/winston.js'

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.engine(".hbs", exphbs({ 
    extname: ".hbs", 
    defaultLayout: "main.hbs", 
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true
    } 
  })
);
app.set("view engine", ".hbs");

app.use(express.static(__dirname + "../views"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: "coderhouse",
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 20000,
    },
    rolling: true,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
  
function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

function isValidPassword(reqPassword, hashedPassword) {
  return bcrypt.compareSync(reqPassword, hashedPassword);
}

const registerStrategy = new LocalStrategy(
  {passReqToCallback: true},

  async (req, username, password, done) =>{
      try{
          const userExist = await Usuario.findOn({username})

          if(!userExist){
              
            return done("Nombre de usuario ya creado", false)
          
          }else{

            const nuevoUsuario = {
                username: username,
                password: hashPassword(password),
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                address: req.body.address,
                edad: req.body.edad,
                phone: req.body.phone,
                avatar: req.file
            }

            const crearUsuario = await Usuario.create(nuevoUsuario)
            return done(null, crearUsuario)
          }
      }catch(err){
          logger.log('Error: ', err)
          done(err)
      }
  }
)

const loginStrategy = new LocalStrategy(
  async(username, password, done) => {
      const user = await Usuario.findOne({username})

      if(!user || !isValidPassword(password, user.password)){
          return done("Credenciales invalidas", null)
      }

      return done(null, user)
  }
)

passport.use("register", registerStrategy)
passport.use("login", loginStrategy)

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Usuario.findById(id, done);
});

if (iscluster && cluster.isPrimary) {
  cpus.map(() => {
    cluster.fork();
  });

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);

    cluster.fork();
  });
} else {
  app.use("/api", rutas);
      
      const URL = process.env.URL_MONGO;
      mongoose.connect( URL,{ useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
          
          if (iscluster && cluster.isPrimary) {
              cpus.map(() => {
              cluster.fork();
              });
          
              cluster.on("exit", (worker) => {
              console.log(`Worker ${worker.process.pid} died`);
          
              cluster.fork();
              });
          } else {
              console.log('BASE DE DATOS CONECTADA')
              app.listen(process.env.PORT || 3000, (err) => {
                  if(!err){
                      console.log(`Server listening port 3000 - Worker: ${process.pid}`)
                  }else {
                      console.log('Error al escuchar el puerto')
                  }
              })
          }
      })
}


app.use((req, res, next)=>{
  const { url, method } = req;
  logger.warn(`Método ${method} URL ${url} inexistente`);
  }
  )