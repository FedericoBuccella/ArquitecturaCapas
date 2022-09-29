import path from'path'
import util from'util'
import { transporter } from '../config/mailer.js';
import envioSms from '../twilio/sms.js'
import mainWhatsapp from '../twilio/whatsapp.js'
import logger from "../config/winston.js"
import os from'os';
const cpus = os.cpus();
const port = process.env.PORT || 3000

import * as url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const getLogin = (req, res) => {
  if (req.isAuthenticated()) {
    let user = req.user;
    //console.log("user logueado");
    if (user.username === "admin") {
      res.render("post-product", {
        title: user.title,
        price: user.price,
        thumbnail: user.thumbnail
      })
    }else{
      res.redirect("/api/home")
    } 
  }else {
        console.log("user NO logueado");
        res.sendFile(path.join(__dirname, "../../views/login.html"));
  }
}

export const getUserInfo = (req, res)=>{ 
  const {email, firstName, address, edad, phone, avatar} = req.user
  res.render('infoUser',{email, firstName, address, edad, phone, avatar})
}

export const getHome = (req, res) => {
  let user = req.user
  res.render("login-ok", {
    usuario: user.username,
    nombre: user.firstName,
    apellido: user.lastName,
    email: user.email,
    avatar: user.avatar
  })
}

export const getSignup = (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/register.html"));
}

export const postRegister = async (req, res) =>  {
    let user = req.user
    console.log(user)

    await transporter.sendMail({
      from: '"Usuario Creado!👻" <cornejo.francodavid@gmail.com>', // sender address
      to: req.user.email, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: `Nuevo Registro de ${req.user.firstName} - ${req.user.username} \n
      <h1>Datos de Registro</h1>
      <ul>
        <li>E-mail: ${req.user.email} </li>
        <li>Nombre: ${req.user.firstName} </li>
        <li>Dirección: ${req.user.address} </li>
        <li>Edad: ${req.user.edad} </li>
        <li>Teléfono: ${req.user.phone} </li>
        <li>avatar: http://localhost:8080/image/${req.user.avatar}  </li>
     </ul>`, // html body
    });

    const mensaje = "Usuario creado con exito"
    envioSms(req.user.phone, mensaje)
    mainWhatsapp(mensaje)

    res.sendFile(path.join(__dirname, "../../views/register-ok.html"))
}

export const postLogin = (req, res) => {
    let user = req.user
    res.redirect('/api/home')
}

export const getFailsignup = (req, res) => {
  console.log("error en signup");
  res.render("signup-error", {});

}

export const getFaillogin = (req, res) => {
  console.log("error en login");
  res.render("login-error", {});
}

export const getLogout = (req, res) => {
  req.logout((e)=>{console.log(e)});
  res.sendFile(path.join(__dirname, "../../views/login.html"))
}

export function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/api/login");
  }
}

export const rutaProtegida = (req, res) => {
  const { user } = req;
  console.log(user);
  res.send("<h1>Ruta protegida!</h1>")
}

export const info = (req, res) => {
    try {
        res.send(`
            <h1>Informacion relevante: </h1>
            <ul>
                <li>Argumentos de entrada: ${port}</li>
                <li>Nombre de la plataforma: ${process.platform}</li>
                <li>Version de Node: ${process.version}</li>
                <li>Memoria total reservada: ${util.inspect(process.memoryUsage(),{
                    showHidden: false,
                    depth: null,
                    colors: true
                })}</li>
                <li>Path de ejecucion: ${process.execPath}</li>
                <li>Process ID: ${process.pid}</li>
                <li>Carpeta del proyecto: ${process.cwd()}</li>
                <li>Numero de procesadores: ${os.cpus().length}</li>
            </ul>`)
    } catch (error) {
      logger.error('Error al buscar la informacion del sistema: ', error)
    }
}